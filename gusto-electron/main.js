const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Performance: disable GPU on old hardware to prevent crashes, use software rendering
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-software-rasterizer");

// Development or production URL
const isDev = process.argv.includes("--dev");
// TODO: set the restaurant's production URL (or pass GUSTO_URL) before building a release
const FRONTEND_URL = isDev ? "http://localhost:8080" : process.env.GUSTO_URL || "https://gusto.example.com";

let mainWindow;
let customerWindow;

// Pre-load logo files as base64 at startup
const logos = {};
try {
  const logoFile = path.join(__dirname, "assets", "logo.png");
  logos.logoPng = "data:image/png;base64," + fs.readFileSync(logoFile).toString("base64");
} catch (_) {}
try {
  const iconFile = path.join(__dirname, "assets", "icon.png");
  logos.iconPng = "data:image/png;base64," + fs.readFileSync(iconFile).toString("base64");
} catch (_) {}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "مطعم جوستو - Gusto Restaurant",
    icon: path.join(__dirname, "assets", "icon.png"),
    backgroundColor: "#f5f5f5",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    // Window styling
    titleBarStyle: "default",
    autoHideMenuBar: false,
    frame: true,
    show: false, // Don't show until ready
  });

  // Load the app
  mainWindow
    .loadURL(FRONTEND_URL)
    .then(() => {
      console.log("✅ Loaded frontend URL:", FRONTEND_URL);
      // Inject local logos so the frontend never fetches them from the server
      if (logos.logoPng) {
        mainWindow.webContents
          .executeJavaScript(
            `
          window.__ELECTRON_LOGOS__ = {
            logoPng: "${logos.logoPng}",
            iconPng: "${logos.iconPng || logos.logoPng}"
          };
          // Replace logo images once, then use a throttled observer
          function __replaceLogos__() {
            document.querySelectorAll('img[alt="جوستو"]').forEach(img => {
              if (img.src !== window.__ELECTRON_LOGOS__.logoPng) {
                img.src = window.__ELECTRON_LOGOS__.logoPng;
              }
            });
          }
          __replaceLogos__();
          let __logoTimer__ = null;
          new MutationObserver(() => {
            if (__logoTimer__) return;
            __logoTimer__ = setTimeout(() => { __replaceLogos__(); __logoTimer__ = null; }, 500);
          }).observe(document.body, { childList: true, subtree: true });
        `,
          )
          .catch(() => {});
      }
    })
    .catch((err) => {
      console.error("❌ Failed to load URL:", err);
      mainWindow.loadFile(path.join(__dirname, "error.html"));
    });

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createCustomerWindow() {
  const { screen } = require("electron");
  const displays = screen.getAllDisplays();
  const mainDisplay = screen.getPrimaryDisplay();

  // Only create customer window if a second display is connected
  const customerDisplay = displays.find((d) => d.id !== mainDisplay.id);
  if (!customerDisplay) {
    console.log("📺 No second display detected — skipping customer window");
    return;
  }

  customerWindow = new BrowserWindow({
    x: customerDisplay.bounds.x,
    y: customerDisplay.bounds.y,
    width: customerDisplay.bounds.width,
    height: customerDisplay.bounds.height,
    fullscreen: true,
    frame: false,
    title: "شاشة العميل",
    icon: path.join(__dirname, "assets", "icon.png"),
    backgroundColor: "#1a0e0a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload-customer.js"),
    },
    show: false,
  });

  customerWindow.loadFile(path.join(__dirname, "customer-display.html"));

  customerWindow.webContents.on("did-finish-load", () => {
    // Send logo directly after page loads — no need to wait for IPC request
    const logoData = logos.logoPng || logos.iconPng || "";
    if (logoData) {
      customerWindow.webContents.send("logo-data", logoData);
    }
  });

  customerWindow.once("ready-to-show", () => {
    customerWindow.show();
  });

  customerWindow.on("closed", () => {
    customerWindow = null;
  });
}

function setupCustomerDisplayHandlers() {
  // Send logo as base64 when customer display requests it
  ipcMain.on("request-logo", (event) => {
    try {
      const logoFile = path.join(__dirname, "assets", "logo.png");
      const logoBuffer = fs.readFileSync(logoFile);
      const dataUrl = "data:image/png;base64," + logoBuffer.toString("base64");
      event.sender.send("logo-data", dataUrl);
    } catch (e) {
      console.error("Failed to send logo:", e.message);
    }
  });

  // Live cart updates (as cashier adds/removes items)
  ipcMain.handle("update-customer-display", async (_event, data) => {
    if (customerWindow && !customerWindow.isDestroyed()) {
      customerWindow.webContents.send("cart-update", data);
    }
    return { success: true };
  });

  // Final order complete (after checkout)
  ipcMain.handle("show-order-on-display", async (_event, data) => {
    if (customerWindow && !customerWindow.isDestroyed()) {
      customerWindow.webContents.send("order-complete", data);
    }
    return { success: true };
  });
}

