import { db, initDB } from './db';
import crypto from 'crypto';
import { generateLocalPDF } from './pdf-generator';

async function runApprovalTest() {
  console.log("--- 🚀 Starting IRIS Result Approval & PDF Test ---");
  await initDB();

  try {
    let target = db.prepare(`
      SELECT tr.id as requestId, p.full_name as patientName, tr.test_name as testName, s.priority,
             tr.sample_id, s.patient_id, s.institution_id
      FROM test_requests tr
      JOIN samples s ON tr.sample_id = s.id
      JOIN patients p ON s.patient_id = p.id
      WHERE tr.status != 'released'
      LIMIT 1
    `).get() as any;

    if (!target) {
      console.log("No pending request found. Seeding a new test request...");
      const admin = db.prepare("SELECT id, institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      const patientId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, consent_given, consent_signature_path)
        VALUES (?, 'PT-TEST-01', ?, 'Adebayo Johnson', '1985-06-15', 'Male', '08012345678', 1, 'mock')
      `).run(patientId, admin.institution_id);

      const sampleId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
        VALUES (?, ?, ?, 'stat', 'collected', ?)
      `).run(sampleId, patientId, admin.institution_id, admin.id);

      const reqId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
        VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'requested')
      `).run(reqId, sampleId);

      target = {
        requestId: reqId,
        patientName: 'Adebayo Johnson',
        testName: 'Malaria Parasite',
        priority: 'stat',
        sample_id: sampleId,
        patient_id: patientId,
        institution_id: admin.institution_id
      };
    }

    console.log(`[Test] Approving request for: ${target.patientName}`);

    const verificationCode = `IRIS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const editedFindings = "Plasmodium falciparum trophozoites seen. Parasitemia: 3+ (Confirmed)";

    console.log("[PDF] Generating MLSCN report via pdf-lib...");
    
    const pdfPath = await generateLocalPDF({
      patientName: target.patientName,
      testName: target.testName,
      priority: target.priority,
      editedFindings,
      comments: "High parasitemia. Immediate clinical correlation required.",
      verificationCode,
      approvedByName: 'System Administrator'
    });

    console.log(`[PDF] ✅ Report written successfully: ${pdfPath}`);

    const resultId = crypto.randomUUID();
    db.transaction(() => {
      db.prepare(`
        INSERT INTO results (
          id, test_request_id, patient_id, institution_id, status,
          edited_findings, interpretive_comment, approved_by, approved_at,
          result_pdf_local_path, verification_code
        ) VALUES (?, ?, ?, ?, 'released', ?, ?, 'admin-id', datetime('now'), ?, ?)
      `).run(resultId, target.requestId, target.patient_id, target.institution_id, editedFindings, "Comments", pdfPath, verificationCode);

      db.prepare(`UPDATE test_requests SET status = 'released' WHERE id = ?`).run(target.requestId);
    })();

    const pending = db.prepare(`SELECT count(*) as count FROM test_requests WHERE id = ? AND status != 'released'`).get(target.requestId) as any;
    if (pending.count === 0) {
      console.log("\n[Database] ✅ Result saved and request released!");
      console.log("✅ SUCCESS: Full approval and PDF pipeline verified!");
    }
  } catch (err) {
    console.error("❌ Test failed with error:", err);
  } finally {
    // FIX: Force SQLite to close gracefully, preventing native panic
    db.close(); 
  }
}

runApprovalTest();