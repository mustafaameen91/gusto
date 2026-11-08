// Print service: one order → every enabled printer at the same time.
//   receipt printers (cashier): full receipt with prices; opens the drawer for cash sales
//   ticket printers (kitchen, grill): order ticket, optionally only some categories
const config = require("./config");
const templates = require("./templates");
const escpos = require("./escpos");
const transport = require("./transport");
const { htmlToBitmap } = require("./render");

const dots = (p) => escpos.PAPER_DOTS[p.paper] || 576;

async function rasterFor(html, printer) {
  const bmp = await htmlToBitmap(html, dots(printer));
  return escpos.rasterFromBitmap(bmp.pixels, bmp.width, bmp.height, { paperDots: dots(printer) });
}

/** Items of the order this printer should make (empty category list = all of them) */
const itemsFor = (printer, items) => (printer.categories?.length ? items.filter((i) => printer.categories.includes(Number(i.categoryId))) : items);

/**
 * @param order { orderNumber, createdAt, table, saleType, orderType, cashierName, customerName,
 *               customerPhone, notes, subtotal, discount, total,
 *               items: [{ name, size, quantity, unitPrice, lineTotal, notes, categoryId }] }
 * @param opts  { onlyRoles: ['receipt'] } / { onlyIds: ['kitchen'] } to print on some printers only (reprints)
 * @returns [{ id, name, status: 'printed'|'skipped'|'failed', error? , drawer? }]
 */
async function printOrder(order, { onlyRoles, onlyIds } = {}) {
  const { printers } = config.load();
  const isCashSale = order.saleType !== "credit" && order.orderType !== "card";
  const jobs = printers
    .filter((p) => p.enabled && (!onlyRoles || onlyRoles.includes(p.role)) && (!onlyIds || onlyIds.includes(p.id)))
    .map(async (p) => {
      try {
        if (p.connection === "network" && !p.host) throw new Error("لم يُضبط عنوان IP لهذه الطابعة");
        if (p.connection === "usb" && !p.systemName) throw new Error("لم تُختر طابعة USB");
        let html;
        let openDrawer = false;
        if (p.role === "receipt") {
          html = templates.receipt(order, { width: dots(p) });
          openDrawer = p.openDrawer && isCashSale && !order.reprint;
        } else {
          const items = itemsFor(p, order.items || []);
          if (!items.length) return { id: p.id, name: p.name, status: "skipped" };
          html = templates.ticket(order, p, items, { width: dots(p) });
        }
        const raster = await rasterFor(html, p);
        await transport.send(p, escpos.buildJob({ raster, openDrawer, drawerPin: p.drawerPin, copies: p.copies }));
        return { id: p.id, name: p.name, status: "printed", drawer: openDrawer };
      } catch (e) {
        console.error(`🖨️ ${p.name}:`, e.message);
        return { id: p.id, name: p.name, status: "failed", error: e.message };
      }
    });
  return Promise.all(jobs);
}

/** Print any ready-made HTML (older screens) on the receipt printer */
async function printHtmlOnReceiptPrinter(html) {
  const p = config.load().printers.find((x) => x.enabled && x.role === "receipt");
  if (!p) return { success: false, error: "لا توجد طابعة كاشير مفعّلة" };
  try {
    // Older HTML is laid out in mm for a driver (72 mm ≈ 272 css px); scale it to the printer's dots
    const zoom = (dots(p) / 272).toFixed(3);
    const sized = html.includes("</head>") ? html.replace("</head>", `<style>html{zoom:${zoom}}</style></head>`) : `<style>html{zoom:${zoom}}</style>${html}`;
    await transport.send(p, escpos.buildJob({ raster: await rasterFor(sized, p) }));
    return { success: true, printer: p.name };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function testPrinter(printer) {
  const raster = await rasterFor(templates.testPage(printer, { width: dots(printer) }), printer);
  await transport.send(printer, escpos.buildJob({ raster }));
}

async function openDrawer(printer) {
  const p = printer || config.load().printers.find((x) => x.enabled && x.openDrawer);
  if (!p) throw new Error("لا توجد طابعة موصول بها درج النقود");
  await transport.send(p, escpos.drawerJob(p.drawerPin));
}

/**
 * Check every enabled printer without printing.
 * @param systemPrinters names of printers installed in the OS (for USB printers)
 */
async function checkPrinters(systemPrinters = []) {
  const { printers } = config.load();
  return Promise.all(
    printers.map(async (p) => {
      if (!p.enabled) return { id: p.id, name: p.name, ok: null, detail: "غير مفعّلة" };
      if (p.connection === "usb") {
        const found = systemPrinters.includes(p.systemName);
        return { id: p.id, name: p.name, ok: found, detail: found ? `USB: ${p.systemName}` : p.systemName ? `الطابعة "${p.systemName}" غير مثبتة على هذا الجهاز` : "لم تُختر طابعة USB" };
      }
      const r = await transport.probeNetwork(p.host, p.port);
      return { id: p.id, name: p.name, ok: r.ok, detail: r.ok ? `${p.host}:${p.port} (${r.ms} ms)` : r.error };
    }),
  );
}

/** A sample order on every printer at once, to test the whole setup (never opens the drawer) */
function printSampleOrder(categories = []) {
  const cat = (name) => categories.find((c) => c.categoryName === name)?.idCategory ?? null;
  return printOrder({
    orderNumber: "تجربة",
    createdAt: new Date().toISOString(),
    table: "1",
    orderType: "cashier",
    saleType: "cash",
    cashierName: "طلب تجريبي",
    notes: "هذا طلب تجريبي — لا تحضّره",
    subtotal: 27000,
    discount: 0,
    total: 27000,
    reprint: true, // no drawer for a test
    items: [
      { name: "كباب (تجربة)", quantity: 2, unitPrice: 8000, lineTotal: 16000, notes: "بدون بصل", categoryId: cat("مشويات") },
      { name: "حمص (تجربة)", quantity: 1, unitPrice: 4000, lineTotal: 4000, categoryId: cat("مقبلات") },
      { name: "فتوش (تجربة)", quantity: 1, unitPrice: 5000, lineTotal: 5000, categoryId: cat("سلطات") },
      { name: "عصير (تجربة)", quantity: 1, unitPrice: 2000, lineTotal: 2000, categoryId: cat("مشروبات") },
    ],
  });
}

module.exports = { printOrder, printHtmlOnReceiptPrinter, testPrinter, openDrawer, itemsFor, checkPrinters, printSampleOrder };
