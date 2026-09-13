// apps/desktop/src/main/ipc/auth-handlers.ts
import { ipcMain } from 'electron';

export function registerAuthHandlers() {
  ipcMain.handle('auth:login', async (_, credentials) => {
    console.log('[Main Process] Offline Auth Triggered');
    // For the offline clinical desktop, we simulate a successful local session
    return { 
      success: true, 
      user: { id: 'local-admin', name: 'Clinical User' } 
    };
  });

  ipcMain.handle('auth:logout', async () => {
    console.log('[Main Process] Offline Logout Triggered');
    return { success: true };
  });
}