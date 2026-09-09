var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/main/index.ts
var import_electron4 = require("electron");
var path2 = __toESM(require("path"));

// src/main/ipc/auth-handlers.ts
var import_electron = require("electron");
function registerAuthHandlers() {
  import_electron.ipcMain.handle("auth:login", async (_, credentials) => {
    console.log("[Main Process] Offline Auth Triggered");
    return {
      success: true,
      user: { id: "local-admin", name: "Clinical User" }
    };
  });
  import_electron.ipcMain.handle("auth:logout", async () => {
    console.log("[Main Process] Offline Logout Triggered");
    return { success: true };
  });
}

// src/main/ipc/patient-handlers.ts
var import_electron3 = require("electron");
var import_crypto = __toESM(require("crypto"));

// src/main/db.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_electron2 = require("electron");
var import_path = __toESM(require("path"));
var dbPath = import_path.default.join(import_electron2.app.getPath("userData"), "iris-offline.db");
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

// src/main/ipc/patient-handlers.ts
function registerPatientHandlers() {
  import_electron3.ipcMain.handle("patients:create", async (_, patientData) => {
    try {
      const id = import_crypto.default.randomUUID();
      const patientCode = `PT-${Date.now().toString().slice(-6)}`;
      console.log(`[Main Process] Saving patient to SQLite: ${patientData.fullName}`);
      const insert = db.prepare(`
        INSERT INTO patients (id, patient_code, full_name, dob, gender, phone, nin, signature_data)
        VALUES (@id, @patientCode, @fullName, @dob, @gender, @phone, @nin, @signatureData)
      `);
      insert.run({
        id,
        patientCode,
        fullName: patientData.fullName,
        dob: patientData.dob,
        gender: patientData.gender,
        phone: patientData.phone,
        nin: patientData.nin || null,
        signatureData: patientData.signatureData
      });
      return {
        success: true,
        data: { id, patientCode }
      };
    } catch (error) {
      console.error("[Main Process] Database write failed:", error);
      return { success: false, error: "Database write failed" };
    }
  });
}

// src/main/index.ts
function createWindow() {
  const mainWindow = new import_electron4.BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path2.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (process.env.NODE_ENV !== "production") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path2.join(__dirname, "../dist/index.html"));
  }
}
import_electron4.app.whenReady().then(() => {
  initDB();
  registerAuthHandlers();
  registerPatientHandlers();
  createWindow();
  import_electron4.app.on("activate", () => {
    if (import_electron4.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron4.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron4.app.quit();
  }
});
