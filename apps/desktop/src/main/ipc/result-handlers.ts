import { ipcMain, app, shell, dialog } from 'electron';
import { db, encryptBuffer } from '../db';
import { SPECIALIST_ROLES } from '../../utils/constants';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { generateLocalPDF, printLocalReport } from '../pdf-generator';
import { decryptBuffer } from './ai-handlers';

const REFERENCE_RANGES: Record<string, { analyte: string; field?: string; unit: string; low: string; high: string }[]> = {
  'Malaria Parasite': [
    { analyte: 'Parasitaemia', field: 'parasitaemia_pct', unit: '%', low: '0', high: '0' },
    { analyte: 'Parasite Density', field: 'by_class.parasitised_rbc', unit: 'parasites/µL', low: '0', high: '0' },
    { analyte: 'Morphology Stage', field: 'test_type', unit: '', low: 'None', high: 'None' },
  ],
  'Full Blood Count': [
    { analyte: 'Haemoglobin',  unit: 'g/dL',   low: '12.0', high: '17.5' },
    { analyte: 'WBC Count',    unit: 'x10^9/L', low: '4.5',  high: '11.0' },
    { analyte: 'Platelet Count', unit: 'x10^9/L', low: '150', high: '400' },
    { analyte: 'PCV/Haematocrit', unit: '%',    low: '36',   high: '54'  },
    { analyte: 'MCV',          unit: 'fL',      low: '80',   high: '100' },
  ],
  'Differential Count': [
    { analyte: 'Neutrophils',  unit: '%', low: '50', high: '70' },
    { analyte: 'Lymphocytes',  unit: '%', low: '20', high: '40' },
    { analyte: 'Monocytes',    unit: '%', low: '2',  high: '8'  },
    { analyte: 'Eosinophils',  unit: '%', low: '1',  high: '4'  },
    { analyte: 'Basophils',    unit: '%', low: '0',  high: '1'  },
  ],
  'Widal Test': [
    { analyte: 'S. Typhi O',   unit: 'titre', low: '<1:40',  high: '<1:40'  },
    { analyte: 'S. Typhi H',   unit: 'titre', low: '<1:40',  high: '<1:40'  },
    { analyte: 'S. Paratyphi AO', unit: 'titre', low: '<1:40', high: '<1:40' },
  ],
};

