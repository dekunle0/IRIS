import { app, BrowserWindow, dialog, ipcMain, session, clipboard, nativeTheme, shell } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import fs from 'fs';
import { registerAuthHandlers } from './ipc/auth-handlers';
import { registerPatientHandlers } from './ipc/patient-handlers';
import { initDB, db } from './db';
import { registerWorklistHandlers } from './ipc/worklist-handlers';
import { registerQCHandlers } from './ipc/qc-handlers';
import { registerAIHandlers } from './ipc/ai-handlers';
import { registerResultHandlers } from './ipc/result-handlers';
import { registerDeviceHandlers } from './ipc/device-handlers';
import { verifyLocalSession } from '../../../../packages/db/src/auth/session';

// IRIS-H-174: Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// IRIS-H-187: Crash handlers
process.on('uncaughtException', (err) => {
  console.error('[System] Uncaught Exception:', err);
  // Log locally but do not crash the DB layer abruptly
});

let aiServiceProcess: ChildProcess | null = null;
const logFd = fs.openSync(path.join(app.getPath('userData'), 'ai_service.log'), 'a');

export function killAIService() {
  if (aiServiceProcess && aiServiceProcess.pid) {
    try {
      if (process.platform === 'win32') {
        // IRIS-H-191: spawn async instead of blocking execSync
        spawn('taskkill', ['/pid', aiServiceProcess.pid.toString(), '/t', '/f'], { windowsHide: true });
      } else {
        process.kill(aiServiceProcess.pid, 'SIGKILL');
      }
    } catch (e) {}
    aiServiceProcess = null;
  }
}

