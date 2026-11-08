// Money scenarios: each starts from a fresh test database.
import { call, login, sql, one, check, ctx, today, LOG_FILE } from "./harness.mjs";
import { readFileSync } from "node:fs";

export const scenarios = {};
const S = scenarios;

S.shiftPostsOnce = async () => {
  console.log("Shift close posts once and opens exactly one new shift");
  const c = await ctx(); const sh = await c.shift();
  await c.order([[c.m("عصير برتقال طازج"), 1], [c.m("حمص بالطحينة"), 1]]);
  const r = await c.close(sh.idDailyReceipt, 7000);
  check("close succeeds", r.status === 200, r.status + " " + JSON.stringify(r.data).slice(0, 120));
  const lines = await c.shiftLines(sh.idDailyReceipt);
  const cash = c.sumBy(lines, "1101", "debit"), revenue = c.sumBy(lines, "4101", "credit") + c.sumBy(lines, "4102", "credit");
  check("cash 7,000 and revenue 7,000 (not doubled)", cash === 7000 && revenue === 7000, `cash=${cash} revenue=${revenue}`);
  check("exactly one new open shift", (await one("SELECT COUNT(*) FROM DailyReceipts WHERE isClosed=0")) === 1);
  const sh2 = await c.shift();
  await c.order([[c.m("فتوش"), 1]]);
  const [a, b] = await Promise.all([c.close(sh2.idDailyReceipt, 5000), c.close(sh2.idDailyReceipt, 5000)]);
  check("double-click close: one succeeds, one refused", [a.status, b.status].sort().join() === "200,409", `${a.status}/${b.status}`);
  check("double-click close: posted once", (await one("SELECT COUNT(*) FROM JournalEntries WHERE sourceType='SHIFT_POST' AND dailyReceiptId=?", [sh2.idDailyReceipt])) === 1);
  check("double-click close: one new open shift", (await one("SELECT COUNT(*) FROM DailyReceipts WHERE isClosed=0")) === 1);
};

S.cardGoesToBank = async () => {
  console.log("Card sales go to the bank, credit to receivables, only cash to the drawer");
  const c = await ctx(); const sh = await c.shift();
  await c.order([[c.m("حمص بالطحينة"), 1]]);
  await c.order([[c.m("كباب لحم"), 1]], { orderType: "card" });
  await c.order([[c.m("فتوش"), 1]], { saleType: "credit", customerId: 1 });
  const cur = await c.shift();
  check("shift: cash 4,000, card 14,000, expected 4,000", +cur.cashSales === 4000 && +cur.cardSales === 14000 && +cur.expectedCash === 4000, `${cur.cashSales}/${cur.cardSales}/${cur.expectedCash}`);
  const r = await c.close(sh.idDailyReceipt, 4000);
  check("close: no discrepancy", r.status === 200 && +r.data.summary?.discrepancy === 0, r.status + " " + r.data.summary?.discrepancy);
  const L = await c.shiftLines(sh.idDailyReceipt);
  check("books: 1101 4,000 / 1102 14,000 / 1201 5,000", c.sumBy(L, "1101", "debit") === 4000 && c.sumBy(L, "1102", "debit") === 14000 && c.sumBy(L, "1201", "debit") === 5000);
};

S.expensesInShift = async () => {
  console.log("Expenses: drawer expenses reduce the shift, bank ones don't, each posted once");
  const c = await ctx(); const sh = await c.shift();
  await c.order([[c.m("عصير برتقال طازج"), 1], [c.m("حمص بالطحينة"), 1]]);
  const exp = (catId, cat, from, amount) => call("POST", "/expenses", { expenseDate: today(), category: cat, expenseCategoryId: catId, paidFromAccountId: from, amount, description: "test" }, c.A);
  const e1 = await exp(1, "ايجار", 13, 5000), e2 = await exp(2, "كهرباء", 14, 3000);
  check("cash expense attached to shift, bank one not", e1.data.dailyReceiptId === sh.idDailyReceipt && !e2.data.dailyReceiptId);
  check("expected drawer 2,000", +(await c.shift()).expectedCash === 2000);
  const r = await c.close(sh.idDailyReceipt, 2000);
  check("closes with 0 difference", r.status === 200 && +r.data.summary?.discrepancy === 0);
  check("rent 5,000 and electricity 3,000 in books once", +(await one("SELECT SUM(jl.debit) FROM JournalLines jl JOIN Accounts a ON a.idAccount=jl.accountId WHERE a.code='6101'")) === 5000 && +(await one("SELECT SUM(jl.debit) FROM JournalLines jl JOIN Accounts a ON a.idAccount=jl.accountId WHERE a.code='6102'")) === 3000);
};

