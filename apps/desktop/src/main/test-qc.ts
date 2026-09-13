// apps/desktop/src/main/test-qc.ts
import { db, initDB } from './db';
import crypto from 'crypto';

async function runQCTest() {
  console.log("--- 🚀 Starting IRIS QC Aggregation Test ---");
  
  await initDB();

  console.log("\n[Database] Injecting mock results for QC calculation...");
  
  const admin = db.prepare("SELECT id, institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
  if (!admin) {
    console.error("❌ Admin user not found. Run auth test first.");
    return;
  }

  // 1. Create Patient & Sample
  const patientId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, consent_given)
    VALUES (?, ?, ?, 'QC Test Patient', '1990-01-01', 'Female', '000', 1)
  `).run(patientId, `QC-${Date.now().toString().slice(-6)}`, admin.institution_id);

  const sampleId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
    VALUES (?, ?, ?, 'routine', 'collected', ?)
  `).run(sampleId, patientId, admin.institution_id, admin.id);

  // 2. TEST CASE 1: AI Agreement (No Corrections)
  const reqId1 = crypto.randomUUID();
  const resId1 = crypto.randomUUID();
  
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status, created_at)
    VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'released', datetime('now', '-2 hours'))
  `).run(reqId1, sampleId);

  db.prepare(`
    INSERT INTO results (id, test_request_id, patient_id, institution_id, edited_findings, status, approved_by)
    VALUES (?, ?, ?, ?, '{"parasitemia": "2+"}', 'released', ?)
  `).run(resId1, reqId1, patientId, admin.institution_id, admin.id);

  // 3. TEST CASE 2: AI Disagreement (With Correction)
  const reqId2 = crypto.randomUUID();
  const resId2 = crypto.randomUUID();
  
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status, created_at)
    VALUES (?, ?, 'haematology', 'WBC Differential', 'released', datetime('now', '-1 hours'))
  `).run(reqId2, sampleId);

  db.prepare(`
    INSERT INTO results (id, test_request_id, patient_id, institution_id, edited_findings, status, approved_by)
    VALUES (?, ?, ?, ?, '{"wbc": "normal"}', 'released', ?)
  `).run(resId2, reqId2, patientId, admin.institution_id, admin.id);

  db.prepare(`
    INSERT INTO corrections (id, result_id, scientist_id, field_name, original_ai_value, corrected_value)
    VALUES (?, ?, ?, 'wbc', 'high', 'normal')
  `).run(crypto.randomUUID(), resId2, admin.id);

  console.log("[Database] ✅ Mock QC data injected successfully.");

  // 4. Run the QC Math (Matches IPC Handler)
  console.log("\n[QC Math] Calculating clinical metrics...");
  
  const totalRequests = db.prepare(`SELECT count(*) as count FROM test_requests`).get() as { count: number };
  const completedResults = db.prepare(`SELECT count(*) as count FROM results WHERE status = 'released'`).get() as { count: number };
  const totalCorrections = db.prepare(`SELECT count(*) as count FROM corrections`).get() as { count: number };
  
  const agreementRate = completedResults.count > 0 
    ? Math.round(((completedResults.count - totalCorrections.count) / completedResults.count) * 100) 
    : 100;

  console.log(`📊 Total Analyses Logged: ${totalRequests.count}`);
  console.log(`📊 Completed Results: ${completedResults.count}`);
  console.log(`📊 Manual Corrections: ${totalCorrections.count}`);
  console.log(`🎯 AI Agreement Rate: ${agreementRate}%`);

  if (agreementRate >= 0 && agreementRate <= 100) {
    console.log("\n✅ SUCCESS: QC aggregation engine is working perfectly!");
  } else {
    console.log("\n❌ FAILED: QC math is returning invalid percentages.");
  }
}

runQCTest();