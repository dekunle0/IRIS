import { exportSince } from './exporter';
import Database from 'better-sqlite3';

export async function uploadBackup(db: Database.Database, endpoint: string, lastSyncTimestamp: string) {
  try {
    const { payload, signature } = exportSince(db, lastSyncTimestamp);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-IRIS-Signature': signature
      },
      body: payload
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    // Log clearly, never drop data, never block UI workflow
    console.error('[Sync] Backup pending. Will retry with exponential backoff.', error);
    return { success: false, error };
  }
}