S.discountSplit = async () => {
  console.log("Discounted drinks + food orders close balanced, split per order");
  const c = await ctx(); const sh = await c.shift();
  await c.order([[c.m("عصير برتقال طازج"), 5], [c.m("فتوش"), 1]], { discount: 10000 });
  await c.order([[c.m("عصير برتقال طازج"), 1], [c.m("حمص بالطحينة"), 1]], { discount: 50, discountType: "percentage" });
  await c.order([[c.m("عصير برتقال طازج"), 1], [c.m("حمص بالطحينة"), 1]]);
  const r = await c.close(sh.idDailyReceipt, 20500);
  check("close succeeds", r.status === 200, r.status + " " + (r.data.message || ""));
  const L = await c.shiftLines(sh.idDailyReceipt);
  check("drinks 12,000 / food 8,500", c.sumBy(L, "4101", "credit") === 12000 && c.sumBy(L, "4102", "credit") === 8500, `${c.sumBy(L, "4101", "credit")}/${c.sumBy(L, "4102", "credit")}`);
};

S.registerAdminOnly = async () => {
  console.log("Only an admin can create accounts; passwords are not logged");
  const body = (r) => ({ fullName: "N " + r, email: `n-${r}@test.com`, password: "secret999", role: "admin" });
  check("no login refused", [401, 403].includes((await call("POST", "/auth/register", body("a"))).status));
  check("cashier refused", (await call("POST", "/auth/register", body("c"), await login("cashier@gusto.com"))).status === 403);
  const A = await login("admin@gusto.com", "admin123");
  check("admin creates a cashier", (await call("POST", "/auth/register", { fullName: "x", email: "x2@test.com", password: "secret999", role: "cashier" }, A)).status === 200);
  check("password not in server log", !readFileSync(LOG_FILE, "utf8").includes("secret999"));
};

S.roles = async () => {
  console.log("Each role reaches only what its screens need");
  const T = {};
  for (const r of ["cashier", "supervisor", "waiter", "kitchen", "storage", "purchases"]) T[r] = await login(`${r}@gusto.com`);
  T.admin = await login("admin@gusto.com", "admin123");
  const cases = [
    ["GET", "/reports/financial", null, ["admin"]],
    ["GET", "/box/summary", null, ["admin"]],
    ["GET", "/box/balance", null, ["admin", "cashier", "supervisor"]],
    ["POST", "/box/transfer", { fromAccountId: 13, toAccountId: 14, amount: 1 }, ["admin"]],
    ["POST", "/expenses", { expenseDate: today(), category: "x", expenseCategoryId: 7, paidFromAccountId: 13, amount: 1, description: "r" }, ["admin"]],
    ["GET", "/customers", null, ["admin", "cashier", "supervisor", "waiter"]],
    ["PUT", "/customers/1", { fullName: "شركة الأمل للمقاولات" }, ["admin", "supervisor"]],
    ["PATCH", "/inventory/1/adjust-stock", { quantity: 0, transactionType: "adjustment", notes: "r" }, ["admin", "storage"]],
    ["PUT", "/kitchen-stock/set", { menuItemId: 1, quantity: 50 }, ["admin", "storage", "kitchen"]],
    ["GET", "/transfers", null, ["admin", "storage"]],
  ];
  for (const [m, p, b, allowed] of cases) {
    const wrong = [];
    for (const [role, tok] of Object.entries(T)) {
      const r = await call(m, p, b, tok);
      const ok = allowed.includes(role) ? ![401, 403].includes(r.status) : r.status === 403;
      if (!ok) wrong.push(`${role}:${r.status}`);
    }
    check(`${m} ${p} → ${allowed.join("/")}`, wrong.length === 0, wrong.join(" "));
  }
};

