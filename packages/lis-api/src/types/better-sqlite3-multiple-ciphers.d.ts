// better-sqlite3-multiple-ciphers is API-identical to better-sqlite3.
// Re-export its types from @types/better-sqlite3 to satisfy TypeScript.
declare module 'better-sqlite3-multiple-ciphers' {
  import BetterSqlite3 from 'better-sqlite3';
  export = BetterSqlite3;
}

