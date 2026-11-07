const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ett', {
  links: ipcRenderer.sendSync('ett:links'),
  version: ipcRenderer.sendSync('ett:version'),
  openExternal: url => ipcRenderer.invoke('ett:open', url),
});
