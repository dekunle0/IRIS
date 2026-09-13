// apps/desktop/src/main/db.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { hashPassword } from '../../../../packages/db/src/auth/hash';

// Safely check if we are in Electron (app exists) or Node terminal testing (app is undefined)
const storagePath = app ? app.getPath('userData') : process.cwd();
const dbPath = path.join(storagePath, 'iris-offline.db');

export const db = new Database(dbPath, { verbose: console.log });

async function seedFirstAdmin() {
  const adminExists = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).get();
  
  if (!adminExists) {
    console.log('[Database] No admin found. Seeding initial workspace and Administrator...');
    
    const instId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const hashedPw = await hashPassword('Admin123!');

    db.prepare(`
      INSERT INTO institutions (id, name, type, licence_tier) 
      VALUES (?, 'KytoLabx HQ', 'laboratory', 'enterprise')
    `).run(instId);

    db.prepare(`
      INSERT INTO users (id, institution_id, full_name, role, password_hash) 
      VALUES (?, ?, 'System Administrator', 'admin', ?)
    `).run(adminId, instId, hashedPw);
    
    console.log('[Database] ✅ Initial Admin created. Username: System Administrator | Password: Admin123!');
  }
}

export async function initDB() {
  console.log(`[Database] Initializing SQLite at: ${dbPath}`);

  try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    
    if (!tableExists) {
      console.log('[Database] Applying 15-table schema from 001_init.sql...');
      const schemaPath = path.join(process.cwd(), '../../packages/db/migrations/001_init.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);
      console.log('[Database] Schema successfully applied.');
    }

    // ADD AWAIT HERE so it pauses until the hashing is 100% done
    await seedFirstAdmin();

  } catch (err) {
    console.error('[Database] Failed to initialize schema:', err);
  }
}