// apps/desktop/src/main/ipc/worklist-handlers.ts
import { ipcMain } from 'electron';
import { db } from '../db';

export function registerWorklistHandlers() {
  ipcMain.handle('worklist:getPending', async () => {
    try {
      // Join patients, samples, and test_requests to get the full worklist view
      const query = `
        SELECT 
          tr.id as requestId,
          p.full_name as patientName,
          p.patient_code as patientCode,
          tr.test_name as testName,
          s.priority,
          tr.status,
          u.full_name as assignedTo,
          tr.created_at as createdAt
        FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN users u ON tr.assigned_to = u.id
        WHERE tr.status != 'released'
        ORDER BY 
          CASE WHEN s.priority = 'stat' THEN 1 ELSE 2 END,
          tr.created_at DESC
      `;
      
      const pendingWork = db.prepare(query).all();
      return { success: true, data: pendingWork };
    } catch (error) {
      console.error('[Main Process] Failed to fetch worklist:', error);
      return { success: false, error: 'Database query failed' };
    }
  });
}