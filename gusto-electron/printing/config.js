// Settings saved on this POS machine (server address and printers), in the app's user-data folder.
// Windows: %APPDATA%\Gusto Restaurant\gusto-settings.json
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const DEFAULT_PRINTERS = [
  {
    id: "cashier",
    name: "الكاشير",
    enabled: true,
    role: "receipt", // customer receipt with prices
    connection: "network", // 'network' | 'usb'
    host: "",
    port: 9100,
    systemName: "",
    paper: 80,
    copies: 1,
    openDrawer: true, // drawer is plugged into this printer
    drawerPin: 0,
    categories: [], // receipts always carry the whole order
  },
  {
    id: "kitchen",
    name: "المطبخ",
    enabled: true,
    role: "ticket", // order ticket without prices
    connection: "network",
    host: "",
    port: 9100,
    systemName: "",
    paper: 80,
    copies: 1,
    openDrawer: false,
    drawerPin: 0,
    categories: [], // empty = every item of the order
  },
  {
    id: "grill",
    name: "الشواية",
    enabled: true,
    role: "ticket",
    connection: "network",
    host: "",
    port: 9100,
    systemName: "",
    paper: 80,
    copies: 1,
    openDrawer: false,
    drawerPin: 0,
    categories: [],
  },
];

// The restaurant's server; can be changed per POS in "إعدادات الطابعات والخادم"
const DEFAULT_SERVER_URL = "https://gusto.codility.tech";
const DEFAULTS = { serverUrl: DEFAULT_SERVER_URL, printers: DEFAULT_PRINTERS };

const file = () => path.join(app.getPath("userData"), "gusto-settings.json");

function load() {
  try {
    const saved = JSON.parse(fs.readFileSync(file(), "utf8"));
    const printers = DEFAULT_PRINTERS.map((d) => ({ ...d, ...(saved.printers || []).find((p) => p.id === d.id) }));
    return { ...DEFAULTS, ...saved, printers };
  } catch (_) {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

function save(settings) {
  const clean = {
    serverUrl: String(settings.serverUrl || "").trim().replace(/\/+$/, ""),
    printers: DEFAULT_PRINTERS.map((d) => {
      const p = (settings.printers || []).find((x) => x.id === d.id) || {};
      return {
        ...d,
        name: String(p.name || d.name).trim(),
        enabled: !!p.enabled,
        role: p.role === "receipt" ? "receipt" : "ticket",
        connection: p.connection === "usb" ? "usb" : "network",
        host: String(p.host || "").trim(),
        port: Number(p.port) || 9100,
        systemName: String(p.systemName || ""),
        paper: Number(p.paper) === 58 ? 58 : 80,
        copies: Math.min(3, Math.max(1, Number(p.copies) || 1)),
        openDrawer: !!p.openDrawer,
        drawerPin: Number(p.drawerPin) === 1 ? 1 : 0,
        categories: Array.isArray(p.categories) ? p.categories.map(Number).filter(Boolean) : [],
      };
    }),
  };
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(clean, null, 2));
  return clean;
}

module.exports = { load, save, file };
