import { exportSince } from './exporter';
import Database from 'better-sqlite3';

export async function uploadBackup(db: Database.Database, endpoint: string, lastSyncTimestamp: string) {
  if (!endpoint.startsWith('https://')) {
    throw new Error('CRITICAL Security Error: Backup endpoint must use HTTPS to protect PHI in transit.');
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const { payload, signature } = exportSince(db, lastSyncTimestamp);

      // @ts-ignore - Node 18+ built-in fetch might not be in the local tsconfig types
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
      attempts++;
      console.error(`[Sync] Backup attempt ${attempts} failed.`, error);
      if (attempts >= maxAttempts) {
        return { success: false, error };
      }
      // Exponential backoff: 2s, 4s
      await new Promise(res => setTimeout(res, Math.pow(2, attempts) * 1000));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}