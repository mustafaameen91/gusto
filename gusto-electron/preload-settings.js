// Bridge for the printer-settings window
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gustoSettings", {
  load: () => ipcRenderer.invoke("settings:load"),
  save: (settings) => ipcRenderer.invoke("settings:save", settings),
  systemPrinters: () => ipcRenderer.invoke("settings:system-printers"),
  categories: (serverUrl) => ipcRenderer.invoke("settings:categories", serverUrl),
  checkServer: (serverUrl) => ipcRenderer.invoke("settings:check-server", serverUrl),
  testPrinter: (printer) => ipcRenderer.invoke("settings:test-printer", printer),
  openDrawer: (printer) => ipcRenderer.invoke("settings:open-drawer", printer),
  close: () => ipcRenderer.invoke("settings:close"),
});
