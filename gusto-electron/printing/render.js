// Render receipt HTML to a bitmap in a hidden off-screen window (no size limit from the screen,
// same result on every machine), then hand back raw pixels for the ESC/POS raster encoder.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { BrowserWindow } = require("electron");

async function htmlToBitmap(html, width = 576) {
  const tmp = path.join(os.tmpdir(), `gusto-receipt-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, html, "utf8");
  const win = new BrowserWindow({
    show: false,
    width,
    height: 1000,
    useContentSize: true,
    webPreferences: { offscreen: true, javascript: true, nodeIntegration: false, contextIsolation: true },
  });
  try {
    win.webContents.setZoomFactor(1);
    await win.loadFile(tmp);
    // Wait for the fonts and the logo before measuring
    const height = await win.webContents.executeJavaScript(`
      Promise.all([
        document.fonts.ready,
        ...Array.from(document.images).map((i) => i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; })),
      ]).then(() => Math.ceil(document.documentElement.scrollHeight))
    `);
    const h = Math.max(50, Math.min(height, 20000));
    win.setContentSize(width, h);
    await new Promise((r) => setTimeout(r, 120)); // let the resized frame paint
    let image = await win.webContents.capturePage({ x: 0, y: 0, width, height: h });
    // HiDPI screens capture at 2×; the printer needs exactly `width` dots
    if (image.getSize().width !== width) image = image.resize({ width, quality: "best" });
    const size = image.getSize();
    return { pixels: image.toBitmap(), width: size.width, height: size.height, png: () => image.toPNG() };
  } finally {
    win.destroy();
    fs.unlink(tmp, () => {});
  }
}

module.exports = { htmlToBitmap };