export function registerResultHandlers() {
  ipcMain.handle('results:getReviewData', async (_, requestId, session) => {
    try {
      const data = db.prepare(`
        SELECT a.findings, a.confidence_scores, c.video_local_path, tr.test_category
        FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        JOIN captures c ON tr.id = c.test_request_id
        JOIN ai_results a ON c.id = a.capture_id
        WHERE tr.id = ? AND s.institution_id = ?
        ORDER BY a.created_at DESC LIMIT 1
      `).get(requestId, session.institutionId) as any;

      if (!data) return { success: false, error: 'No AI results found for this request.' };

      const findings = JSON.parse(data.findings);

      let frameImages: string[] = [];
      if (findings.frame_paths) {
        frameImages = findings.frame_paths.map((imgPath: string) => {
          try { return `data:image/jpeg;base64,${decryptBuffer(fs.readFileSync(imgPath)).toString('base64')}`; }
          catch { return null; }
        }).filter(Boolean);
      }

      const existingResult = db.prepare(`SELECT id, result_pdf_local_path, status, amended_from_id FROM results WHERE test_request_id = ? AND institution_id = ? ORDER BY created_at DESC LIMIT 1`).get(requestId, session.institutionId) as any;
      let priorPdfPath = null;
      if (existingResult?.amended_from_id) {
        const prior = db.prepare(`SELECT result_pdf_local_path FROM results WHERE id = ?`).get(existingResult.amended_from_id) as any;
        if (prior) priorPdfPath = prior.result_pdf_local_path;
      }

      return {
        success: true,
        data: {
          findings,
          confidence: JSON.parse(data.confidence_scores),
          videoPath: data.video_local_path,
          frames: frameImages,
          testCategory: data.test_category,
          isApproved: existingResult ? (existingResult.status === 'approved' || existingResult.status === 'released' || existingResult.status === 'amended') : false,
          resultId: existingResult ? existingResult.id : null,
          pdfPath: existingResult ? existingResult.result_pdf_local_path : null,
          priorPdfPath
        }
      };
    } catch (error: any) {
      console.error('[Main Process] Failed to fetch review data:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('shell:openPath', async (_, filePath, session) => {
    if (!session) return { success: false, error: 'Unauthorized.' };
    const safeRoot = path.resolve(app.getPath('userData'));
    const safePath = path.resolve(String(filePath || ''));
    if (!safePath.startsWith(`${safeRoot}${path.sep}`) || path.extname(safePath).toLowerCase() !== '.enc') {
      return { success: false, error: 'Only generated PDF reports can be opened.' };
    }
    
    const tempPath = path.join(app.getPath('temp'), `view_${Date.now()}.pdf`);
    const encrypted = fs.readFileSync(safePath);
    fs.writeFileSync(tempPath, decryptBuffer(encrypted), { mode: 0o600 });
    await shell.openPath(tempPath);
    
    setTimeout(() => { try { fs.unlinkSync(tempPath); } catch (e) {} }, 60000);
    return { success: true };
  });

  ipcMain.handle('results:savePdf', async (_, { pdfPath }, session) => {
    try {
      const safeRoot = path.resolve(app.getPath('userData'));
      const safePdfPath = path.resolve(String(pdfPath || ''));
      if (!safePdfPath.startsWith(`${safeRoot}${path.sep}`) || path.extname(safePdfPath).toLowerCase() !== '.enc' || !fs.existsSync(safePdfPath)) {
        return { success: false, error: 'The generated PDF could not be found.' };
      }

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save PDF Report',
        defaultPath: path.basename(safePdfPath).replace('.enc', ''),
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      });

      if (canceled || !filePath) return { success: false, canceled: true };

      const encrypted = fs.readFileSync(safePdfPath);
      fs.writeFileSync(filePath, decryptBuffer(encrypted));
      return { success: true, filePath };
    } catch (error: any) {
      console.error('[Main Process] PDF export failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('results:generatePdfPreview', async (_, payload, session) => {
    try {
      const testRequest = db.prepare(`
        SELECT tr.sample_id, tr.test_category, s.patient_id, s.institution_id, tr.test_name, s.priority, p.full_name as patientName
        FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        JOIN patients p ON s.patient_id = p.id
        WHERE tr.id = ? AND s.institution_id = ?
      `).get(payload.requestId, session.institutionId) as any;

      if (!testRequest) return { success: false, error: 'Test request not found.' };

      const patientDetails = db.prepare(`
        SELECT p.dob, p.gender, p.hospital_number, p.phone, p.patient_code, p.nin_encrypted,
               s.requesting_clinician, s.clinical_notes, '' as ward_clinic,
               i.name as institution_name, i.address as institution_address,
               i.mlscn_reg_number as mlscn_accreditation_number, '' as accreditation_status
        FROM patients p
        JOIN samples s ON s.patient_id = p.id
        JOIN institutions i ON s.institution_id = i.id
        WHERE p.id = ? AND s.id = ?
      `).get(testRequest.patient_id, testRequest.sample_id) as any;

      if (patientDetails?.nin_encrypted) {
        try { patientDetails.nin = decryptBuffer(Buffer.from(patientDetails.nin_encrypted)).toString('utf8'); } catch(e) {}
      }

      const scientistDetails = db.prepare(`SELECT mlscn_number FROM users WHERE id = ?`).get(session.userId) as any;
      const aiData = db.prepare(`SELECT confidence_scores, model_version FROM ai_results JOIN captures c ON ai_results.capture_id = c.id WHERE c.test_request_id = ? ORDER BY ai_results.created_at DESC LIMIT 1`).get(payload.requestId) as any;

      const referenceRangesStr = JSON.stringify(REFERENCE_RANGES[testRequest.test_name] || []);

      const pdfPath = await generateLocalPDF({
        ...payload,
        ...testRequest,
        ...(patientDetails || {}),
        verificationCode: 'DRAFT-PREVIEW',
        approvedByName: session.fullName,
        approvedByRole: session.role,
        mlscnNumber: scientistDetails?.mlscn_number || '',
        confidence_scores: aiData?.confidence_scores || '{}',
        modelVersion: aiData?.model_version || '1.0.0',
        reference_ranges: referenceRangesStr,
      });

      return { success: true, pdfPath };
    } catch (error: any) {
      console.error('[Main Process] Preview generation failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('results:approve', async (_, payload, session) => {
    // ── Specialist role gate ──────────────────────────────────────────────────
    const testRequest = db.prepare(`
      SELECT tr.sample_id, tr.test_category, s.patient_id, s.institution_id, tr.test_name, s.priority, p.full_name as patientName, tr.status
      FROM test_requests tr
      JOIN samples s ON tr.sample_id = s.id
      JOIN patients p ON s.patient_id = p.id
      WHERE tr.id = ? AND s.institution_id = ?
    `).get(payload.requestId, session.institutionId) as any;

    if (!testRequest) return { success: false, error: 'Test request not found.' };

    if (testRequest.status !== 'review' && testRequest.status !== 'ai_result' && testRequest.status !== 'approved') {
      return { success: false, error: 'Request is not in a reviewable state.' };
    }

    const approvingUser = db.prepare(`SELECT mlscn_verified FROM users WHERE id = ?`).get(session.userId) as any;
    if (session?.role !== 'admin' && (!approvingUser || approvingUser.mlscn_verified === 0)) {
      return { success: false, error: 'Safety Protocol Block: Your MLSCN registration has not been verified by an Administrator.' };
    }

    const allowedRoles = SPECIALIST_ROLES[testRequest.test_category] || ['admin']; // Fail closed for unknown categories
    if (!allowedRoles.includes(session?.role)) {
      return { success: false, error: `Unauthorized: ${testRequest.test_category} results require one of: ${allowedRoles.join(', ')}.` };
    }

    try {
      const verificationCode = `IRIS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const actualScientistId = session.userId;

      // Fetch full patient record + sample details for PDF
      const patientDetails = db.prepare(`
        SELECT p.dob, p.gender, p.hospital_number, p.phone, p.patient_code, p.nin_encrypted,
               s.requesting_clinician, s.clinical_notes, '' as ward_clinic,
               i.name as institution_name, i.address as institution_address,
               i.mlscn_reg_number as mlscn_accreditation_number, '' as accreditation_status
        FROM patients p
        JOIN samples s ON s.patient_id = p.id
        JOIN institutions i ON s.institution_id = i.id
        WHERE p.id = ? AND s.id = ?
      `).get(testRequest.patient_id, testRequest.sample_id) as any;

      if (patientDetails?.nin_encrypted) {
        try {
           patientDetails.nin = decryptBuffer(Buffer.from(patientDetails.nin_encrypted)).toString('utf8');
        } catch(e) { patientDetails.nin = null; }
      }

      // Scientist MLSCN number for the PDF footer
      const scientistDetails = db.prepare(`SELECT mlscn_number FROM users WHERE id = ?`).get(actualScientistId) as any;

      // Fetch the most recent confidence scores for this test request
      const aiData = db.prepare(`
        SELECT a.id, a.confidence_scores, a.model_version, a.findings
        FROM ai_results a
        JOIN captures c ON a.capture_id = c.id
        WHERE c.test_request_id = ?
        ORDER BY a.created_at DESC LIMIT 1
      `).get(payload.requestId) as any;

      const existingResult = db.prepare(`SELECT id, status FROM results WHERE test_request_id = ? ORDER BY created_at DESC LIMIT 1`).get(payload.requestId) as any;
      if (existingResult && (existingResult.status === 'approved' || existingResult.status === 'released' || existingResult.status === 'amended')) {
        return { success: false, error: 'System of record violation: Approved or released results cannot be overwritten.' };
      }
      const resultId = existingResult ? existingResult.id : crypto.randomUUID();

      if (!payload.signatureData || typeof payload.signatureData !== 'string' || !payload.signatureData.includes(',')) {
        return { success: false, error: 'Invalid signature data provided.' };
      }
      const sigBuffer = Buffer.from(payload.signatureData.split(',')[1], 'base64');
      const sigPath = path.join(app.getPath('userData'), `sig_${resultId}.png.enc`);
      fs.writeFileSync(sigPath, encryptBuffer(sigBuffer));

      const referenceRangesStr = JSON.stringify(REFERENCE_RANGES[testRequest.test_name] || []);

      const pdfPath = await generateLocalPDF({
        ...payload,
        ...testRequest,
        ...(patientDetails || {}),
        verificationCode,
        approvedByName: session.fullName,
        approvedByRole: session.role,
        mlscnNumber: scientistDetails?.mlscn_number || '',
        confidence_scores: aiData?.confidence_scores || '{}',
        modelVersion: aiData?.model_version || '1.0.0',
        reference_ranges: referenceRangesStr,
      });

      try {
        db.transaction(() => {
          if (existingResult) {
            db.prepare(`
              UPDATE results SET
                edited_findings = ?, interpretive_comment = ?, approved_by = ?,
                approved_at = datetime('now'), digital_signature_path = ?, result_pdf_local_path = ?, verification_code = ?, status = 'approved',
                ai_result_id = ?, reference_ranges = ?
              WHERE id = ?
            `).run(
              payload.editedFindings, payload.comments, actualScientistId,
              sigPath, pdfPath, verificationCode, aiData?.id, referenceRangesStr, resultId
            );
          } else {
            db.prepare(`
              INSERT INTO results (
                id, test_request_id, patient_id, institution_id, status,
                edited_findings, interpretive_comment, approved_by,
                approved_at, digital_signature_path, result_pdf_local_path, verification_code, ai_result_id, reference_ranges
              ) VALUES (?, ?, ?, ?, 'approved', ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?)
            `).run(
              resultId, payload.requestId, testRequest.patient_id, testRequest.institution_id,
              payload.editedFindings, payload.comments, actualScientistId,
              sigPath, pdfPath, verificationCode, aiData?.id, referenceRangesStr
            );
          }
  
          db.prepare(`UPDATE test_requests SET status = 'approved' WHERE id = ?`).run(payload.requestId);
          db.prepare(`UPDATE samples SET status = 'analysed' WHERE id = ?`).run(testRequest.sample_id);
  
          if (payload.editedFindings !== aiData?.findings) {
            db.prepare(`
              INSERT INTO corrections (id, result_id, scientist_id, field_name, original_ai_value, corrected_value)
              VALUES (?, ?, ?, 'findings', ?, ?)
            `).run(crypto.randomUUID(), resultId, actualScientistId, aiData?.findings, payload.editedFindings);
          }
        })();
      } catch (dbError: any) {
        try { if (fs.existsSync(sigPath)) fs.unlinkSync(sigPath); } catch (e) {}
        try { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); } catch (e) {}
        throw dbError;
      }
  
      if (payload.autoPrint !== false) {
        try {
          await printLocalReport(pdfPath);
        } catch (printError) {
          console.error('[Main Process] Print failed:', printError);
          return { success: true, verificationCode, pdfPath, resultId, printWarning: 'Result approved, but printing failed.' };
        }
      }
      return { success: true, verificationCode, pdfPath, resultId };

    } catch (error: any) {
      console.error('[Main Process] Approval failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('results:release', async (_, { resultId }, session) => {
    try {
      const res = db.prepare(`SELECT r.status, r.approved_by, r.institution_id, r.test_request_id, tr.status as request_status FROM results r JOIN test_requests tr ON r.test_request_id = tr.id WHERE r.id = ? AND r.institution_id = ?`).get(resultId, session.institutionId) as any;
      if (!res) return { success: false, error: 'Result not found.' };
      if (res.status !== 'approved' || res.request_status !== 'approved') return { success: false, error: `Cannot release result in status ${res.status}.` };

      if (!['admin', 'scientist_l2', 'pathologist'].includes(session?.role)) {
        if (session.userId !== res.approved_by) {
          return { success: false, error: 'Unauthorized: Only senior scientists (L2+) or pathologists can release another scientist\'s results.' };
        }
      }

      db.transaction(() => {
        db.prepare(`UPDATE results SET status = 'released' WHERE id = ?`).run(resultId);
        db.prepare(`UPDATE test_requests SET status = 'released' WHERE id = ?`).run(res.test_request_id);
      })();

      return { success: true };
    } catch (error: any) {
      console.error('[Main Process] Release failed:', error);
      return { success: false, error: error.message };
    }
  });



  /** results:amend — immutably preserves the prior released result, creates a new amended copy. */
  ipcMain.handle('results:amend', async (_, payload, session) => {
    const allowedRoles = ['admin', 'scientist_l2', 'scientist_l1', 'pathologist'];
    if (!allowedRoles.includes(session?.role)) {
      return { success: false, error: 'Unauthorized: Only laboratory scientists can amend results.' };
    }

    try {
      const prior = db.prepare(`
        SELECT r.*, tr.test_category, tr.test_name, s.patient_id, s.institution_id, s.priority,
               p.full_name as patientName
        FROM results r
        JOIN test_requests tr ON r.test_request_id = tr.id
        JOIN samples s ON tr.sample_id = s.id
        JOIN patients p ON s.patient_id = p.id
        WHERE r.id = ? AND r.institution_id = ? AND r.status = 'released'
      `).get(payload.priorResultId, session.institutionId) as any;

      if (!prior) return { success: false, error: 'Original released result not found or already amended.' };

      const allowedForCategory = SPECIALIST_ROLES[prior.test_category] || ['admin']; // Fail closed
      if (!allowedForCategory.includes(session?.role)) {
        return { success: false, error: `Unauthorized: ${prior.test_category} amendments require: ${allowedForCategory.join(', ')}.` };
      }

      const newVerificationCode = `IRIS-AMEND-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const newResultId = crypto.randomUUID();

      if (!payload.signatureData || typeof payload.signatureData !== 'string' || !payload.signatureData.includes(',')) {
        return { success: false, error: 'Invalid signature data provided.' };
      }
      const sigBuffer = Buffer.from(payload.signatureData.split(',')[1], 'base64');
      const sigPath = path.join(app.getPath('userData'), `sig_amend_${newResultId}.png.enc`);
      fs.writeFileSync(sigPath, encryptBuffer(sigBuffer));

      const pdfPath = await generateLocalPDF({
        ...payload,
        patientName: prior.patientName,
        testName: prior.test_name,
        priority: prior.priority,
        verificationCode: newVerificationCode,
        approvedByName: session.fullName,
        approvedByRole: session.role,
        isAmendment: true,
        priorVerificationCode: prior.verification_code
      });

      try {
        db.transaction(() => {
        // Mark prior result as amended (immutable — no edits to its content)
        db.prepare(`UPDATE results SET status = 'amended', is_amended = 1 WHERE id = ?`).run(prior.id);

        // Insert new amendment result linked to the prior
        db.prepare(`
          INSERT INTO results (
            id, test_request_id, patient_id, institution_id, status,
            edited_findings, interpretive_comment, approved_by,
            approved_at, digital_signature_path, result_pdf_local_path,
            verification_code, is_amended, amended_from_id, ai_result_id
          ) VALUES (?, ?, ?, ?, 'released', ?, ?, ?, datetime('now'), ?, ?, ?, 1, ?, ?)
        `).run(
          newResultId, prior.test_request_id, prior.patient_id, prior.institution_id,
          payload.editedFindings, prior.interpretive_comment, session.userId,
          sigPath, pdfPath, newVerificationCode, prior.id, prior.ai_result_id
        );

        db.prepare(`
          INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata)
          VALUES (?, ?, 'amend_result', 'result', ?, ?)
        `).run(session.userId, prior.institution_id, newResultId,
          JSON.stringify({ priorResultId: prior.id, reason: payload.amendmentReason }));
      })();
      } catch (dbError: any) {
        try { if (fs.existsSync(sigPath)) fs.unlinkSync(sigPath); } catch (e) {}
        try { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); } catch (e) {}
        throw dbError;
      }
  
      if (payload.autoPrint !== false) {
        try {
          await printLocalReport(pdfPath);
        } catch (printError) {
          console.error('[Main Process] Print failed:', printError);
          return { success: true, verificationCode: newVerificationCode, pdfPath, printWarning: 'Amendment saved, but printing failed.' };
        }
      }
      return { success: true, verificationCode: newVerificationCode, pdfPath };

    } catch (error: any) {
      console.error('[Main Process] Amendment failed:', error);
      return { success: false, error: error.message };
    }
  });


}
