import { ipcMain, app } from 'electron';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db, encryptField, decryptField, encryptBuffer } from '../db';

// ─── Role gate for test categories requiring specialist approval ──────────────
import { SPECIALIST_ROLES } from '../../utils/constants';

export { SPECIALIST_ROLES };

export function registerPatientHandlers() {
  ipcMain.handle('patients:create', async (_, patientData, session) => {
    try {
      if (session.role === 'viewer') return { success: false, error: 'Unauthorized Action: Viewers cannot create patient records.' };
      
      const phone = String(patientData.phone || '').replace(/\s/g, '');
      if (!/^0[789]\d{9}$/.test(phone)) return { success: false, error: 'Phone number must be an 11-digit Nigerian mobile number.' };
      
      const dob = String(patientData.dob || '');
      const parsedDob = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
      const dobDate = parsedDob ? new Date(Number(parsedDob[1]), Number(parsedDob[2]) - 1, Number(parsedDob[3])) : null;
      if (!parsedDob || !dobDate || dobDate.getFullYear() !== Number(parsedDob[1]) || dobDate.getMonth() !== Number(parsedDob[2]) - 1 || dobDate.getDate() !== Number(parsedDob[3]) || dobDate >= new Date()) return { success: false, error: 'Date of birth must be a valid past date in YYYY-MM-DD format.' };
      
      const existing = db.prepare(`
        SELECT id, patient_code FROM patients
        WHERE LOWER(full_name) = LOWER(?) AND dob = ? AND institution_id = ?
      `).get(patientData.fullName, patientData.dob, session.institutionId) as any;
      if (existing) return { success: false, error: `Duplicate Record: Patient already exists with ID ${existing.patient_code}` };

      if (!patientData.signatureData || typeof patientData.signatureData !== 'string' || !patientData.signatureData.includes(',')) {
        return { success: false, error: 'NDPR Compliance: Patient consent signature is mandatory.' };
      }

      const id = crypto.randomUUID();
      const patientCode = `PT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Encrypt NIN and chronic flags at rest
      const ninEncrypted = encryptField(patientData.nin || null);
      const chronicEncrypted = encryptField(patientData.chronicFlags || null);

      // Save encrypted signature to disk
      const sigBuffer = Buffer.from(patientData.signatureData.split(',')[1], 'base64');
      const sigPath = path.join(app.getPath('userData'), `sig_patient_${id}.png.enc`);
      fs.writeFileSync(sigPath, encryptBuffer(sigBuffer));

      const insert = db.prepare(`
        INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, email, address, next_of_kin, hospital_number, nin_encrypted, chronic_flags_encrypted, consent_signature_path, consent_given, consent_timestamp, created_by)
        VALUES (@id, @patientCode, @institutionId, @fullName, @dob, @gender, @phone, @email, @address, @nextOfKin, @hospitalNumber, @ninEncrypted, @chronicEncrypted, @sigPath, 1, datetime('now'), @createdBy)
      `);
      
      let successData: any = null;
      
      db.transaction(() => {
        // Atomic duplicate phone check
        const duplicatePhone = db.prepare('SELECT patient_code FROM patients WHERE phone = ? AND institution_id = ?').get(phone, session.institutionId) as any;
        if (duplicatePhone) throw new Error(`This phone number is already registered to patient ${duplicatePhone.patient_code}.`);

        insert.run({
          id, patientCode, institutionId: session.institutionId, fullName: patientData.fullName,
          dob: patientData.dob, gender: patientData.gender, phone,
          email: patientData.email || null,
          address: patientData.address || null,
          nextOfKin: patientData.nextOfKin || null,
          hospitalNumber: patientData.hospitalNumber || null,
          ninEncrypted, chronicEncrypted,
          sigPath, createdBy: session.userId
        });
        successData = { id, patientCode };
      })();
      return { success: true, data: successData };
    } catch (error: any) {
      console.error('[Main Process] Database write failed:', error);
      return { success: false, error: error.message || 'Database write failed' };
    }
  });

  ipcMain.handle('patients:getById', async (_, patientId, session) => {
    try {
      const patient = db.prepare(`
        SELECT id, patient_code, full_name, dob, gender, phone, nin_encrypted, chronic_flags_encrypted, hospital_number,
               consent_given, consent_timestamp, created_at
        FROM patients WHERE id = ? AND institution_id = ?
      `).get(patientId, session.institutionId) as any;

      if (!patient) return { success: false, error: 'Patient not found.' };

      // Decrypt NIN — only expose last 4 digits to non-admin roles
      const ninPlain = decryptField(patient.nin_encrypted);
      const ninMasked = ninPlain
        ? (session.role === 'admin' ? ninPlain : `***-***-${ninPlain.slice(-4)}`)
        : null;

      // Decrypt chronic flags
      const chronicFlags = decryptField(patient.chronic_flags_encrypted);

      return { success: true, data: { ...patient, nin: ninMasked, chronic_flags: chronicFlags, nin_encrypted: undefined, chronic_flags_encrypted: undefined } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('patients:exportData', async (_, patientId, session) => {
    try {
      if (session.role !== 'admin') return { success: false, error: 'Unauthorized: Only admins can process NDPR data requests.' };
      const patient = db.prepare(`SELECT * FROM patients WHERE id = ? AND institution_id = ?`).get(patientId, session.institutionId) as any;
      if (!patient) return { success: false, error: 'Patient not found.' };

      patient.nin_plain = decryptField(patient.nin_encrypted);
      patient.chronic_flags_plain = decryptField(patient.chronic_flags_encrypted);
      
      const tests = db.prepare(`SELECT * FROM test_requests tr JOIN samples s ON tr.sample_id = s.id WHERE s.patient_id = ?`).all(patientId);
      const results = db.prepare(`SELECT * FROM results WHERE patient_id = ?`).all(patientId);
      
      const exportData = JSON.stringify({ patient, tests, results }, null, 2);
      
      const exportPath = path.join(app.getPath('downloads'), `ndpr_export_${patient.patient_code}_${Date.now()}.json`);
      fs.writeFileSync(exportPath, exportData);
      
      db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'ndpr_export_data', 'patient', ?)`).run(session.userId, session.institutionId, patientId);
      
      const { shell } = require('electron');
      shell.showItemInFolder(exportPath);
      
      return { success: true, path: exportPath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('patients:eraseData', async (_, patientId, session) => {
    try {
      if (session.role !== 'admin') return { success: false, error: 'Unauthorized: Only admins can process NDPR erasure requests.' };
      const patient = db.prepare(`SELECT id, patient_code FROM patients WHERE id = ? AND institution_id = ?`).get(patientId, session.institutionId) as any;
      if (!patient) return { success: false, error: 'Patient not found.' };

      db.transaction(() => {
        // Erase PII but keep clinical data for MLSCN aggregate stats
        db.prepare(`UPDATE patients SET full_name = 'ERASED', phone = 'ERASED', dob = '1970-01-01', nin_encrypted = NULL, address = NULL, email = NULL, next_of_kin = NULL, consent_signature_path = NULL WHERE id = ?`).run(patientId);
        db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'ndpr_erase_data', 'patient', ?, 'PII erased per NDPR right to erasure')`).run(session.userId, session.institutionId, patientId);
      })();
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
