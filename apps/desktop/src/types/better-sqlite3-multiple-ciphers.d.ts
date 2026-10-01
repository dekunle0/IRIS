// Type shim: better-sqlite3-multiple-ciphers is API-compatible with
// better-sqlite3 and @types/better-sqlite3 covers it fully.
declare module 'better-sqlite3-multiple-ciphers' {
  import BetterSqlite3 from 'better-sqlite3';
  export = BetterSqlite3;
}

