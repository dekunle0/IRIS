// src/main/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel, ...args) => import_electron.ipcRenderer.invoke(channel, ...args)
  }
});
