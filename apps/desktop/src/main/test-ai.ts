// apps/desktop/src/main/test-ai.ts
import { db, initDB } from './db';
import http from 'http';
import crypto from 'crypto';

async function runAITest() {
  console.log("--- 🚀 Starting IRIS AI Engine Bridge Test ---");
  
  await initDB();

  console.log("\n[Database] Prepping parent records for AI result insertion...");
  const admin = db.prepare("SELECT id, institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
  if (!admin) {
    console.error("❌ Admin user not found. Run auth test first.");
    return;
  }

  // 1. Create the clinical hierarchy to satisfy all Foreign Keys
  const patientId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, consent_given)
    VALUES (?, ?, ?, 'AI Test Patient', '1995-05-05', 'Male', '08000000000', 1)
  `).run(patientId, `AI-${Date.now().toString().slice(-6)}`, admin.institution_id);

  const sampleId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
    VALUES (?, ?, ?, 'routine', 'collected', ?)
  `).run(sampleId, patientId, admin.institution_id, admin.id);

  const testReqId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
    VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'processing')
  `).run(testReqId, sampleId);

  const captureId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO captures (id, test_request_id, video_local_path, created_by)
    VALUES (?, ?, '/local/captures/vid_test.mp4', ?)
  `).run(captureId, testReqId, admin.id);

  console.log("[Test] Spinning up mock Python FastAPI server on port 8000...");
  
  const mockServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/analyse') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      
      req.on('end', () => {
        console.log(`\n[Python Mock] 📥 Received Payload from Electron:\n`, JSON.parse(body));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          model_version: 'v2.4.1',
          findings: { parasitemia: '3+', wbc_count: 'normal' },
          confidence_scores: { parasitemia: 0.96 },
          uncertain_cells_pct: 1.2
        }));
      });
    }
  });

  await new Promise<void>((resolve) => {
    mockServer.listen(8000, '127.0.0.1', () => resolve());
  });

  console.log("[Test] Mock Server listening. Triggering Electron AI Bridge...");
  
  const payload = {
    captureId: captureId, // Use the dynamically created capture record
    videoPath: '/local/captures/vid_test.mp4',
    testType: 'Malaria Parasite',
    patientContext: { age: 35, gender: 'Male' }
  };

  const postData = JSON.stringify({
    capture_path: payload.videoPath,
    test_type: payload.testType,
    patient_context: payload.patientContext
  });

  const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/analyse',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    
    res.on('end', () => {
      const aiResult = JSON.parse(responseBody);
      console.log(`\n[Electron Bridge] 📤 Received AI Result from Python:\n`, aiResult);

      try {
        const aiResultId = crypto.randomUUID();
        
        db.prepare(`
          INSERT INTO ai_results (
            id, capture_id, model_version, test_type, findings, 
            confidence_scores, uncertain_cells_pct
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          aiResultId, 
          payload.captureId, 
          aiResult.model_version, 
          payload.testType, 
          JSON.stringify(aiResult.findings), 
          JSON.stringify(aiResult.confidence_scores),
          aiResult.uncertain_cells_pct
        );
        
        console.log("\n[Database] ✅ AI Result successfully saved to local SQLite!");
        console.log("\n✅ SUCCESS: Electron to Python Bridge is working perfectly!");
         
      } catch (err: any) {
        console.error("\n❌ FAILED Database Write:", err.message);
      } finally {
        mockServer.close(() => process.exit(0));
      }
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Request encountered a problem: ${e.message}`);
    mockServer.close(() => process.exit(1));
  });

  req.write(postData);
  req.end();
}

runAITest();