import { ipcMain } from 'electron';
import { db } from '../db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { generateLocalPDF, printLocalReport } from '../pdf-generator';

export function registerResultHandlers() {
  ipcMain.handle('results:approve', async (_, payload) => {
    console.log(`[Main Process] Approving result for Test Request: ${payload.requestId}`);
    
    try {
      const verificationCode = `IRIS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      const testRequest = db.prepare(`
        SELECT tr.sample_id, s.patient_id, s.institution_id, tr.test_name, s.priority, p.full_name as patientName
        FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        JOIN patients p ON s.patient_id = p.id
        WHERE tr.id = ?
      `).get(payload.requestId) as any;

      if (!testRequest) throw new Error("Test request not found.");

      const sigBuffer = Buffer.from(payload.signatureData.split(',')[1], 'base64');
      const sigPath = path.join(app.getPath('userData'), `sig_${payload.requestId}.png`);
      fs.writeFileSync(sigPath, sigBuffer);

      const pdfPath = await generateLocalPDF({
        ...payload,
        ...testRequest,
        verificationCode,
        approvedByName: payload.scientistName
      });

      const resultId = crypto.randomUUID();
      const insertResult = db.prepare(`
        INSERT INTO results (
          id, test_request_id, patient_id, institution_id, status, 
          edited_findings, interpretive_comment, approved_by, 
          approved_at, digital_signature_path, result_pdf_local_path, verification_code
        ) VALUES (?, ?, ?, ?, 'released', ?, ?, ?, datetime('now'), ?, ?, ?)
      `);

      const updateRequest = db.prepare(`UPDATE test_requests SET status = 'released' WHERE id = ?`);

      db.transaction(() => {
        insertResult.run(
          resultId, payload.requestId, testRequest.patient_id, testRequest.institution_id,
          payload.editedFindings, payload.comments, payload.scientistId,
          sigPath, pdfPath, verificationCode
        );
        updateRequest.run(payload.requestId);

        if (payload.editedFindings !== payload.originalFindings) {
            db.prepare(`
              INSERT INTO corrections (id, result_id, scientist_id, field_name, original_ai_value, corrected_value)
              VALUES (?, ?, ?, 'findings', ?, ?)
            `).run(crypto.randomUUID(), resultId, payload.scientistId, payload.originalFindings, payload.editedFindings);
        }
      })();

      await printLocalReport(pdfPath);
      return { success: true, verificationCode };
      
    } catch (error: any) {
      console.error('[Main Process] Approval failed:', error);
      return { success: false, error: error.message };
    }
  });
}