function createMenu() {
  const template = [
    {
      label: "ملف",
      submenu: [{ role: "quit", label: "خروج" }],
    },
    {
      label: "عرض",
      submenu: [
        { role: "reload", label: "تحديث" },
        { role: "forceReload", label: "تحديث كامل" },
        { type: "separator" },
        { role: "resetZoom", label: "حجم عادي" },
        { role: "zoomIn", label: "تكبير" },
        { role: "zoomOut", label: "تصغير" },
        { type: "separator" },
        { role: "togglefullscreen", label: "ملء الشاشة" },
      ],
    },
    {
      label: "نافذة",
      submenu: [
        { role: "minimize", label: "تصغير" },
        { role: "close", label: "إغلاق" },
      ],
    },
    {
      label: "مساعدة",
      submenu: [
        {
          label: "حول مطعم جوستو",
          click: () => {
            const { dialog } = require("electron");
            dialog.showMessageBox({
              type: "info",
              title: "حول البرنامج",
              message: "مطعم جوستو - نظام إدارة المطعم",
              detail: "الإصدار 1.0.0\n\nنظام شامل لإدارة المطاعم\n\n© 2026 Gusto Restaurant",
            });
          },
        },
        { type: "separator" },
        { role: "toggleDevTools", label: "أدوات المطور" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Build receipt HTML from old-format data (fallback when frontend sends content instead of html)
function buildReceiptFromContent(content) {
  const logoDataUrl = logos.logoPng || logos.iconPng || "";
  const paymentLabel = content.orderType === "card" ? "Card" : "Cash";
  const dateStr = content.date || new Date().toLocaleString("ar-EG");

  const itemsHtml = (content.items || [])
    .map((item) => {
      const name = item.name || "Item";
      const qty = item.quantity || 1;
      const lineTotal = (item.price || 0).toLocaleString();
      return `<div class="item-row">
      <span class="item-name">${name}</span>
      <span class="item-dots"></span>
      <span class="item-price">${lineTotal} IQD</span>
    </div>
    <div class="item-qty">x${qty}</div>`;
    })
    .join("");

  const orderNote = content.notes || content.orderNotes;

  // Calculate final total — items sum minus discount (overrides any wrong total from frontend)
  const itemsSum = (content.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0);
  const discountAmount = Number(content.discount) || 0;
  const subtotal = itemsSum;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8">
<style>
  @page { margin: 2mm 3mm; size: 72mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI','Tahoma','Arial',sans-serif; font-size: 12px; width: 66mm; margin: 0 auto; padding: 2mm 0; color: #000; direction: rtl; -webkit-print-color-adjust: exact; }
  .header { text-align: center; padding-bottom: 8px; }
  .header img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; margin-bottom: 4px; filter: invert(1) contrast(1.5); }
  .header .stars { font-size: 14px; letter-spacing: 4px; margin: 2px 0; font-weight: bold; color: #000; }
  .header .cafe-name { font-size: 14px; font-weight: bold; margin: 2px 0; color: #000; }
  .header .cafe-name-en { font-size: 12px; font-weight: bold; color: #000; }
  .divider { border: none; border-top: 1px solid #000; margin: 6px 0; }
  .info { font-size: 11px; line-height: 1.6; padding: 2px 0; color: #000; }
  .item-row { display: flex; align-items: baseline; font-size: 12px; margin-top: 6px; }
  .item-name { flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #000; }
  .item-dots { flex: 1; border-bottom: 1px dotted #000; margin: 0 4px; min-width: 8px; position: relative; top: -3px; }
  .item-price { flex-shrink: 0; font-weight: bold; white-space: nowrap; color: #000; }
  .item-qty { font-size: 10px; color: #000; margin-bottom: 2px; }
  .order-notes-box { font-size: 11px; color: #000; font-style: italic; text-align: center; padding: 6px 8px; margin: 6px 0; border: 1px dashed #000; background: #f5f5f5; }
  .total-section { text-align: center; padding: 8px 0; }
  .total-label { font-size: 18px; font-weight: bold; color: #000; }
  .footer { text-align: center; padding-top: 4px; font-size: 12px; line-height: 1.6; color: #000; }
  .footer .thank { font-weight: bold; font-size: 13px; }
</style></head>
<body>
  <div class="header">
    ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Logo">` : ""}
    <div class="stars">***</div>
    <div class="cafe-name">مطعم جوستو</div>
    <div class="cafe-name-en">Gusto Restaurant</div>
  </div>
  <hr class="divider">
  <div class="info">
    <div>رقم الطلب: <strong>${content.orderNumber || "---"}</strong></div>
    <div>التاريخ: ${dateStr}</div>
    ${content.table ? `<div>الطاولة: ${content.table}</div>` : ""}
    <div>الدفع: ${paymentLabel}</div>
  </div>
  <hr class="divider">
  ${itemsHtml}
  <hr class="divider">
  ${
    discountAmount > 0
      ? `
  <div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;">
    <span>المجموع الفرعي</span><span>${subtotal.toLocaleString()} IQD</span>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;">
    <span>الخصم</span><span>-${discountAmount.toLocaleString()} IQD</span>
  </div><hr class="divider">`
      : ""
  }
  <div class="total-section">
    <div class="total-label">المجموع: ${finalTotal.toLocaleString()} IQD</div>
  </div>
  ${orderNote ? `<div class="order-notes-box">📝 ${orderNote}</div>` : ""}
  <hr class="divider">
  <div class="footer">
    <div class="thank">!شكراً لزيارتكم</div>
    <div>Thank You! Visit Again</div>
  </div>
</body></html>`;
}

// Setup print handlers
function setupPrintHandlers() {
  // Accept both formats: { html: '...' } (new) or { type, content } (old)
  ipcMain.handle("print-receipt", async (event, data) => {
    return new Promise((resolve) => {
      try {
        // Support both old and new frontend formats
        let html = data.html;
        if (!html && data.content) {
          html = buildReceiptFromContent(data.content);
        }
        if (!html) {
          return resolve({ success: false, error: "No print data provided" });
        }

        console.log("🖨️ Print receipt request received");

        const printWin = new BrowserWindow({
          width: 400,
          height: 900,
          show: false,
          webPreferences: { nodeIntegration: false, contextIsolation: true },
        });

        printWin.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

        printWin.webContents.on("did-finish-load", () => {
          printWin.webContents
            .getPrintersAsync()
            .then((printers) => {
              console.log("🖨️ Available printers:", printers.map((p) => p.name).join(", "));

              // Auto-detect POS/thermal printer
              const posPrinter = printers.find((p) => /pos|thermal|receipt|stmicro|80mm|58mm/i.test(p.name)) || printers.find((p) => /usb/i.test(p.name));

              const printerName = posPrinter ? posPrinter.name : undefined;
              console.log("🖨️ Using printer:", printerName || "system default");

              printWin.webContents.print(
                {
                  silent: true,
                  printBackground: true,
                  deviceName: printerName || "",
                  margins: { marginType: "custom", top: 0, bottom: 0, left: 0, right: 0 },
                  pageSize: { width: 72000, height: 200000 },
                },
                (success, errorType) => {
                  printWin.close();
                  if (success) {
                    console.log("✅ Receipt printed successfully");
                    resolve({ success: true, printer: printerName || "default" });
                  } else {
                    console.error("❌ Print failed:", errorType);
                    resolve({ success: false, error: errorType || "Print failed" });
                  }
                },
              );
            })
            .catch((err) => {
              printWin.close();
              console.error("❌ Error getting printers:", err);
              resolve({ success: false, error: err.message });
            });
        });
      } catch (error) {
        console.error("❌ Print error:", error);
        resolve({ success: false, error: error.message || "Printer error" });
      }
    });
  });

  // Get list of printers
  ipcMain.handle("get-printers", async () => {
    try {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) return [];

      const printers = await win.webContents.getPrintersAsync();
      return printers.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        status: p.status,
        isDefault: p.isDefault,
      }));
    } catch (error) {
      console.error("Error getting printers:", error);
      return [];
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  console.log("🚀 Starting Gusto Restaurant Electron App...");
  console.log("📡 Frontend URL:", FRONTEND_URL);
  console.log("🔧 Dev Mode:", isDev);

  setupCustomerDisplayHandlers();
  setupPrintHandlers();
  createWindow();
  createCustomerWindow();

  app.on("activate", () => {
    // macOS: recreate window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      createCustomerWindow();
    }
  });
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // macOS: apps stay active until Cmd+Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

console.log("🍽️  Gusto Restaurant Management System");
console.log("📦 Electron App Starting...");
