// apps/desktop/src/main/test-auth.ts
import { db, initDB } from './db';
import { verifyPassword } from '../../../../packages/db/src/auth/hash';

async function runAuthTest() {
  console.log("--- 🚀 Starting IRIS Auth Backend Test ---");
  
  // ADD AWAIT HERE
  await initDB();

  const user = db.prepare(`SELECT * FROM users WHERE role = 'admin'`).get() as any;
  
  // ... rest of the file stays exactly the same
  
  if (!user) {
    console.error("❌ Test Failed: Administrator account was not seeded.");
    return;
  }

  console.log(`\n[Database] Found User: ${user.full_name} (${user.role})`);
  console.log(`[Database] Hashed Password: ${user.password_hash.substring(0, 30)}...`);

  // 3. Test Correct Password
  console.log(`\n[Auth] Testing CORRECT password ('Admin123!')...`);
  const isCorrect = await verifyPassword(user.password_hash, 'Admin123!');
  console.log(isCorrect ? "✅ SUCCESS: Password accepted!" : "❌ FAILED: Password rejected!");

  // 4. Test Incorrect Password
  console.log(`\n[Auth] Testing WRONG password ('hackMe123')...`);
  const isWrong = await verifyPassword(user.password_hash, 'hackMe123');
  console.log(!isWrong ? "✅ SUCCESS: Wrong password safely rejected!" : "❌ FAILED: Security breach!");
}

runAuthTest();