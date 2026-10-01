import Database from 'better-sqlite3-multiple-ciphers';

import { app, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { randomBytes } from 'crypto';
import { hashPassword } from '../../../../packages/db/src/auth/hash';
import { setLocalSessionSecret } from '../../../../packages/db/src/auth/session';

if (app && !app.isPackaged) {
  app.setName('IRIS');
  app.setPath('userData', path.join(app.getPath('appData'), 'IRIS'));
}

const storagePath = app ? app.getPath('userData') : process.cwd();
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}
const dbPath = path.join(storagePath, 'iris-offline.db');

// ─── Application Key (used for field-level PII encryption) ───────────────────
let _appKey: Buffer | null = null;

export function getAppKey(): Buffer {
  if (_appKey) return _appKey;

  if (!app) {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      _appKey = crypto.createHash('sha256').update('dev-offline-key').digest();
      return _appKey;
    }
    throw new Error('Fatal Security Error: Cannot securely retrieve application key outside of Electron app context.');
  }

  const keyPath = path.join(storagePath, 'iris.key');

  if (fs.existsSync(keyPath)) {
    const stored = fs.readFileSync(keyPath);
    if (!safeStorage.isEncryptionAvailable()) {
      const storedStr = stored.toString('utf8');
      if (storedStr.length === 64 && /^[0-9a-f]{64}$/i.test(storedStr)) {
        console.warn('[SECURITY WARNING] OS secure storage unavailable. Using unencrypted fallback key.');
        _appKey = Buffer.from(storedStr, 'hex');
        return _appKey;
      }
      throw new Error('Fatal Security Error: OS-level secure storage is not available. Cannot decrypt PII key.');
    }
    
    try {
      const hex = safeStorage.decryptString(stored);
      _appKey = Buffer.from(hex, 'hex');
      return _appKey;
    } catch (e) {
      const storedStr = stored.toString('utf8');
      if (storedStr.length === 64 && /^[0-9a-f]{64}$/i.test(storedStr)) {
        console.warn('[SECURITY WARNING] Using unencrypted fallback key despite safeStorage availability.');
        _appKey = Buffer.from(storedStr, 'hex');
        return _appKey;
      }
      throw e;
    }
  }

  const newKey = crypto.randomBytes(32);
  const hexKey = newKey.toString('hex');

  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[SECURITY WARNING] OS secure storage unavailable. Storing key in plaintext fallback.');
    fs.writeFileSync(keyPath, hexKey);
  } else {
    const toStore = safeStorage.encryptString(hexKey);
    fs.writeFileSync(keyPath, toStore);
  }
  _appKey = newKey;
  return _appKey;
}

// ─── AES-256-GCM field-level encryption helpers ──────────────────────────────
export function encryptField(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;
  const key = getAppKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12) + tag(16) + ciphertext  → base64
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptField(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  try {
    const key = getAppKey();
    const buf = Buffer.from(ciphertext, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data) + decipher.final('utf8');
  } catch (err: any) {
      console.error('[Database] Failed to decrypt field:', err);
      return '<DECRYPT_ERROR>';
    }
}

// ─── Database ────────────────────────────────────────────────────────────────

