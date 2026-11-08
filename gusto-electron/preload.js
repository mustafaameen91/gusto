// Preload script for security
const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  // Printing: one order → cashier receipt + kitchen/grill tickets (configured on this POS)
  printOrder: (order, opts) => ipcRenderer.invoke('print-order', order, opts),
  openDrawer: () => ipcRenderer.invoke('open-drawer'),
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  openPrinterSettings: () => ipcRenderer.send('open-printer-settings'),
  retryConnection: () => ipcRenderer.send('retry-connection'),
  // Customer display functions
  updateCustomerDisplay: (data) => ipcRenderer.invoke('update-customer-display', data),
  showOrderOnDisplay: (data) => ipcRenderer.invoke('show-order-on-display', data)
})

console.log('✅ Preload script loaded with print support')

