var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  initDB: () => initDB
});
module.exports = __toCommonJS(db_exports);
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_electron = require("electron");
var import_path = __toESM(require("path"));
var dbPath = import_path.default.join(import_electron.app.getPath("userData"), "iris-offline.db");
var db = new import_better_sqlite3.default(dbPath, { verbose: console.log });
function initDB() {
  console.log(`[Database] Initializing SQLite at: ${dbPath}`);
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
  console.log("[Database] Tables are ready.");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  db,
  initDB
});
