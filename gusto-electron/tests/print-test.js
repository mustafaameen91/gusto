// Printing test without hardware: three fake network printers on this machine record what they
// receive; the ESC/POS bytes are decoded back to images so the printouts can be looked at.
// Run: npx electron tests/print-test.js [outputDir]
const { app, nativeImage } = require("electron");
const net = require("net");
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = process.argv.find((a, i) => i > 1 && !a.startsWith("-") && !a.endsWith(".js")) || path.join(os.tmpdir(), "gusto-print-test");
fs.mkdirSync(OUT, { recursive: true });
app.setPath("userData", fs.mkdtempSync(path.join(os.tmpdir(), "gusto-print-userdata-")));
app.disableHardwareAcceleration();
app.on("window-all-closed", () => {}); // the hidden render windows are the only windows here

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

// ---- fake printers ----
function fakePrinter(port) {
  const jobs = [];
  const server = net.createServer((sock) => {
    const chunks = [];
    sock.on("data", (d) => chunks.push(d));
    sock.on("end", () => jobs.push(Buffer.concat(chunks)));
  });
  return new Promise((r) => server.listen(port, "127.0.0.1", () => r({ port, jobs, server })));
}

// ---- ESC/POS decoder (the commands our encoder emits) ----
function decode(buf) {
  const out = { init: 0, drawer: [], cuts: 0, bands: [], unknown: [] };
  let i = 0;
  while (i < buf.length) {
    const b = buf[i];
    if (b === 0x1b && buf[i + 1] === 0x40) { out.init++; i += 2; }
    else if (b === 0x1b && buf[i + 1] === 0x70) { out.drawer.push(buf[i + 2]); i += 5; }
    else if (b === 0x1b && buf[i + 1] === 0x64) { i += 3; }
    else if (b === 0x1d && buf[i + 1] === 0x56) { out.cuts++; i += 4; }
    else if (b === 0x1d && buf[i + 1] === 0x76 && buf[i + 2] === 0x30) {
      const wb = buf[i + 4] | (buf[i + 5] << 8), h = buf[i + 6] | (buf[i + 7] << 8);
      out.bands.push({ wb, h, data: buf.subarray(i + 8, i + 8 + wb * h) });
      i += 8 + wb * h;
    } else { out.unknown.push(b); i++; }
  }
  return out;
}

// Raster bands of one copy → PNG (black dots on white)
function toPng(bands, file) {
  const wb = bands[0].wb, w = wb * 8, h = bands.reduce((s, b) => s + b.h, 0);
  const px = Buffer.alloc(w * h * 4, 255);
  let y0 = 0;
  for (const b of bands) {
    for (let y = 0; y < b.h; y++) for (let x = 0; x < w; x++) {
      if (b.data[y * wb + (x >> 3)] & (0x80 >> (x & 7))) { const k = ((y0 + y) * w + x) * 4; px[k] = px[k + 1] = px[k + 2] = 0; }
    }
    y0 += b.h;
  }
  fs.writeFileSync(file, nativeImage.createFromBitmap(px, { width: w, height: h }).toPNG());
  return { w, h };
}

const ORDER = {
  orderId: 245, orderNumber: "ORD-1794147806616", createdAt: new Date().toISOString(), table: "7", orderType: "cashier", saleType: "cash",
  cashierName: "علي الكاشير", waiterName: "حسن", notes: "الزبون مستعجل", subtotal: 47000, discount: 2000, total: 45000,
  items: [
    { name: "مشاوي مشكلة", size: "كبير", quantity: 2, unitPrice: 15000, lineTotal: 30000, notes: "بدون بصل", categoryId: 4 },
    { name: "حمص بالطحينة", quantity: 1, unitPrice: 4000, lineTotal: 4000, notes: "لاتوجد", categoryId: 1 },
    { name: "فتوش", quantity: 1, unitPrice: 5000, lineTotal: 5000, categoryId: 2 },
    { name: "كباب عراقي", quantity: 1, unitPrice: 8000, lineTotal: 8000, notes: "", categoryId: 4 },
  ],
};