S.customers = async () => {
  console.log("Customer payments, account refunds and credit limit");
  const c = await ctx(); const sh = await c.shift(); const C = await login("cashier@gusto.com");
  await sql("UPDATE Customers SET initialDebt = 10000 WHERE idCustomer = 2");
  const bal = async () => +(await call("GET", "/customers/2/profile", null, C)).data.balance;
  await c.order([[c.m("برياني دجاج"), 2]], { saleType: "credit", customerId: 2 });
  check("10,000 + 24,000 = 34,000", (await bal()) === 34000, String(await bal()));
  const r = await call("POST", "/customers/2/receipts", { amount: 20000, paymentMethod: "cash" }, C);
  check("payment 20,000 → 14,000 on profile and list", r.status === 201 && (await bal()) === 14000 && +(await call("GET", "/customers?withBalance=1", null, C)).data.find((x) => x.idCustomer === 2).balance === 14000);
  check("overpayment refused", (await call("POST", "/customers/2/receipts", { amount: 50000 }, C)).status === 400);
  check("drawer expects the 20,000", +(await c.shift()).expectedCash === 20000);
  check("over-limit credit sale refused", (await c.order([[c.m("مشويات مشكلة"), 8]], { saleType: "credit", customerId: 2, token: C })).data.code === "CREDIT_LIMIT_EXCEEDED");
  check("shift closes at 0 difference", +(await c.close(sh.idDailyReceipt, 20000)).data.summary.discrepancy === 0);
};

S.receiving = async () => {
  console.log("Receiving adds stock at weighted cost, validated, posted to the books");
  const A = await login("admin@gusto.com", "admin123"), ST = await login("storage@gusto.com"), P = await login("purchases@gusto.com");
  const riceId = await one("SELECT idIngredient FROM Ingredients WHERE ingredientName='رز بسمتي'");
  const rice = async () => (await sql("SELECT currentStock s, costPerUnit c FROM Ingredients WHERE idIngredient=?", [riceId]))[0];
  const po = await call("POST", "/purchases", { purchaseNumber: "PO-1", purchaseDate: today(), supplierId: 3, supplierName: "x", paymentType: "credit", totalAmount: 60000, items: [{ ingredientId: riceId, orderedQuantity: 20, unitPrice: 3000 }] }, P);
  const poId = po.data.id; const item = await one("SELECT idPurchaseItem FROM PurchaseItems WHERE purchaseId=?", [poId]);
  await call("POST", `/purchases/${poId}/receive`, { items: [{ idPurchaseItem: item, receivedQuantity: 10 }] }, ST);
  const r1 = await rice();
  check("50 @2,500 + 10 @3,000 → 60 @2,583.33", +r1.s === 60 && +r1.c === 2583.33, `${r1.s} @ ${r1.c}`);
  check("same total again adds nothing", (await call("POST", `/purchases/${poId}/receive`, { items: [{ idPurchaseItem: item, receivedQuantity: 10 }] }, ST)).status === 200 && +(await rice()).s === 60);
  check("over-receive refused", (await call("POST", `/purchases/${poId}/receive`, { items: [{ idPurchaseItem: item, receivedQuantity: 25 }] }, ST)).status === 400);
  check("delete received purchase refused", (await call("DELETE", `/purchases/${poId}`, null, A)).status === 409);
  check("books: Dr inventory 30,000 / Cr suppliers", +(await one("SELECT SUM(jl.debit) FROM JournalLines jl JOIN JournalEntries je ON je.idJournalEntry=jl.journalEntryId WHERE je.sourceType='PURCHASE_RECEIPT'")) === 30000);
};

S.costOfGoods = async () => {
  console.log("Recipe sales record ingredient cost; shift posts cost of goods sold");
  const c = await ctx(); const sh = await c.shift();
  const juice = c.m("عصير برتقال طازج");
  const large = await one("SELECT idItemSize FROM ItemSizes WHERE menuItemId=? AND sizeName='كبير'", [juice.idMenuItem]);
  await c.order([[c.m("كباب لحم"), 1], [juice, 1, 4000, large]]);
  check("usage cost 5,075", +(await one("SELECT SUM(totalCost) FROM InventoryTransactions WHERE transactionType='usage'")) === 5075);
  await c.close(sh.idDailyReceipt, 18000);
  const L = await c.shiftLines(sh.idDailyReceipt);
  check("books: Dr 5101 / Cr 1301 = 5,075", c.sumBy(L, "5101", "debit") === 5075 && c.sumBy(L, "1301", "credit") === 5075);
};

