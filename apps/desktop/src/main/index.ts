import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerAuthHandlers } from './ipc/auth-handlers';
import { registerPatientHandlers } from './ipc/patient-handlers';
import { initDB } from './db'; 
import { registerWorklistHandlers } from './ipc/worklist-handlers';
import { registerQCHandlers } from './ipc/qc-handlers';
import { registerAIHandlers } from './ipc/ai-handlers';
import { registerResultHandlers } from './ipc/result-handlers';

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

app.whenReady().then(async () => {
  await initDB();
  
  registerAuthHandlers();
  registerPatientHandlers();
  registerWorklistHandlers();
  registerQCHandlers();
  registerAIHandlers();
  registerResultHandlers();
  
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