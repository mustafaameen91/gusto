const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('customerDisplayAPI', {
  onCartUpdate: (callback) => ipcRenderer.on('cart-update', (_event, data) => callback(data)),
  onOrderComplete: (callback) => ipcRenderer.on('order-complete', (_event, data) => callback(data)),
  onLogoReady: (callback) => ipcRenderer.on('logo-data', (_event, data) => callback(data))
})

console.log('✅ Customer display preload loaded')