export function startAIService() {
  if (aiServiceProcess) return;
  killAIService(); // Ensure port is clear

  if (!process.env.IRIS_AI_TOKEN) {
    process.env.IRIS_AI_TOKEN = require('crypto').randomBytes(32).toString('hex');
  }

  const serviceRoot = app.isPackaged
    ? path.join(process.resourcesPath, 'ai-service')
    : path.resolve(app.getAppPath(), '../../packages/ai');
  const serviceExecutable = app.isPackaged
    ? path.join(serviceRoot, process.platform === 'win32' ? 'iris-ai-service.exe' : 'iris-ai-service')
    : path.join(serviceRoot, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
  const serviceArgs = app.isPackaged ? [] : [path.join(serviceRoot, 'main.py')];

  // IRIS-H-192: Pipe stdio for diagnostics
  aiServiceProcess = spawn(serviceExecutable, serviceArgs, {
    cwd: serviceRoot,
    env: { ...process.env, OMP_NUM_THREADS: '2', MKL_NUM_THREADS: '2', OPENBLAS_NUM_THREADS: '2', IRIS_DESKTOP_PID: process.pid.toString() },
    windowsHide: true,
    stdio: ['ignore', logFd, logFd]
  });

  aiServiceProcess.once('error', (error) => {
    console.error('[AI Service] Could not start local analysis service:', error);
    aiServiceProcess = null;
  });
  // IRIS-H-193: AI Respawn
  aiServiceProcess.once('exit', () => {
    aiServiceProcess = null;
    console.log('[AI Service] Exited. Respawning in 3s...');
    setTimeout(startAIService, 3000);
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'IRIS',
    icon: path.join(app.getAppPath(), 'build', 'icon.ico'),
    titleBarStyle: 'hidden',
    // IRIS-H-182 & 183: Theme awareness and macOS traffic lights
    titleBarOverlay: {
      color: nativeTheme.shouldUseDarkColors ? '#0f172a' : '#F8FAFC',
      symbolColor: nativeTheme.shouldUseDarkColors ? '#cbd5e1' : '#334155',
    },
    trafficLightPosition: { x: 16, y: 16 },
    autoHideMenuBar: true,
    show: false, // IRIS-H-184
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.platform === 'darwin') {
    require('electron').Menu.setApplicationMenu(null);
  } else {
    mainWindow.setMenu(null);
  }

  mainWindow.maximize();

  mainWindow.on('page-title-updated', (evt) => {
    evt.preventDefault();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // IRIS-H-187
  mainWindow.webContents.on('render-process-gone', (e, details) => {
    console.error('Render process gone:', details.reason);
  });

  // IRIS-H-179
  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error(`[Load Error] ${url}: ${desc} (${code})`);
    if (url === 'http://localhost:5174/') {
      setTimeout(() => mainWindow.loadURL('http://localhost:5174'), 2000);
    }
  });

  // IRIS-H-185
  mainWindow.on('closed', () => {
    // Window reference cleanup
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5174').catch(() => {});
    // IRIS-H-181: Do not auto open DevTools on the clinical workstation!
    if (process.env.DEBUG) mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html')).catch(() => {});
  }
}

// IRIS-H-177
app.on('second-instance', () => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length) {
    if (windows[0].isMinimized()) windows[0].restore();
    windows[0].focus();
  }
});

// IRIS-H-188
app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' http://localhost:*; font-src 'self' data:;"]
      }
    });
  });

  startAIService();
  await initDB();

  const originalHandle = ipcMain.handle.bind(ipcMain);
  (ipcMain as any).handle = (channel: string, listener: any) => {
    // Only intercept our own channels, leave Electron internal channels alone
    if (!channel.includes(':')) {
      return originalHandle(channel, listener);
    }
    
    originalHandle(channel, async (event, ...args) => {
      const senderUrl = event.senderFrame?.url || event.sender.getURL();
      const isTrusted = senderUrl === 'http://localhost:5174/' || senderUrl === 'http://localhost:5174' || senderUrl.startsWith('file://');
      
      if (!isTrusted) return { success: false, error: 'Unauthorized: Untrusted origin.' };

      if (channel === 'auth:login' || channel === 'auth:recoverPassword' || channel === 'auth:getInitialCredentials' || channel === 'clipboard:write') {
        return listener(event, ...args);
      }

      const lastArg = args[args.length - 1];
      const token = lastArg?.__token;
      const session = verifyLocalSession(token);
      if (!session) return { success: false, error: 'Unauthorized: Valid session token required. Please log in again.' };

      const activeUser = db.prepare('SELECT institution_id, role, full_name, is_active FROM users WHERE id = ?').get(session.userId) as any;
      if (!activeUser || activeUser.is_active !== 1 || activeUser.institution_id !== session.institutionId || activeUser.role !== session.role) {
        return { success: false, error: 'Unauthorized: Account access has changed. Please log in again.' };
      }

      if (args.length === 1) { args = [undefined, session]; } else { args[args.length - 1] = session; }
      return listener(event, ...args);
    });
  };

  registerAuthHandlers();
  registerPatientHandlers();
  registerWorklistHandlers();
  registerQCHandlers();
  registerAIHandlers();
  registerResultHandlers();
  registerDeviceHandlers();

  ipcMain.handle('dialog:openVideo', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Capture (Video or Image)',
      properties: ['openFile'],
      filters: [{ name: 'Media Files', extensions: ['mp4', 'avi', 'mov', 'png', 'jpg', 'jpeg', 'webp'] }]
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('clipboard:write', async (_, text) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('dialog:showMessage', async (_, { title, message }) => {
    dialog.showMessageBox({ type: 'info', title, message });
  });

  nativeTheme.on('updated', () => {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.setTitleBarOverlay({
        color: nativeTheme.shouldUseDarkColors ? '#0f172a' : '#F8FAFC',
        symbolColor: nativeTheme.shouldUseDarkColors ? '#cbd5e1' : '#334155',
      });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(err => {
  console.error('[System] App initialization failed:', err);
  app.quit();
});

app.on('before-quit', () => {
  killAIService();
  console.log('[System] Committing SQLite WAL and closing database connection safely...');
  try {
    // IRIS-H-190: Safely checkpoint WAL before close
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    db.close();
    console.log('[Database] Disconnected successfully.');
  } catch (err) {
    console.error('[Database] Failed to close cleanly:', err);
  }
});

app.on('window-all-closed', () => {
  // IRIS-H-176: Quit universally to avoid orphaning resources on macOS
  app.quit();
});