export function encryptBuffer(buffer: Buffer): Buffer {
  const key = getAppKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptBuffer(encryptedBuffer: Buffer): Buffer | null {
  try {
    const key = getAppKey();
    const iv = encryptedBuffer.subarray(0, 12);
    const tag = encryptedBuffer.subarray(12, 28);
    const data = encryptedBuffer.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  } catch {
    return null;
  }
}

// ─── Lazy DB reference ───────────────────────────────────────────────────────
// The database must NOT be opened until initDB() supplies the cipher key.
// All other modules import `db` and call prepare() after app startup, which
// is always after initDB() resolves, so the proxy pattern below is safe.
let _db: InstanceType<typeof Database> | null = null;

export const db: InstanceType<typeof Database> = new Proxy({} as any, {
  get(_target, prop) {
    if (!_db) throw new Error('[Database] DB accessed before initDB() completed.');
    return (_db as any)[prop];
  },
  set(_target, prop, value) {
    if (!_db) throw new Error('[Database] DB accessed before initDB() completed.');
    (_db as any)[prop] = value;
    return true;
  }
});

export function getInitialAdminCredentials() {
  const row2 = _db!.prepare('SELECT value FROM sys_vars WHERE key = ?').get('initialAdminCredentials') as any;
  if (row2) {
    console.log('====================================================');
    console.log('INITIAL ADMIN CREDENTIALS:');
    const parsed = JSON.parse(row2.value);
    console.log('Username: ' + parsed.username);
    console.log('Password: ' + parsed.password);
    console.log('Recovery Code: ' + parsed.recoveryCode);
    console.log('====================================================');
  }
  const row = _db!.prepare('SELECT value FROM sys_vars WHERE key = ?').get('initialAdminCredentials') as any;
  if (row) {
    return JSON.parse(row.value);
  }
  return null;
}

export function clearInitialAdminCredentials(): void {
  _db!.prepare('DELETE FROM sys_vars WHERE key = ?').run('initialAdminCredentials');
}

async function seedFirstAdmin() {
  const adminExists = _db!.prepare(`SELECT id FROM users WHERE role = 'admin'`).get();

  if (!adminExists) {
    console.log('[Database] No admin found. Seeding initial workspace and Administrator...');

    const instId = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    const initialPassword = process.env.IRIS_INITIAL_ADMIN_PASSWORD || randomBytes(24).toString('base64url');
    const recoveryCode = 'RC-' + randomBytes(16).toString('hex').toUpperCase();
    
    _db!.prepare('INSERT INTO sys_vars (key, value) VALUES (?, ?)').run('initialAdminCredentials', JSON.stringify({ username: 'System Administrator', password: initialPassword, recoveryCode }));
    
    const hashedPw = await hashPassword(initialPassword);
    const hashedRc = await hashPassword(recoveryCode);

    _db!.prepare(`
      INSERT INTO institutions (id, name, type, licence_tier)
      VALUES (?, 'KytoLabx HQ', 'laboratory', 'enterprise')
    `).run(instId);

    _db!.prepare(`
      INSERT INTO users (id, institution_id, full_name, mlscn_number, role, password_hash, recovery_code_hash, mlscn_verified)
      VALUES (?, ?, 'System Administrator', 'System Administrator', 'admin', ?, ?, 1)
    `).run(adminId, instId, hashedPw, hashedRc);
  }
}

export async function initDB() {
  // ── 1. Retrieve the 256-bit application key ──────────────────────────────
  let keyHex: string;
  try {
    keyHex = getAppKey().toString('hex');
  } catch (err) {
    console.error('[Database] Fatal: could not retrieve app key:', err);
    throw err;
  }

  // ── 2. Open the database file — cipher key MUST be set before any query ──
  //    better-sqlite3-multiple-ciphers supports SQLCipher 4 natively.
  //
  //    Open without a key first so we can detect whether the file is already
  //    encrypted (new install creates it fresh; existing dev DB is plaintext).
  const rawDb = new Database(dbPath);

  let isPlaintext = false;
  try {
    // If this query succeeds, the file is plaintext (new or legacy unencrypted).
    rawDb.prepare('SELECT count(*) FROM sqlite_master').get();
    isPlaintext = true;
  } catch {
    // SqlCipher will throw here when it can't decrypt — file is already encrypted.
    isPlaintext = false;
  }

  if (isPlaintext) {
    // ── Migrate plaintext → SQLCipher in-place ──────────────────────────────
    // The source is open as plaintext. We ATTACH a new temp file and tell
    // SQLCipher to write it encrypted, then swap the files.
    console.log('[Database] Encrypting plaintext database with SQLCipher…');
    const tmpPath = dbPath + '.cipher-tmp';
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    // Open the temp encrypted target via a second connection with the key set.
    const encDb = new Database(tmpPath);
    encDb.pragma(`cipher='sqlcipher'`);
    encDb.pragma(`key="x'${keyHex}'"`);
    encDb.close();

    // Now attach the (now-created, keyed) target from the source plaintext conn.
    rawDb.prepare(`ATTACH DATABASE ? AS encrypted KEY "x'${keyHex}'"`)
      .run(tmpPath);
    rawDb.prepare(`SELECT sqlcipher_export('encrypted')`).run();
    rawDb.prepare(`DETACH DATABASE encrypted`).run();
    rawDb.close();

    // Swap: move plaintext to .bak, promote encrypted file to primary path.
    fs.renameSync(dbPath, dbPath + '.plaintext-bak');
    fs.renameSync(tmpPath, dbPath);
    console.log('[Database] Migration complete. Plaintext backup at .plaintext-bak');

    // Re-open the now-encrypted database.
    _db = new Database(dbPath);
  } else {
    rawDb.close();
    _db = new Database(dbPath);
  }

  // ── 3. Supply cipher key before any schema query (SQLCipher requirement) ──
  _db.pragma(`cipher='sqlcipher'`);
  _db.pragma(`key="x'${keyHex}'"`);

  // Verify decryption succeeded — throws if wrong key.
  _db.prepare('SELECT count(*) FROM sqlite_master').get();

  // ── 4. Wire the session signing key ──────────────────────────────────────
  setLocalSessionSecret(getAppKey());

  // ── 5. Performance pragmas ────────────────────────────────────────────────
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  try {
    const tableExists = _db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

    if (!tableExists) {
      let schemaPath = app.isPackaged
        ? path.join(process.resourcesPath, '001_init.sql')
        : path.resolve(app.getAppPath(), '../../packages/db/migrations/001_init.sql');

      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      _db.exec(schemaSql);
    }

    const cols = _db.prepare("PRAGMA table_info(users)").all() as any[];
    const colNames = new Set(cols.map((c: any) => c.name));
    if (!colNames.has('failed_login_attempts')) {
      _db.exec(`ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0`);
    }
    if (!colNames.has('locked_until')) {
      _db.exec(`ALTER TABLE users ADD COLUMN locked_until TEXT`);
    }
    if (!colNames.has('recovery_code_hash')) {
      _db.exec(`ALTER TABLE users ADD COLUMN recovery_code_hash TEXT`);
    }

    const deviceCols = _db.prepare("PRAGMA table_info(devices)").all() as any[];
    const deviceColNames = new Set(deviceCols.map((c: any) => c.name));
    if (!deviceColNames.has('last_seen_at')) {
      _db.exec(`ALTER TABLE devices ADD COLUMN last_seen_at TEXT`);
    }

    _db.exec(`
      CREATE TABLE IF NOT EXISTS sys_vars (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        token TEXT PRIMARY KEY,
        revoked_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS used_totp_tokens (
        token TEXT NOT NULL,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        PRIMARY KEY (token, user_id)
      );
      CREATE TABLE IF NOT EXISTS api_tokens (
        token TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        user_id TEXT,
        details TEXT
      );
    `);

    _db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_id);
      CREATE INDEX IF NOT EXISTS idx_samples_inst ON samples(institution_id);
      CREATE INDEX IF NOT EXISTS idx_devices_inst ON devices(institution_id);
      CREATE INDEX IF NOT EXISTS idx_testreq_status ON test_requests(status);
      CREATE INDEX IF NOT EXISTS idx_results_vercode ON results(verification_code);
    `);

    await seedFirstAdmin();
  } catch (err) {
    console.error('[Database] Failed to initialize schema:', err);
    throw err;
  }
}
