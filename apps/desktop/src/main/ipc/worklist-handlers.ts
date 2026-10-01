import { ipcMain } from 'electron';
import crypto from 'crypto';
import { db } from '../db';

export function registerWorklistHandlers() {
  ipcMain.handle('worklist:getPending', async (_, payload, session) => {
    try {
      const query = `
        SELECT tr.id as requestId, p.full_name as patientName, p.patient_code as patientCode,
          p.dob as patientDob, p.gender as patientGender, tr.test_name as testName,
          s.priority, tr.status, u.full_name as assignedTo, tr.created_at as createdAt
        FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN users u ON tr.assigned_to = u.id
        WHERE tr.status NOT IN ('released', 'cancelled', 'unable_to_analyse') AND s.institution_id = ?
        ORDER BY CASE WHEN s.priority = 'stat' THEN 1 ELSE 2 END, tr.created_at DESC
        LIMIT 1000
      `;
      return { success: true, data: db.prepare(query).all(session.institutionId) };
    } catch (error) {
      console.error('[Main Process] Failed to fetch worklist:', error);
      return { success: false, error: 'Database query failed' };
    }
  });

  ipcMain.handle('worklist:searchPatients', async (_, query, session) => {
    try {
      if (!query) {
        const recent = db.prepare(`SELECT patient_code, full_name, dob FROM patients WHERE institution_id = ? ORDER BY rowid DESC LIMIT 5`).all(session.institutionId);
        return { success: true, data: recent };
      }
      const sanitizedQuery = query.replace(/[%_]/g, '');
      const searchTerm = `%${sanitizedQuery}%`;
      const matches = db.prepare(`
        SELECT patient_code, full_name, dob FROM patients
        WHERE (full_name LIKE ? OR patient_code LIKE ?) AND institution_id = ?
        ORDER BY CASE WHEN patient_code = ? THEN 0 WHEN patient_code LIKE ? THEN 1 ELSE 2 END, rowid DESC LIMIT 10
      `).all(searchTerm, searchTerm, session.institutionId, query.trim(), `${query.trim()}%`);
      return { success: true, data: matches };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('worklist:createRequest', async (_, payload, session) => {
    try {
      if (session.role === 'viewer') return { success: false, error: 'Unauthorized Action: Viewers cannot order tests.' };
      
      const validCategories = ['haematology', 'microbiology', 'chemistry', 'pathology', 'parasitology'];
      if (!validCategories.includes(payload.testCategory)) {
        return { success: false, error: 'Invalid test category provided.' };
      }

      const patient = db.prepare('SELECT id, institution_id FROM patients WHERE patient_code = ? AND institution_id = ?').get(payload.patientCode, session.institutionId) as any;
      if (!patient) return { success: false, error: 'Patient code not found. Please register the patient first.' };
      
      const existingRequest = db.prepare(`
        SELECT tr.id FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        WHERE s.patient_id = ? AND s.institution_id = ?
          AND tr.test_category = ? AND tr.test_name = ?
          AND tr.status NOT IN ('released', 'cancelled')
      `).get(patient.id, session.institutionId, payload.testCategory, payload.testName);
      if (existingRequest) return { success: false, error: 'This patient already has an active request for this examination.' };
      
      const requestId = crypto.randomUUID();

      db.transaction(() => {
        // Find existing collected sample for today
        const existingSample = db.prepare(`
          SELECT id FROM samples 
          WHERE patient_id = ? AND institution_id = ? AND status = 'collected' AND date(created_at) = date('now')
          LIMIT 1
        `).get(patient.id, patient.institution_id) as any;

        let sampleId = existingSample?.id;

        if (!sampleId) {
          sampleId = crypto.randomUUID();
          db.prepare(`INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by, sample_type, requesting_clinician, clinical_notes) VALUES (?, ?, ?, ?, 'collected', ?, 'Whole Blood', ?, ?)`).run(sampleId, patient.id, patient.institution_id, payload.priority, session.userId, payload.requestingClinician || null, payload.clinicalNotes || null);
          db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'create_sample', 'sample', ?)`).run(session.userId, session.institutionId, sampleId);
        } else if (payload.requestingClinician || payload.clinicalNotes) {
          db.prepare(`UPDATE samples SET requesting_clinician = COALESCE(requesting_clinician, ?), clinical_notes = COALESCE(clinical_notes, ?) WHERE id = ?`).run(payload.requestingClinician || null, payload.clinicalNotes || null, sampleId);
        }

        db.prepare(`INSERT INTO test_requests (id, sample_id, test_category, test_name, status, created_by) VALUES (?, ?, ?, ?, 'requested', ?)`).run(requestId, sampleId, payload.testCategory, payload.testName, session.userId);
        db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'create_test_request', 'test_request', ?)`).run(session.userId, session.institutionId, requestId);
      })();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('worklist:cancelRequest', async (_, { requestId }, session) => {
    try {
      if (session.role === 'viewer') return { success: false, error: 'Unauthorized Action: Viewers cannot remove requests.' };
      const request = db.prepare(`
        SELECT tr.id, tr.sample_id FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        WHERE tr.id = ? AND s.institution_id = ? AND tr.status NOT IN ('released', 'cancelled')
      `).get(requestId, session.institutionId) as any;
      
      if (!request) return { success: false, error: 'Request was not found or is already closed.' };
      
      db.transaction(() => {
        db.prepare(`UPDATE test_requests SET status = 'cancelled' WHERE id = ?`).run(requestId);
        
        // Cancel sample if it has no other non-cancelled requests
        const activeRequestsCount = db.prepare(`SELECT count(*) as count FROM test_requests WHERE sample_id = ? AND status != 'cancelled'`).get(request.sample_id) as any;
        if (activeRequestsCount.count === 0) {
          db.prepare(`UPDATE samples SET status = 'cancelled' WHERE id = ?`).run(request.sample_id);
        }

        db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'cancel_worklist_request', 'test_request', ?, ?)`).run(session.userId, session.institutionId, requestId, JSON.stringify({ reason: 'Manually removed from worklist' }));
      })();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
