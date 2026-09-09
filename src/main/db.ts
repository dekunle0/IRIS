// apps/desktop/src/main/db.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

// Store the database securely in the operating system's designated app data folder
const dbPath = path.join(app.getPath('userData'), 'iris-offline.db');

// Open the connection
export const db = new Database(dbPath, { verbose: console.log });

// Initialize the database tables
export function initDB() {
  console.log(`[Database] Initializing SQLite at: ${dbPath}`);

  // Create the patients table. We store the signature as a text-based Data URL.
  const createTableQuery = `
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
  `;

  db.exec(createTableQuery);
  console.log('[Database] Tables are ready.');
}