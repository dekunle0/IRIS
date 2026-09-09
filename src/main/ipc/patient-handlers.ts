// apps/desktop/src/main/ipc/patient-handlers.ts
import { ipcMain } from 'electron';
import crypto from 'crypto';
import { db } from '../db';

export function registerPatientHandlers() {
  ipcMain.handle('patients:create', async (_, patientData) => {
    try {
      // 1. Generate unique identifiers
      const id = crypto.randomUUID();
      const patientCode = `PT-${Date.now().toString().slice(-6)}`;
      
      console.log(`[Main Process] Saving patient to SQLite: ${patientData.fullName}`);
      
      // 2. Prepare the SQL statement
      const insert = db.prepare(`
        INSERT INTO patients (id, patient_code, full_name, dob, gender, phone, nin, signature_data)
        VALUES (@id, @patientCode, @fullName, @dob, @gender, @phone, @nin, @signatureData)
      `);
      
      // 3. Execute the insert securely (better-sqlite3 handles SQL injection protection automatically)
      insert.run({
        id,
        patientCode,
        fullName: patientData.fullName,
        dob: patientData.dob,
        gender: patientData.gender,
        phone: patientData.phone,
        nin: patientData.nin || null,
        signatureData: patientData.signatureData
      });
      
      // 4. Return success back to the React UI
      return { 
        success: true, 
        data: { id, patientCode } 
      };
      
    } catch (error) {
      console.error('[Main Process] Database write failed:', error);
      return { success: false, error: 'Database write failed' };
    }
  });
}