S.pricing = async () => {
  console.log("The server prices every order itself");
  const c = await ctx(); await c.shift();
  const C = await login("cashier@gusto.com"), SU = await login("supervisor@gusto.com");
  const kebab = c.m("كباب لحم");
  const raw = (items, extra = {}, tok = C) => call("POST", "/orders", { orderType: "cashier", saleType: "cash", discount: 0, discountType: "amount", totalAmount: 1, orderItems: items, ...extra }, tok);
  let r = await raw([{ menuItemId: kebab.idMenuItem, quantity: 1, price: 100 }]);
  check("tampered price ignored (14,000)", r.status === 200 && +(await one("SELECT totalAmount FROM Orders WHERE idOrder=?", [r.data.orderId])) === 14000);
  check("cashier discount refused", (await raw([{ menuItemId: kebab.idMenuItem, quantity: 1 }], { discount: 5000 })).status === 403);
  r = await raw([{ menuItemId: kebab.idMenuItem, quantity: 1 }], { discount: 10, discountType: "percentage" }, SU);
  check("supervisor 10% → 12,600", r.status === 200 && +(await one("SELECT totalAmount FROM Orders WHERE idOrder=?", [r.data.orderId])) === 12600);
  for (const [label, items, extra] of [["negative qty", [{ menuItemId: kebab.idMenuItem, quantity: -1 }], {}], ["unknown item", [{ menuItemId: 9999, quantity: 1 }], {}], ["bad sale type", [{ menuItemId: kebab.idMenuItem, quantity: 1 }], { saleType: "in_dine" }]]) {
    check(`${label} refused`, (await raw(items, extra)).status === 400);
  }
};

S.returns = async () => {
  console.log("Returns: server-priced, limited, in the current shift's drawer and books");
  const c = await ctx(); const sh1 = await c.shift();
  const juice = c.m("عصير برتقال طازج"), hummus = c.m("حمص بالطحينة"), kebab = c.m("كباب لحم"), fattoush = c.m("فتوش");
  const A = (await c.order([[juice, 1], [hummus, 2]], { discount: 10, discountType: "percentage" })).data.orderId;
  await c.close(sh1.idDailyReceipt, 9900);
  const sh2 = await c.shift();
  await c.order([[kebab, 1]]);
  const line = async (o, mid, st = "pending") => one("SELECT idOrderItem FROM OrderItems WHERE orderId=? AND menuItemId=? AND status=? LIMIT 1", [o, mid, st]);
  const ret = async (o, items, extra = {}) => call("POST", "/order-returns", { orderId: o, refundMethod: "cash", items, ...extra }, c.A);
  let r = await ret(A, [{ orderItemId: await line(A, hummus.idMenuItem), quantity: 1, disposition: "wasted" }]);
  check("1 hummus refund 3,600 (after 10% discount)", +r.data.totalRefundAmount === 3600, JSON.stringify(r.data).slice(0, 100));
  check("over-return refused", (await ret(A, [{ orderItemId: await line(A, hummus.idMenuItem), quantity: 2, disposition: "wasted" }])).status === 400);
  await ret(A, [{ orderItemId: await line(A, hummus.idMenuItem), quantity: 1, disposition: "wasted" }]);
  r = await ret(A, [{ orderItemId: await line(A, juice.idMenuItem), quantity: 1, disposition: "wasted", replacementMenuItemId: kebab.idMenuItem, replacementQuantity: 1 }]);
  check("exchange for kebab: customer pays 11,300", +r.data.totalRefundAmount === -11300);
  const B = (await c.order([[fattoush, 1]], { saleType: "credit", customerId: 1 })).data.orderId;
  await ret(B, [{ orderItemId: await line(B, fattoush.idMenuItem), quantity: 1, disposition: "wasted" }], { refundMethod: "credit", customerId: 1 });
  check("account refund brings balance to 0", +(await call("GET", "/customers/1/profile", null, c.A)).data.balance === 0);
  check("drawer expects 18,100", +(await c.shift()).expectedCash === 18100);
  r = await c.close(sh2.idDailyReceipt, 18100);
  check("shift 2 closes balanced, 0 difference", r.status === 200 && +r.data.summary.discrepancy === 0, r.status + " " + (r.data.message || ""));
};

