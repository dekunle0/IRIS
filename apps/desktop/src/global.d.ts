// apps/desktop/src/global.d.ts
export {};

declare global {
  interface Window {
    electron: {
      setAuthToken: (token: string) => void;
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
    };
  }
}

// better-sqlite3-multiple-ciphers is API-identical to better-sqlite3.
// Re-export its types so TypeScript resolves the import in db.ts.
declare module 'better-sqlite3-multiple-ciphers' {
  import BetterSqlite3 from 'better-sqlite3';
  export = BetterSqlite3;
}
