const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const settingsStore = require("./printing/config");
const printing = require("./printing");

// Performance: disable GPU on old hardware to prevent crashes, use software rendering
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-software-rasterizer");

const isDev = process.argv.includes("--dev");
// The server address is set on each POS from "إعدادات الخادم والطابعات" (saved on the machine),
// default https://gusto.codility.tech. GUSTO_URL overrides it; --dev always uses the local dev server.
const frontendUrl = () => process.env.GUSTO_URL || (isDev ? "http://localhost:8081" : settingsStore.load().serverUrl || "");

let mainWindow;
let customerWindow;
let settingsWindow;

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

  loadApp();

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

// Load the restaurant system, or the connection page when it can't be reached / isn't set yet
function loadApp() {
  const url = frontendUrl();
  if (!url) {
    mainWindow.loadFile(path.join(__dirname, "error.html"), { query: { url: "" } });
    openSettingsWindow();
    return;
  }
  mainWindow
    .loadURL(url)
    .then(() => {
      console.log("✅ Loaded frontend URL:", url);
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
      mainWindow.loadFile(path.join(__dirname, "error.html"), { query: { url } });
    });
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) return settingsWindow.focus();
  settingsWindow = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 760,
    minHeight: 600,
    title: "إعدادات الطابعات والخادم",
    icon: path.join(__dirname, "assets", "icon.png"),
    parent: mainWindow || undefined,
    backgroundColor: "#f5f2ed",
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, "preload-settings.js") },
  });
  settingsWindow.loadFile(path.join(__dirname, "printer-settings.html"));
  settingsWindow.on("closed", () => (settingsWindow = null));
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

// ---- "الطابعات" / "الخادم" menu actions: test everything on the POS itself ----
const showResult = (title, message, detail, ok = true) =>
  dialog.showMessageBox(mainWindow || undefined, { type: ok ? "info" : "error", title, message, detail, buttons: ["حسناً"] });

const systemPrinterNames = async () => {
  const wc = (mainWindow || settingsWindow)?.webContents;
  try {
    return wc ? (await wc.getPrintersAsync()).map((p) => p.name) : [];
  } catch (_) {
    return [];
  }
};

async function serverGet(pathName, timeoutMs = 6000) {
  const base = frontendUrl();
  if (!base) throw new Error("لم يُضبط عنوان الخادم في الإعدادات");
  const res = await fetch(base.replace(/\/+$/, "") + pathName, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`الخادم أجاب بالرمز ${res.status}`);
  return res.json();
}

const statusLine = (r) => `${r.status === "printed" ? "✓" : r.status === "skipped" ? "–" : "✗"} ${r.name}: ${r.status === "printed" ? "طُبعت" : r.status === "skipped" ? "لا أصناف لها في هذا الطلب" : r.error}`;

async function menuCheckPrinters() {
  const results = await printing.checkPrinters(await systemPrinterNames());
  const lines = results.map((r) => `${r.ok === null ? "–" : r.ok ? "✓" : "✗"} ${r.name}: ${r.ok === null ? r.detail : r.ok ? "متصلة — " + r.detail : r.detail}`);
  const bad = results.filter((r) => r.ok === false).length;
  showResult("فحص الطابعات", bad ? `${bad} طابعة غير متصلة` : "كل الطابعات المفعّلة متصلة", lines.join("\n") + "\n\n(فحص الاتصال لا يطبع شيئاً)", !bad);
}

async function menuSampleOrder() {
  let categories = [];
  try {
    categories = await serverGet("/api/categories", 4000);
  } catch (_) {}
  const results = await printing.printSampleOrder(Array.isArray(categories) ? categories : []);
  const bad = results.filter((r) => r.status === "failed").length;
  showResult(
    "طلب تجريبي",
    results.length ? (bad ? `فشلت ${bad} طابعة` : "أُرسل الطلب التجريبي إلى كل الطابعات في نفس الوقت") : "لا توجد طابعات مفعّلة",
    results.map(statusLine).join("\n") + "\n\nتأكد أن الأوراق خرجت فعلاً من كل طابعة. الدرج لا يُفتح في التجربة.",
    !bad && results.length > 0,
  );
}

async function menuTestPage(printer) {
  try {
    await printing.testPrinter(printer);
    showResult("طباعة تجريبية", `أُرسلت صفحة تجريبية إلى «${printer.name}»`, "تأكد أنها خرجت من الطابعة وأن الحروف العربية واضحة ومتصلة.");
  } catch (e) {
    showResult("طباعة تجريبية", `لم تُطبع على «${printer.name}»`, e.message, false);
  }
}

async function menuOpenDrawer() {
  try {
    await printing.openDrawer();
  } catch (e) {
    showResult("درج النقود", "تعذّر فتح الدرج", e.message, false);
  }
}

async function menuCheckServer() {
  const url = frontendUrl();
  const t = Date.now();
  try {
    await serverGet("/api/health");
    showResult("فحص الخادم", "الخادم يعمل ✓", `${url}\nزمن الاستجابة: ${Date.now() - t} ms`);
  } catch (e) {
    showResult("فحص الخادم", "تعذّر الوصول إلى الخادم", `${url || "(لا يوجد عنوان)"}\n${e.name === "TimeoutError" ? "الخادم لا يرد" : e.message}`, false);
  }
}

