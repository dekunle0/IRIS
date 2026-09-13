// apps/desktop/src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// This safely exposes the exact IPC methods React is allowed to call
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  },
});