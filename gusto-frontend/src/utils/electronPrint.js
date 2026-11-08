/**
 * Electron Thermal Printer Helper
 * Use this to print receipts from Vue app when running in Electron
 */

// Check if running in Electron
export const isElectron = () => {
  return window.electronAPI !== undefined
}

// Get available printers
export const getPrinters = async () => {
  if (!isElectron()) {
    console.warn('Not running in Electron - cannot get printers')
    return []
  }
  
  try {
    const printers = await window.electronAPI.getPrinters()
    return printers
  } catch (error) {
    console.error('Error getting printers:', error)
    return []
  }
}

// Print order receipt (thermal 80mm)
export const printOrderReceipt = async (order) => {
  if (!isElectron()) {
    console.warn('Not running in Electron - using browser print instead')
    window.print()
    return { success: false, message: 'Not in Electron' }
  }
  
  try {
    const receiptData = {
      type: 'order',
      content: {
        orderNumber: order.orderNumber || order.idOrder,
        date: new Date().toLocaleString('ar-EG', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        table: order.tableNumber || null,
        items: order.items.map(item => ({
          name: item.itemName,
          quantity: item.quantity,
          price: item.price
        })),
        total: order.totalAmount
      }
    }
    
    console.log('🖨️ Printing receipt:', receiptData)
    const result = await window.electronAPI.printReceipt(receiptData)
    
    if (result.success) {
      console.log('✅ Receipt printed successfully to:', result.printer)
    } else {
      console.error('❌ Print failed:', result.error)
    }
    
    return result
    
  } catch (error) {
    console.error('Error printing receipt:', error)
    return { success: false, error: error.message }
  }
}

// Print purchase order receipt
export const printPurchaseReceipt = async (purchase) => {
  if (!isElectron()) {
    window.print()
    return { success: false, message: 'Not in Electron' }
  }
  
  try {
    const receiptData = {
      type: 'order',
      content: {
        orderNumber: purchase.purchaseNumber,
        date: new Date(purchase.purchaseDate).toLocaleDateString('ar-EG'),
        items: purchase.items.map(item => ({
          name: item.ingredientName,
          quantity: item.orderedQuantity,
          price: item.unitPrice
        })),
        total: purchase.totalAmount
      }
    }
    
    const result = await window.electronAPI.printReceipt(receiptData)
    return result
    
  } catch (error) {
    console.error('Error printing purchase:', error)
    return { success: false, error: error.message }
  }
}

// Print custom HTML to thermal printer
export const printCustom = async (htmlContent) => {
  if (!isElectron()) {
    console.warn('Not running in Electron')
    return { success: false, message: 'Not in Electron' }
  }
  
  try {
    const receiptData = {
      type: 'custom',
      content: {
        html: htmlContent
      }
    }
    
    const result = await window.electronAPI.printReceipt(receiptData)
    return result
    
  } catch (error) {
    console.error('Error printing custom:', error)
    return { success: false, error: error.message }
  }
}

export default {
  isElectron,
  getPrinters,
  printOrderReceipt,
  printPurchaseReceipt,
  printCustom
}