function createMenu() {
  const { printers } = settingsStore.load();
  const enabled = printers.filter((p) => p.enabled);
  const template = [
    {
      label: "ملف",
      submenu: [
        { label: "إعدادات الطابعات والخادم", accelerator: "CmdOrCtrl+,", click: () => openSettingsWindow() },
        { type: "separator" },
        { role: "quit", label: "خروج" },
      ],
    },
    {
      label: "الطابعات",
      submenu: [
        { label: "فحص اتصال كل الطابعات", click: () => menuCheckPrinters() },
        { label: "طلب تجريبي على كل الطابعات معاً", click: () => menuSampleOrder() },
        { type: "separator" },
        ...(enabled.length
          ? enabled.map((p) => ({ label: `صفحة تجريبية — ${p.name}`, click: () => menuTestPage(p) }))
          : [{ label: "لا توجد طابعات مفعّلة", enabled: false }]),
        { type: "separator" },
        { label: "فتح درج النقود", accelerator: "CmdOrCtrl+D", click: () => menuOpenDrawer() },
        { type: "separator" },
        { label: "إعدادات الطابعات…", click: () => openSettingsWindow() },
      ],
    },
    {
      label: "الخادم",
      submenu: [
        { label: "فحص الاتصال بالخادم", click: () => menuCheckServer() },
        { label: "إعادة تحميل النظام", accelerator: "F5", click: () => mainWindow && loadApp() },
        { type: "separator" },
        { label: "تغيير عنوان الخادم…", click: () => openSettingsWindow() },
      ],
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

// Old-format data { content: {...} } → order shape for the receipt template
function orderFromContent(c) {
  const items = (c.items || []).map((i) => {
    const quantity = Number(i.quantity) || 1;
    const lineTotal = Number(i.price) || 0;
    return { name: i.name, quantity, unitPrice: lineTotal / quantity, lineTotal, notes: i.notes };
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const discount = Number(c.discount) || 0;
  return { orderNumber: c.orderNumber, table: c.table, orderType: c.orderType, saleType: c.saleType, notes: c.notes || c.orderNotes, items, subtotal, discount, total: c.total ?? Math.max(0, subtotal - discount) };
}

function setupPrintHandlers() {
  // New: one order → cashier receipt + kitchen/grill tickets at the same time
  ipcMain.handle("print-order", async (_event, order, opts) => {
    try {
      // A reprint never opens the drawer again
      const results = await printing.printOrder(opts?.onlyIds ? { ...order, reprint: true } : order, opts || {});
      return { success: results.every((r) => r.status !== "failed"), results };
    } catch (e) {
      console.error("❌ print-order:", e);
      return { success: false, results: [], error: e.message };
    }
  });

  ipcMain.handle("open-drawer", async () => {
    try {
      await printing.openDrawer();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // Older screens: { html } or { content } → the cashier (receipt) printer
  ipcMain.handle("print-receipt", async (_event, data) => {
    if (data?.html) return printing.printHtmlOnReceiptPrinter(data.html);
    if (data?.content) {
      const results = await printing.printOrder(orderFromContent(data.content), { onlyRoles: ["receipt"] });
      const r = results[0];
      return r && r.status === "printed" ? { success: true, printer: r.name } : { success: false, error: r?.error || "لا توجد طابعة" };
    }
    return { success: false, error: "No print data provided" };
  });

  ipcMain.handle("get-printers", async () => {
    const s = settingsStore.load();
    return s.printers.map((p) => ({ id: p.id, name: p.name, enabled: p.enabled, role: p.role, connection: p.connection }));
  });

  ipcMain.on("open-printer-settings", () => openSettingsWindow());
  ipcMain.on("retry-connection", () => mainWindow && loadApp());

  // ----- settings window -----
  ipcMain.handle("settings:load", () => settingsStore.load());
  ipcMain.handle("settings:save", (_e, s) => {
    try {
      const before = frontendUrl();
      settingsStore.save(s);
      createMenu();
      const reloaded = !!mainWindow && frontendUrl() !== before;
      if (reloaded) loadApp();
      return { success: true, reloaded };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.handle("settings:system-printers", async () => {
    const wc = (settingsWindow || mainWindow)?.webContents;
    if (!wc) return [];
    try {
      return (await wc.getPrintersAsync()).map((p) => ({ name: p.name, isDefault: p.isDefault }));
    } catch (_) {
      return [];
    }
  });
  const apiFetch = async (base, pathName) => {
    const url = String(base || "").trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(url)) throw new Error("العنوان يجب أن يبدأ بـ http:// أو https://");
    const res = await fetch(url + pathName, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`الخادم أجاب بالرمز ${res.status}`);
    return res.json();
  };
  ipcMain.handle("settings:check-server", async (_e, base) => {
    try {
      await apiFetch(base, "/api/health");
      return { success: true };
    } catch (e) {
      return { success: false, error: e.name === "TimeoutError" ? "الخادم لا يرد" : e.cause?.code === "ENOTFOUND" ? "العنوان غير موجود" : e.message };
    }
  });
  ipcMain.handle("settings:categories", async (_e, base) => {
    try {
      const data = await apiFetch(base, "/api/categories");
      return { success: true, data: (Array.isArray(data) ? data : []).filter((c) => c.isActive !== 0 && c.isActive !== false) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.handle("settings:test-printer", async (_e, p) => {
    try {
      await printing.testPrinter(p);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.handle("settings:open-drawer", async (_e, p) => {
    try {
      await printing.openDrawer(p);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.handle("settings:close", () => settingsWindow?.close());
}

// App lifecycle
app.whenReady().then(() => {
  console.log("🚀 Starting Gusto Restaurant Electron App...");
  console.log("📡 Frontend URL:", frontendUrl() || "(not set — opening settings)");
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
