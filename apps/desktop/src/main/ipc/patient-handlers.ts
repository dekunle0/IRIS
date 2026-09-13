// apps/desktop/src/main/ipc/patient-handlers.ts
import { ipcMain } from 'electron';
import crypto from 'crypto';
import { db } from '../db';

export function registerPatientHandlers() {
  ipcMain.handle('patients:create', async (_, patientData) => {
    try {
      const id = crypto.randomUUID();
      const patientCode = `PT-${Date.now().toString().slice(-6)}`;
      
      const admin = db.prepare("SELECT institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      
      const insert = db.prepare(`
        INSERT INTO patients (
          id, patient_code, institution_id, full_name, dob, gender, phone, 
          nin_encrypted, consent_signature_path, consent_given
        )
        VALUES (
          @id, @patientCode, @institutionId, @fullName, @dob, @gender, @phone, 
          @nin, @signatureData, 1
        )
      `);
      
      insert.run({
        id,
        patientCode,
        institutionId: admin.institution_id,
        fullName: patientData.fullName,
        dob: patientData.dob,
        gender: patientData.gender,
        phone: patientData.phone,
        nin: patientData.nin || null,
        signatureData: patientData.signatureData 
      });
      
      return { success: true, data: { id, patientCode } };
      
    } catch (error) {
      console.error('[Main Process] Database write failed:', error);
      return { success: false, error: 'Database write failed' };
    }
  });
}