app.whenReady().then(async () => {
  const config = require("../printing/config");
  const printing = require("../printing");
  const [cashier, kitchen, grill] = await Promise.all([fakePrinter(19101), fakePrinter(19102), fakePrinter(19103)]);
  const base = config.load();
  const set = (overrides) =>
    config.save({ ...base, printers: base.printers.map((p) => ({ ...p, connection: "network", host: "127.0.0.1", ...overrides[p.id] })) });

  console.log("1) Cash sale: all three print at once; grill gets only grilled items; drawer opens");
  set({ cashier: { port: 19101 }, kitchen: { port: 19102 }, grill: { port: 19103, categories: [4] } });
  let t = Date.now();
  let res = await printing.printOrder(ORDER);
  const ms = Date.now() - t;
  check("all three printed", res.every((r) => r.status === "printed"), JSON.stringify(res.map((r) => `${r.id}:${r.status}${r.error ? " " + r.error : ""}`)));
  console.log(`      (three printouts in ${ms} ms)`);
  const dc = decode(cashier.jobs[0] || Buffer.alloc(0)), dk = decode(kitchen.jobs[0] || Buffer.alloc(0)), dg = decode(grill.jobs[0] || Buffer.alloc(0));
  check("cashier: drawer kick sent (pin 2)", dc.drawer.length === 1 && dc.drawer[0] === 0);
  check("kitchen and grill: no drawer kick", dk.drawer.length === 0 && dg.drawer.length === 0);
  check("each printout reset + cut once", [dc, dk, dg].every((d) => d.init === 1 && d.cuts === 1));
  check("raster is 576 dots wide (80 mm)", [dc, dk, dg].every((d) => d.bands.length && d.bands.every((b) => b.wb === 72)));
  check("no stray bytes", [dc, dk, dg].every((d) => d.unknown.length === 0));
  const sc = toPng(dc.bands, path.join(OUT, "1-cashier-receipt.png"));
  const sk = toPng(dk.bands, path.join(OUT, "1-kitchen-ticket.png"));
  const sg = toPng(dg.bands, path.join(OUT, "1-grill-ticket.png"));
  check("grill ticket shorter than kitchen ticket (2 of 4 items)", sg.h < sk.h, `kitchen ${sk.h}px, grill ${sg.h}px, receipt ${sc.h}px`);

  console.log("2) Card sale: no drawer; order without grilled items skips the grill printer");
  cashier.jobs.length = kitchen.jobs.length = grill.jobs.length = 0;
  res = await printing.printOrder({ ...ORDER, orderType: "card", items: ORDER.items.filter((i) => i.categoryId !== 4) });
  check("grill skipped (nothing to grill)", res.find((r) => r.id === "grill").status === "skipped" && grill.jobs.length === 0);
  check("card sale: drawer stays closed", decode(cashier.jobs[0]).drawer.length === 0);

  console.log("3) Credit sale: no drawer");
  cashier.jobs.length = 0;
  await printing.printOrder({ ...ORDER, saleType: "credit" }, { onlyRoles: ["receipt"] });
  check("credit sale: drawer stays closed", decode(cashier.jobs[0]).drawer.length === 0);

  console.log("4) Kitchen printer off: the others still print, the failure is reported in Arabic");
  cashier.jobs.length = grill.jobs.length = 0;
  set({ cashier: { port: 19101 }, kitchen: { port: 19199 }, grill: { port: 19103, categories: [4] } });
  res = await printing.printOrder(ORDER);
  const k = res.find((r) => r.id === "kitchen");
  check("kitchen reported as failed", k.status === "failed" && /الطابعة/.test(k.error), k.error);
  check("cashier and grill still printed", cashier.jobs.length === 1 && grill.jobs.length === 1);

  console.log("5) Reprint on the kitchen printer only, without opening the drawer");
  set({ cashier: { port: 19101 }, kitchen: { port: 19102 }, grill: { port: 19103, categories: [4] } });
  cashier.jobs.length = kitchen.jobs.length = grill.jobs.length = 0;
  res = await printing.printOrder({ ...ORDER, reprint: true }, { onlyIds: ["kitchen"] });
  check("only the kitchen printed", res.length === 1 && kitchen.jobs.length === 1 && cashier.jobs.length === 0 && grill.jobs.length === 0);

  console.log("6) Unconfigured printer, drawer button, test page");
  set({ cashier: { port: 19101 }, kitchen: { host: "" }, grill: { enabled: false } });
  res = await printing.printOrder(ORDER);
  check("missing IP reported, disabled printer ignored", res.length === 2 && res.find((r) => r.id === "kitchen").status === "failed");
  cashier.jobs.length = 0;
  await printing.openDrawer();
  const dd = decode(cashier.jobs[0]);
  check("open-drawer button: kick only, no paper", dd.drawer.length === 1 && dd.bands.length === 0 && dd.cuts === 0);
  cashier.jobs.length = 0;
  await printing.testPrinter({ ...config.load().printers[0] });
  toPng(decode(cashier.jobs[0]).bands, path.join(OUT, "6-test-page.png"));
  check("test page printed", decode(cashier.jobs[0]).bands.length > 0);

  console.log("7) Menu: connection check (prints nothing) and a test order on all printers");
  set({ cashier: { port: 19101 }, kitchen: { port: 19199 }, grill: { port: 19103, categories: [4] } });
  cashier.jobs.length = kitchen.jobs.length = grill.jobs.length = 0;
  const chk = await printing.checkPrinters([]);
  check("check: cashier and grill reachable, kitchen not", chk.find((r) => r.id === "cashier").ok && chk.find((r) => r.id === "grill").ok && chk.find((r) => r.id === "kitchen").ok === false, JSON.stringify(chk.map((r) => `${r.id}:${r.ok}`)));
  await new Promise((r) => setTimeout(r, 200));
  check("check printed nothing", cashier.jobs.every((j) => j.length === 0) && grill.jobs.every((j) => j.length === 0));
  set({ cashier: { port: 19101 }, kitchen: { port: 19102 }, grill: { port: 19103, categories: [4] } });
  cashier.jobs.length = kitchen.jobs.length = grill.jobs.length = 0;
  res = await printing.printSampleOrder([{ idCategory: 4, categoryName: "مشويات" }, { idCategory: 1, categoryName: "مقبلات" }]);
  check("test order printed on all three", res.every((r) => r.status === "printed") && cashier.jobs.length === 1 && kitchen.jobs.length === 1 && grill.jobs.length === 1);
  check("test order never opens the drawer", decode(cashier.jobs[0]).drawer.length === 0);
  toPng(decode(grill.jobs[0]).bands, path.join(OUT, "7-sample-grill.png"));

  [cashier, kitchen, grill].forEach((p) => p.server.close());
  console.log(failures ? `\n${failures} check(s) failed` : "\nall printing checks passed");
  console.log("images:", OUT);
  app.exit(failures ? 1 : 0);
});
