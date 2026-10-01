import crypto from 'crypto';
import Database from 'better-sqlite3';

export function exportSince(db: Database.Database, lastSyncTimestamp: string) {
  // Read new/changed records
  const patients = db.prepare(`SELECT * FROM patients WHERE created_at > ?`).all(lastSyncTimestamp);
  const results = db.prepare(`SELECT * FROM results WHERE created_at > ?`).all(lastSyncTimestamp);
  const auditLog = db.prepare(`SELECT * FROM audit_log WHERE created_at > ?`).all(lastSyncTimestamp);

  const exportPackage = JSON.stringify({
    timestamp: new Date().toISOString(),
    data: { patients, results, auditLog }
  });

  // Generate a detached signature (simulated Ed25519 using HMAC for Phase 1)
  const secret = process.env.IRIS_SYNC_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: IRIS_SYNC_SECRET environment variable is unset. Backup aborted to prevent unauthenticated data export.');
  }
  // Encrypt the entire package to protect PHI
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(secret).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(exportPackage, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const securePayload = JSON.stringify({
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: encrypted.toString('hex')
  });

  const signature = crypto.createHmac('sha256', secret).update(securePayload).digest('hex');

  return { payload: securePayload, signature };
}