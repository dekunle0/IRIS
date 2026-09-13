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
  const secret = process.env.IRIS_SYNC_SECRET || 'offline-sync-key';
  const signature = crypto.createHmac('sha256', secret).update(exportPackage).digest('hex');

  return { payload: exportPackage, signature };
}