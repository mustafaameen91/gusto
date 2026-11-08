// Screenshots of the app's own windows (first-run page, printer settings) with throw-away settings.
// Run: npx electron tests/ui-shot.js <outDir> [serverUrl]
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");

const [outDir, serverUrl] = process.argv.slice(2).filter((a) => !a.endsWith(".js") && !a.startsWith("-"));
fs.mkdirSync(outDir, { recursive: true });
const userData = fs.mkdtempSync(path.join(os.tmpdir(), "gusto-ui-"));
app.setPath("userData", userData);
if (serverUrl) fs.writeFileSync(path.join(userData, "gusto-settings.json"), JSON.stringify({ serverUrl }));

require("../main.js");

app.whenReady().then(async () => {
  await new Promise((r) => setTimeout(r, 2500));
  if (serverUrl) ipcMain.emit("open-printer-settings", {});
  await new Promise((r) => setTimeout(r, 3500));
  for (const w of BrowserWindow.getAllWindows()) {
    const title = w.webContents.getURL().split("/").pop().split("?")[0] || "window";
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(outDir, `${serverUrl ? "configured" : "first-run"}-${title}.png`), img.toPNG());
  }
  app.exit(0);
});