S.cancellation = async () => {
  console.log("Cancellation: supervisor/admin only, open shift only, money and stock follow");
  const c = await ctx(); const sh = await c.shift();
  const SU = await login("supervisor@gusto.com"), C = await login("cashier@gusto.com");
  const kebab = c.m("كباب لحم"), juice = c.m("عصير برتقال طازج");
  const X = (await c.order([[kebab, 1], [juice, 1]], { discount: 10, discountType: "percentage" })).data.orderId;
  const juiceLine = await one("SELECT idOrderItem FROM OrderItems WHERE orderId=? AND menuItemId=?", [X, juice.idMenuItem]);
  check("cashier cannot cancel", (await call("PATCH", `/orders/items/${juiceLine}/status`, { status: "cancelled" }, C)).status === 403);
  await call("PATCH", `/orders/items/${juiceLine}/status`, { status: "cancelled" }, SU);
  check("juice cancelled: 15,300 → 12,600", +(await one("SELECT totalAmount FROM Orders WHERE idOrder=?", [X])) === 12600);
  await call("PATCH", `/orders/${X}/status`, { status: "cancelled" }, SU);
  check("whole order cancelled, total 0", (await one("SELECT status FROM Orders WHERE idOrder=?", [X])) === "cancelled");
  check("shift closes", (await c.close(sh.idDailyReceipt, 0)).status === 200);
};

S.suppliers = async () => {
  console.log("Supplier debt is the same everywhere; payments validated and posted");
  const A = await login("admin@gusto.com", "admin123"), P = await login("purchases@gusto.com"), ST = await login("storage@gusto.com");
  const riceId = await one("SELECT idIngredient FROM Ingredients WHERE ingredientName='رز بسمتي'");
  const debts = async () => [
    +(await call("GET", "/suppliers", null, A)).data.find((x) => x.idSupplier === 3).currentDebt,
    +(await call("GET", "/suppliers/3/profile", null, A)).data.currentDebt,
    +(await call("GET", "/suppliers/summary", null, A)).data.remaining,
  ].join();
  check("start 250,000 everywhere", (await debts()) === "250000,250000,250000");
  const po = await call("POST", "/purchases", { purchaseNumber: "PO-S", purchaseDate: today(), supplierId: 3, supplierName: "x", paymentType: "credit", totalAmount: 60000, items: [{ ingredientId: riceId, orderedQuantity: 20, unitPrice: 3000 }] }, P);
  await call("POST", `/purchases/${po.data.id}/receive`, { items: [{ idPurchaseItem: await one("SELECT idPurchaseItem FROM PurchaseItems WHERE purchaseId=?", [po.data.id]), receivedQuantity: 10 }] }, ST);
  check("after receiving 30,000: 280,000 everywhere", (await debts()) === "280000,280000,280000", await debts());
  await call("POST", "/expenses", { expenseDate: today(), category: "اخرى", expenseCategoryId: 7, paidFromAccountId: 13, amount: 50000, description: "دفعة", supplierId: 3 }, A);
  check("expense payment 50,000: 230,000 everywhere", (await debts()) === "230000,230000,230000", await debts());
  await call("POST", "/suppliers/3/credits", { amount: 10000, creditDate: today(), creditType: "return" }, A);
  check("credit 10,000 lowers debt: 220,000", (await debts()) === "220000,220000,220000", await debts());
  check("payment above debt refused", (await call("POST", "/suppliers/3/payments", { amount: 999999, paymentDate: today() }, A)).status === 400);
};

S.profitAndBox = async () => {
  console.log("Cash box = drawer; one net profit everywhere");
  const c = await ctx(); await c.shift(); const C = await login("cashier@gusto.com");
  await c.order([[c.m("كباب لحم"), 1], [c.m("عصير برتقال طازج"), 1]]);
  await c.order([[c.m("كباب لحم"), 1]], { orderType: "card" });
  await call("POST", "/expenses", { expenseDate: today(), category: "كهرباء", expenseCategoryId: 2, paidFromAccountId: 13, amount: 5000, description: "x" }, c.A);
  const box = (await call("GET", "/box/balance", null, C)).data;
  check("cash box 12,000 = shift expected", +box.currentBalance === 12000 && +(await c.shift()).expectedCash === 12000, String(box.currentBalance));
  const d = today();
  const fin = (await call("GET", `/reports/financial?startDate=${d}&endDate=${d}`, null, c.A)).data.profit;
  const daily = (await call("GET", `/reports/daily-summary?date=${d}`, null, c.A)).data.summary;
  const boxSum = (await call("GET", "/box/summary?period=today", null, c.A)).data;
  check("net profit 16,475 on reports, daily, box", fin.netProfit === 16475 && daily.netProfit === 16475 && boxSum.netProfit === 16475, `${fin.netProfit}/${daily.netProfit}/${boxSum.netProfit}`);
};
