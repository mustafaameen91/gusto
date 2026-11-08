// Receipt (cashier, with prices) and order ticket (kitchen / grill, no prices) as HTML.
// Rendered at the printer's exact width (576 px = 72 mm at 8 dots/mm) and printed as an image.
const path = require("path");
const { pathToFileURL } = require("url");

const asset = (...p) => pathToFileURL(path.join(__dirname, "..", "assets", ...p)).href;

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString("en-US")} د.ع`;
const pad = (n) => String(n).padStart(2, "0");
const when = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
// Placeholder notes the POS used to send by default
const realNote = (n) => n && !["لاتوجد", "لا توجد", "بدون ملاحظات"].includes(String(n).trim());

const page = (width, body) => `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>
@font-face { font-family: Tajawal; font-weight: 700; src: url("${asset("fonts", "Tajawal-Bold.ttf")}"); }
@font-face { font-family: Tajawal; font-weight: 500; src: url("${asset("fonts", "Tajawal-Medium.ttf")}"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: #fff; }
body { width: ${width}px; padding: 8px 14px 4px; font-family: Tajawal, Tahoma, Arial, sans-serif; font-weight: 700; color: #000; font-size: 24px; line-height: 1.35; direction: rtl; }
.center { text-align: center; }
.rule { border-top: 3px solid #000; margin: 10px 0; }
.rule-dash { border-top: 3px dashed #000; margin: 10px 0; }
.row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.muted { font-weight: 500; }
.ltr { direction: ltr; unicode-bidi: isolate; display: inline-block; }
</style></head><body>${body}</body></html>`;

/** Customer receipt for the cashier printer */
function receipt(order, { width = 576 } = {}) {
  const pay = order.saleType === "credit" ? "آجل" : order.orderType === "card" ? "بطاقة" : "نقدي";
  const items = (order.items || [])
    .map(
      (i) => `
    <div class="item">
      <div class="row"><span class="name">${esc(i.name)}${i.size ? ` <span class="muted">(${esc(i.size)})</span>` : ""}</span><span class="ltr">${money(i.lineTotal)}</span></div>
      <div class="muted small"><span class="ltr">${Number(i.quantity)} × ${money(i.unitPrice)}</span></div>
      ${realNote(i.notes) ? `<div class="note">ملاحظة: ${esc(i.notes)}</div>` : ""}
    </div>`,
    )
    .join("");
  const discount = Number(order.discount) || 0;
  return page(
    width,
    `<style>
      .logo { width: 260px; max-height: 150px; object-fit: contain; filter: grayscale(1) contrast(1.6); }
      .title { font-size: 34px; margin-top: 4px; } .sub { font-size: 22px; }
      .info { font-size: 23px; } .order-no { font-size: 40px; }
      .item { margin: 8px 0; } .name { font-size: 25px; } .small { font-size: 21px; }
      .note { font-size: 21px; border-right: 4px solid #000; padding-right: 8px; margin-top: 2px; }
      .total { font-size: 38px; margin: 6px 0; } .thanks { font-size: 26px; }
      .box { border: 3px dashed #000; padding: 6px 10px; margin: 8px 0; font-size: 22px; }
    </style>
    <div class="center">
      <img class="logo" src="${asset("logo.png")}" alt="">
      <div class="title">مطعم جوستو</div>
      <div class="sub muted">Gusto Restaurant</div>
    </div>
    <div class="rule"></div>
    <div class="row"><span>رقم الطلب</span><span class="order-no ltr">#${esc(order.orderNumber)}</span></div>
    <div class="info">
      <div class="row"><span>التاريخ</span><span class="ltr">${when(order.createdAt)}</span></div>
      ${order.table ? `<div class="row"><span>الطاولة</span><span>${esc(order.table)}</span></div>` : ""}
      <div class="row"><span>الدفع</span><span>${pay}</span></div>
      ${order.cashierName ? `<div class="row"><span>الكاشير</span><span>${esc(order.cashierName)}</span></div>` : ""}
    </div>
    <div class="rule"></div>
    ${items}
    <div class="rule"></div>
    ${
      discount > 0
        ? `<div class="row info"><span>المجموع الفرعي</span><span class="ltr">${money(order.subtotal)}</span></div>
           <div class="row info"><span>الخصم</span><span class="ltr">-${money(discount)}</span></div>
           <div class="rule-dash"></div>`
        : ""
    }
    <div class="row total"><span>الإجمالي</span><span class="ltr">${money(order.total)}</span></div>
    ${order.customerName ? `<div class="center info">${esc(order.customerName)}${order.customerPhone ? ` — <span class="ltr">${esc(order.customerPhone)}</span>` : ""}</div>` : ""}
    ${realNote(order.notes) ? `<div class="box">ملاحظات: ${esc(order.notes)}</div>` : ""}
    <div class="rule"></div>
    <div class="center thanks">شكراً لزيارتكم!</div>
    <div class="center muted info">نتمنى رؤيتكم مجدداً</div>`,
  );
}

/** Order ticket for a preparation station (kitchen, grill): large, no prices */
function ticket(order, station, items, { width = 576 } = {}) {
  const lines = items
    .map(
      (i) => `
    <div class="line">
      <span class="qty ltr">${Number(i.quantity)}×</span>
      <div class="what">
        <div class="name">${esc(i.name)}${i.size ? ` <span class="size">(${esc(i.size)})</span>` : ""}</div>
        ${realNote(i.notes) ? `<div class="note">← ${esc(i.notes)}</div>` : ""}
      </div>
    </div>`,
    )
    .join("");
  return page(
    width,
    `<style>
      .station { background: #000; color: #fff; text-align: center; font-size: 36px; padding: 6px 0; border-radius: 8px; }
      .order-no { font-size: 64px; text-align: center; line-height: 1.1; margin-top: 6px; }
      .meta { font-size: 25px; }
      .table { font-size: 34px; text-align: center; border: 3px solid #000; border-radius: 8px; padding: 2px 0; margin: 6px 0; }
      .line { display: flex; gap: 12px; align-items: flex-start; margin: 10px 0; }
      .qty { font-size: 40px; min-width: 70px; text-align: center; border: 3px solid #000; border-radius: 8px; line-height: 1.2; }
      .what { flex: 1; } .name { font-size: 34px; line-height: 1.25; } .size { font-size: 28px; }
      .note { font-size: 27px; margin-top: 2px; }
      .box { border: 3px dashed #000; padding: 6px 10px; margin: 8px 0; font-size: 28px; }
      .count { font-size: 23px; text-align: center; }
    </style>
    <div class="station">${esc(station.name)}</div>
    <div class="order-no ltr" style="display:block">#${esc(order.orderNumber)}</div>
    <div class="row meta"><span class="ltr">${when(order.createdAt)}</span><span>${order.cashierName ? esc(order.cashierName) : ""}</span></div>
    ${order.table ? `<div class="table">طاولة ${esc(order.table)}</div>` : `<div class="table">سفري / بدون طاولة</div>`}
    <div class="rule"></div>
    ${lines}
    ${realNote(order.notes) ? `<div class="box">ملاحظات الطلب: ${esc(order.notes)}</div>` : ""}
    <div class="rule"></div>
    <div class="count muted">عدد القطع: ${items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)}</div>`,
  );
}

/** Test page for one printer */
function testPage(station, { width = 576 } = {}) {
  return page(
    width,
    `<div class="center" style="font-size:36px">طباعة تجريبية</div>
     <div class="center" style="font-size:30px;margin:6px 0">${esc(station.name)}</div>
     <div class="rule"></div>
     <div class="row"><span>الاتصال</span><span>${station.connection === "usb" ? "USB" : "شبكة"}</span></div>
     <div class="row"><span>العنوان</span><span class="ltr">${esc(station.connection === "usb" ? station.systemName : `${station.host}:${station.port}`)}</span></div>
     <div class="row"><span>الوقت</span><span class="ltr">${when()}</span></div>
     <div class="rule"></div>
     <div class="center" style="font-size:26px">إذا ظهرت هذه الحروف العربية متصلة وواضحة<br>فالطابعة تعمل بشكل صحيح ✓</div>
     <div class="center ltr" style="display:block;font-size:22px;margin-top:6px">Gusto Restaurant · 0123456789</div>`,
  );
}

module.exports = { receipt, ticket, testPage };
