import Fastify from 'fastify';
import bearerAuthPlugin from '@fastify/bearer-auth';
import Database from 'better-sqlite3-multiple-ciphers';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import fs from 'fs';
export class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(capacity: number, tokensPerSecond: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = tokensPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  public async consume(tokensToConsume: number = 1): Promise<boolean> {
    this.refill();
    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      return true;
    }
    return false;
  }
}

// IRIS-H-136: Configure bodyLimit for larger LIS payloads
const app = Fastify({ logger: true, bodyLimit: 5242880 }); // 5 MB

// IRIS-H-140: RFC 7807 Problem Details for all errors
app.setErrorHandler(function (error, request, reply) {
  this.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    type: error.name || 'internal_error',
    title: error.message || 'An unexpected error occurred',
    detail: error.stack ? error.message : undefined,
    status: statusCode
  });
});

function getIrisUserDataPath() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'IRIS');
  } else if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'IRIS');
  } else {
    return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'IRIS');
  }
}

const storagePath = getIrisUserDataPath();
const dbPath = path.join(storagePath, 'iris-offline.db');
const keyPath = path.join(storagePath, 'iris.key');

// ── Read the SQLCipher key ────────────────────────────────────────────────────
// The LIS API runs as a plain Node process (no Electron / safeStorage).
// It can only read the key when iris.key contains the plaintext hex fallback
// (written when safeStorage is unavailable, e.g. headless / service account).
// When safeStorage IS available, the desktop app encrypts iris.key with the
// OS keychain — in that scenario the LIS API cannot and should not decrypt it;
// the operator must run the API under the same interactive user session as
// the desktop app so that safeStorage wraps/unwraps transparently.
// We detect the plaintext fallback by its format: exactly 64 hex characters.
function readLisKey(): string | null {
  if (!fs.existsSync(keyPath)) return null;
  const raw = fs.readFileSync(keyPath);
  const str = raw.toString('utf8').trim();
  if (str.length === 64 && /^[0-9a-f]{64}$/i.test(str)) {
    return str; // plaintext hex key
  }
  // File is safeStorage-encrypted — cannot read outside Electron.
  return null;
}

const keyHex = readLisKey();

// Open the database with SQLCipher key applied before any query.
const db = new Database(dbPath);

if (keyHex) {
  // C-007: Apply cipher key — must happen before sqlite_master is touched.
  db.pragma(`cipher='sqlcipher'`);
  db.pragma(`key="x'${keyHex}'"`);
} else {
  // No readable key: attempt to open as plaintext (dev/test without encryption).
  // If the DB is encrypted this will throw at the schema check below and exit.
  console.warn(
    '[LIS API] WARNING: iris.key not readable as plaintext hex. ' +
    'If the database is SQLCipher-encrypted this process will exit. ' +
    'Ensure the LIS API runs under the same user session as the IRIS desktop app.'
  );
}

// IRIS-H-127 & IRIS-H-128: WAL, Busy Timeout, and Foreign Keys
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='institutions'").get();
  if (!tableExists) {
    app.log.error('Database schema is absent. Please run the desktop app first to initialize the database.');
    process.exit(1);
  }
} catch (e: any) {
  app.log.error('Failed to open database. It may be encrypted or absent: ' + e.message);
  process.exit(1);
}


// IRIS-H-137: Bypass auth for health endpoint by registering it BEFORE bearer plugin
app.get('/v1/health', async () => {
  return { status: 'ok', version: '1.1.0', mode: 'LIS-network' };
});

// IRIS-H-135: /v1/version or /v1/models endpoint
app.get('/v1/models', async () => {
  return {
    success: true,
    models: [
      { category: 'haematology', version: 'v1.0.0-int8', format: 'onnx' },
      { category: 'parasitology', version: 'v1.1.0-fp16', format: 'onnx' }
    ]
  };
});

// Register Bearer Auth
app.register(bearerAuthPlugin, {
  auth: async (token) => {
    try {
      const row = db.prepare('SELECT is_active FROM api_tokens WHERE token = ?').get(token) as any;
      return row && row.is_active === 1;
    } catch (e) {
      return false;
    }
  }
});

