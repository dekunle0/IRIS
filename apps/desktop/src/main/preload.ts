// apps/desktop/src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

let sessionToken = '';

contextBridge.exposeInMainWorld('electron', {
  setAuthToken: (token: string) => { sessionToken = token; },
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      const validChannels = [
        'auth:', 'users:', 'patients:', 'worklist:', 'qc:', 'ai:', 'results:', 'devices:', 'system:', 'dialog:', 'clipboard:', 'shell:'
      ];
      if (!validChannels.some(prefix => channel.startsWith(prefix))) {
        throw new Error(`IPC channel "${channel}" is not allowed.`);
      }
      return ipcRenderer.invoke(channel, ...args, { __token: sessionToken });
    },
  },
});