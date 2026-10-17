const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('missionControl', {
  appMeta: () => ipcRenderer.invoke('app-meta'),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
});
