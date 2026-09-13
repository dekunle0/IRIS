// apps/desktop/src/main/test-db.ts
import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';

console.log("--- 🚀 Starting IRIS Offline Database Test (Node Mode) ---");

// 1. Create a local test DB to completely bypass Electron's app.getPath()
const dbPath = path.join(process.cwd(), 'test-iris.db');
const db = new Database(dbPath, { verbose: console.log });

console.log(`[Database] Initializing test SQLite at: ${dbPath}`);

// 2. Create the exact same table as the main app
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    patient_code TEXT UNIQUE,
    full_name TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    nin TEXT,
    signature_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 3. Generate test identifiers
const id = crypto.randomUUID();
const patientCode = `PT-${Date.now().toString().slice(-6)}`;

console.log("\n[Test] Inserting test patient: Jane Doe...");

try {
  // 4. Prepare and execute the SQL insert
  const insert = db.prepare(`
    INSERT INTO patients (id, patient_code, full_name, dob, gender, phone, nin, signature_data)
    VALUES (@id, @patientCode, @fullName, @dob, @gender, @phone, @nin, @signatureData)
  `);

  insert.run({
    id,
    patientCode,
    fullName: 'Jane Doe',
    dob: '1985-06-15',
    gender: 'Female',
    phone: '08012345678',
    nin: '12345678901',
    signatureData: 'data:image/png;base64,fake_signature_data_for_testing'
  });
  console.log("✅ Insert successful!");

  console.log("\n[Test] Fetching the patient back from the database...");
  
  // 5. Read the data back to prove it saved
  const savedPatient = db.prepare("SELECT patient_code, full_name, created_at FROM patients WHERE id = ?").get(id);
  
  console.log("✅ Retrieved Data from SQLite:");
  console.table([savedPatient]);
  
} catch (error) {
  console.error("❌ Database test failed:", error);
}

console.log("\n--- 🏁 Test Complete ---");