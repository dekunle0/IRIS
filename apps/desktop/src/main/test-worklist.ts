// apps/desktop/src/main/test-worklist.ts
import { db } from './db';
import crypto from 'crypto';

console.log("--- 🚀 Generating Fake Worklist Data ---");

try {
  // 1. Get the admin user & institution to tie the records to
  const admin = db.prepare("SELECT id, institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;

  if (!admin) {
    console.error("❌ Admin user not found. Please run the auth test first to seed the database.");
    process.exit(1);
  }

  // 2. Create a fake patient
  const patientId = crypto.randomUUID();
  const patientCode = `PT-${Date.now().toString().slice(-6)}`;
  db.prepare(`
    INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, consent_signature_path, consent_given)
    VALUES (?, ?, ?, 'Adebayo Johnson', '1985-06-15', 'Male', '08012345678', '/local/signatures/fake.png', 1)
  `).run(patientId, patientCode, admin.institution_id);

  // 3. Create a STAT sample (Urgent)
  const sampleId1 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
    VALUES (?, ?, ?, 'stat', 'collected', ?)
  `).run(sampleId1, patientId, admin.institution_id, admin.id);

  // 4. Create a Routine sample
  const sampleId2 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
    VALUES (?, ?, ?, 'routine', 'requested', ?)
  `).run(sampleId2, patientId, admin.institution_id, admin.id);

  // 5. Create Test Requests
  // The Playbook mandates Malaria Parasite MUST be 'parasitology'
  const testReq1 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status, assigned_to)
    VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'requested', ?)
  `).run(testReq1, sampleId1, admin.id);

  const testReq2 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
    VALUES (?, ?, 'haematology', 'WBC Differential', 'requested')
  `).run(testReq2, sampleId2);

  console.log("✅ Successfully injected fake patients, samples, and test requests!");
  console.log("👉 Go look at your Worklist UI in the browser!");

} catch (err) {
  console.error("❌ Failed to insert fake data:", err);
}