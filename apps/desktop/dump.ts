import Database from 'better-sqlite3';

const db = new Database('iris-offline.db');

console.log('--- CAPTURES TABLE ---');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE name='captures'").get()?.sql);