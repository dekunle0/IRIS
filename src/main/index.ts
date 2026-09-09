// apps/desktop/src/main/index.ts
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerAuthHandlers } from './ipc/auth-handlers';
import { registerPatientHandlers } from './ipc/patient-handlers';
import { initDB } from './db'; // <-- 1. Import the DB initializer

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // 2. Initialize the SQLite database first
  initDB();
  
  // 3. Activate your IPC Handlers
  registerAuthHandlers();
  registerPatientHandlers();

  // 4. Open the window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});