// IP Allowlist Hook
app.addHook('onRequest', async (request, reply) => {
  // Skip hook for health route
  if (request.url === '/v1/health') return;

  const ip = request.ip;
  let allowedIps = ['127.0.0.1', '::1'];
  try {
    const inst = db.prepare("SELECT metadata FROM institutions LIMIT 1").get() as any;
    if (inst && inst.metadata) {
      const metadata = JSON.parse(inst.metadata);
      if (metadata.lisAllowedIps && Array.isArray(metadata.lisAllowedIps)) {
         allowedIps = allowedIps.concat(metadata.lisAllowedIps);
      }
    }
  } catch (e) {}

  if (!allowedIps.includes(ip)) {
    return reply.status(403).send({ type: 'forbidden', title: 'Forbidden', detail: 'IP not in allowlist.', status: 403 });
  }
});

// Audit Hook
app.addHook('onResponse', async (request, reply) => {
  if (request.url === '/v1/health') return;
  const method = request.method;
  const url = request.url;
  const ip = request.ip;
  const status = reply.statusCode;
  const agent = request.headers['user-agent'] || 'unknown';
  try {
    const inst = db.prepare("SELECT id FROM institutions LIMIT 1").get() as any;
    if (inst) {
      db.prepare(`
        INSERT INTO audit_log (id, user_id, institution_id, action, entity_type, local_ip_or_null, metadata, created_at)
        VALUES (?, 'system', ?, 'lis_api_request', 'api', ?, ?, datetime('now'))
      `).run(crypto.randomUUID(), inst.id, ip, JSON.stringify({ method, url, status, agent }));
    }
  } catch (e: any) {
    app.log.error('Audit log failed: ' + e);
  }
});

const syncBucket = new TokenBucket(100, 10);

app.post('/v1/patients/sync', async (request, reply) => {
  if (!(await syncBucket.consume(1))) {
    return reply.status(429).send({ type: 'rate_limit', title: 'Too Many Requests', detail: 'Bulk upload rate limit exceeded.', status: 429 });
  }

  const body = (request.body as any) || {};
  const { externalPatientId, name, dob, gender, requestingClinician, clinicalNotes, sampleType, testRequests } = body;

  if (!externalPatientId || !name || !Array.isArray(testRequests)) {
    return reply.status(400).send({
      type: 'invalid_request',
      title: 'Missing Required Fields',
      detail: 'externalPatientId, name, and testRequests (array) are required.',
      status: 400
    });
  }

  try {
    const institution = db.prepare("SELECT id FROM institutions LIMIT 1").get() as any;
    if (!institution) throw new Error("Institution not configured in database.");

    const patientId = crypto.randomUUID();
    let actualPatientId = patientId;
    
    db.transaction(() => {
      const existing = db.prepare('SELECT id FROM patients WHERE patient_code = ?').get(externalPatientId) as any;
      
      if (existing) {
        actualPatientId = existing.id;
      } else {
        db.prepare(`
          INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, hospital_number, consent_given, consent_signature_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'lis-sync')
        `).run(actualPatientId, externalPatientId, institution.id, name, dob, gender, externalPatientId);
      }

      // IRIS-H-133: Dedup against in-flight tests
      const existingInFlight = db.prepare(`
        SELECT tr.test_name FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        WHERE s.patient_id = ? AND tr.status IN ('requested', 'in_progress', 'review', 'ai_result')
      `).all(actualPatientId).map((row: any) => row.test_name);

      const testsToCreate = testRequests.filter(t => !existingInFlight.includes(t.testName));
      if (testsToCreate.length === 0) return; // All requested tests are already in-flight

      const sampleId = crypto.randomUUID();
      // IRIS-H-132: Create metadata on samples
      db.prepare(`
        INSERT INTO samples (id, patient_id, institution_id, priority, status, sample_type, requesting_clinician, clinical_notes)
        VALUES (?, ?, ?, 'routine', 'requested', ?, ?, ?)
      `).run(sampleId, actualPatientId, institution.id, sampleType || 'Blood', requestingClinician || null, clinicalNotes || null);

      for (const test of testsToCreate) {
        // IRIS-H-131: Use testCategory from request if available
        const category = test.testCategory || 'haematology';
        db.prepare(`
          INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
          VALUES (?, ?, ?, ?, 'requested')
        `).run(crypto.randomUUID(), sampleId, category, test.testName);
      }
    })();

    // IRIS-H-130: Return actualPatientId
    return { success: true, irisPatientId: actualPatientId, message: "Patient and tests synced to local Worklist." };
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({ type: 'server_error', title: 'Server Error', detail: error.message, status: 500 });
  }
});

app.get('/v1/results/:externalPatientId', async (request, reply) => {
  if (!(await syncBucket.consume(1))) {
    return reply.status(429).send({ type: 'rate_limit', title: 'Too Many Requests', detail: 'Results query rate limit exceeded.', status: 429 });
  }

  const { externalPatientId } = request.params as any;

  // IRIS-H-134: Include model metadata
  const results = db.prepare(`
    SELECT r.id, r.status, r.edited_findings, r.interpretive_comment, r.approved_at, r.verification_code,
           tr.test_name, u.full_name as approved_by_name,
           ai.model_version, ai.dataset_version, ai.processing_duration_ms
    FROM results r
    JOIN test_requests tr ON r.test_request_id = tr.id
    JOIN patients p ON r.patient_id = p.id
    LEFT JOIN users u ON r.approved_by = u.id
    LEFT JOIN ai_results ai ON r.ai_result_id = ai.id
    WHERE p.patient_code = ? AND r.status = 'released' AND p.institution_id = (SELECT id FROM institutions LIMIT 1)
  `).all(externalPatientId);

  if (!results.length) {
    return reply.status(404).send({ type: 'not_found', title: 'Not Found', detail: 'No approved results found for this patient.', status: 404 });
  }

  return { success: true, results };
});

app.post('/v1/test/seed-synthetic-patient', async (request, reply) => {
  // IRIS-H-138: Gated safely for Electron packaged apps
  if (process.env.NODE_ENV === 'production' || __dirname.includes('app.asar')) {
    return reply.status(403).send({ type: 'forbidden', title: 'Forbidden', detail: 'Test seeding is disabled in production environments.', status: 403 });
  }

  const patientId = crypto.randomUUID();
  const sampleId = crypto.randomUUID();
  const inst = db.prepare("SELECT id FROM institutions LIMIT 1").get() as any;

  let actualPatientId = patientId;
  db.transaction(() => {
    const existing = db.prepare('SELECT id FROM patients WHERE patient_code = ?').get('SYN-001') as any;
    
    if (existing) {
      actualPatientId = existing.id;
    } else {
      db.prepare(`
        INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, consent_given, consent_signature_path)
        VALUES (?, 'SYN-001', ?, 'Synthetic LIS Patient', '1990-01-01', 'Female', 1, 'mock')
      `).run(actualPatientId, inst.id);
    }

    // IRIS-H-139: Make seed idempotent for tests
    const existingTest = db.prepare(`
      SELECT tr.id FROM test_requests tr JOIN samples s ON tr.sample_id = s.id 
      WHERE s.patient_id = ? AND tr.test_name = 'Malaria Parasite'
    `).get(actualPatientId);

    if (!existingTest) {
      db.prepare(`
        INSERT INTO samples (id, patient_id, institution_id, status) VALUES (?, ?, ?, 'requested')
      `).run(sampleId, actualPatientId, inst.id);

      db.prepare(`
        INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
        VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'requested')
      `).run(crypto.randomUUID(), sampleId);
    }
  })();

  return { success: true, irisPatientId: actualPatientId };
});

const start = async () => {
  try {
    let bindHost = '127.0.0.1';
    
    try {
      const inst = db.prepare("SELECT metadata FROM institutions LIMIT 1").get() as any;
      if (inst && inst.metadata) {
        const metadata = JSON.parse(inst.metadata);
        if (metadata.lisNetworkMode === true) {
          bindHost = metadata.lisBindIp || '127.0.0.1'; 
        }
      }
    } catch (e) {
      app.log.error("Failed to read LIS network mode configuration, defaulting to localhost");
    }

    await app.listen({ port: 8787, host: bindHost });
    console.log(`LIS Integration API running at http://${bindHost}:8787`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();