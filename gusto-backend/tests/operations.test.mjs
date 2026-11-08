// Operations scenarios: kitchen statuses, access, returns/exchanges, purchases and the drawer.
import { call, login, sql, one, check, ctx, today } from "./harness.mjs";

export const scenarios = {};
const S = scenarios;

S.kitchenStatuses = async () => {
  console.log("Kitchen statuses move forward only; returned/cancelled lines stay as they are");
  const c = await ctx(); await c.shift();
  const K = await login("kitchen@gusto.com"), W = await login("storage@gusto.com");
  const juice = c.m("عصير برتقال طازج"), hummus = c.m("حمص بالطحينة");
  const X = (await c.order([[juice, 1], [hummus, 1]])).data.orderId;
  const lineOf = (mid) => one("SELECT idOrderItem FROM OrderItems WHERE orderId=? AND menuItemId=?", [X, mid]);
  const statusOf = (mid) => one("SELECT status FROM OrderItems WHERE orderId=? AND menuItemId=?", [X, mid]);
  check("storage role cannot change item status", (await call("PATCH", `/orders/items/${await lineOf(juice.idMenuItem)}/status`, { status: "ready" }, W)).status === 403);
  await call("POST", "/order-returns", { orderId: X, refundMethod: "cash", items: [{ orderItemId: await lineOf(juice.idMenuItem), quantity: 1, disposition: "wasted" }] }, c.A);
  await call("PATCH", `/orders/items/${await lineOf(juice.idMenuItem)}/status`, { status: "ready" }, K);
  check("returned line not revived by a 'ready' tap", (await statusOf(juice.idMenuItem)) === "returned");
  await call("PATCH", `/orders/items/${await lineOf(hummus.idMenuItem)}/status`, { status: "completed" }, K);
  await call("PATCH", `/orders/items/${await lineOf(hummus.idMenuItem)}/status`, { status: "ready" }, K);
  check("completed item not moved back to ready", (await statusOf(hummus.idMenuItem)) === "completed");
  await call("PATCH", `/orders/${X}/recompute-status`, null, K);
  check("order with completed + returned lines is completed", (await one("SELECT status FROM Orders WHERE idOrder=?", [X])) === "completed");
};

S.accessFollowsStaffRecord = async () => {
  console.log("Deactivating a user or changing their role takes effect at once");
  const A = await login("admin@gusto.com", "admin123");
  const C = await login("cashier@gusto.com");
  check("cashier can list customers", (await call("GET", "/customers", null, C)).status === 200);
  await sql("UPDATE Staff SET role = 'kitchen' WHERE email = 'cashier@gusto.com'");
  await new Promise((r) => setTimeout(r, 5200));
  check("after role change to kitchen: refused", (await call("GET", "/customers", null, C)).status === 403);
  await sql("UPDATE Staff SET isActive = 0 WHERE email = 'cashier@gusto.com'");
  await new Promise((r) => setTimeout(r, 5200));
  const r = await call("GET", "/kitchen-stock/menu", null, C);
  check("after deactivation: token refused", r.status === 401, String(r.status));
  check("login reveals nothing about unknown emails", (await call("POST", "/auth/login", { email: "nobody@x.com", password: "x" })).status === 401);
  check("admin unaffected", (await call("GET", "/customers", null, A)).status === 200);
};

S.cancelAfterReturn = async () => {
  console.log("Cancelling after a return keeps the order (and its returned sale) alive");
  const c = await ctx(); const sh = await c.shift(); const SU = await login("supervisor@gusto.com");
  const hummus = c.m("حمص بالطحينة"), kebba = c.m("كبة مقلية");
  const X = (await c.order([[hummus, 1], [kebba, 1]])).data.orderId;   // 4,000 + 6,000
  const lineOf = (mid) => one("SELECT idOrderItem FROM OrderItems WHERE orderId=? AND menuItemId=?", [X, mid]);
  await call("POST", "/order-returns", { orderId: X, refundMethod: "cash", items: [{ orderItemId: await lineOf(hummus.idMenuItem), quantity: 1, disposition: "wasted" }] }, c.A);
  await call("PATCH", `/orders/items/${await lineOf(kebba.idMenuItem)}/status`, { status: "cancelled" }, SU);
  check("order not cancelled (returned hummus was sold)", (await one("SELECT status FROM Orders WHERE idOrder=?", [X])) !== "cancelled");
  check("order total 4,000 (the hummus, refunded separately)", +(await one("SELECT totalAmount FROM Orders WHERE idOrder=?", [X])) === 4000);
  check("drawer: 4,000 − 4,000 refund = 0", +(await c.shift()).expectedCash === 0, String((await c.shift()).expectedCash));
  const r = await c.close(sh.idDailyReceipt, 0);
  const L = await c.shiftLines(sh.idDailyReceipt);
  check("closes; food revenue 4,000 credited and 4,000 returned", r.status === 200 && c.sumBy(L, "4102", "credit") === 4000 && c.sumBy(L, "4102", "debit") === 4000, `${r.status} ${c.sumBy(L, "4102", "credit")}/${c.sumBy(L, "4102", "debit")}`);
};

S.splitAfterReturn = async () => {
  console.log("Drinks/food split stays right when a drink is returned in the same shift");
  const c = await ctx(); const sh = await c.shift();
  const juice = c.m("عصير برتقال طازج"), hummus = c.m("حمص بالطحينة");
  const X = (await c.order([[juice, 1], [hummus, 1]])).data.orderId;  // 3,000 + 4,000
  const line = await one("SELECT idOrderItem FROM OrderItems WHERE orderId=? AND menuItemId=?", [X, juice.idMenuItem]);
  await call("POST", "/order-returns", { orderId: X, refundMethod: "cash", items: [{ orderItemId: line, quantity: 1, disposition: "wasted" }] }, c.A);
  await c.close(sh.idDailyReceipt, 4000);
  const L = await c.shiftLines(sh.idDailyReceipt);
  const drinksNet = c.sumBy(L, "4101", "credit") - c.sumBy(L, "4101", "debit"), foodNet = c.sumBy(L, "4102", "credit") - c.sumBy(L, "4102", "debit");
  check("net drinks 0, net food 4,000", drinksNet === 0 && foodNet === 4000, `drinks ${drinksNet}, food ${foodNet}`);
};

S.creditRefundGoesToAccount = async () => {
  console.log("A credit sale is never refunded in cash");
  const c = await ctx(); await c.shift();
  const fattoush = c.m("فتوش");
  const X = (await c.order([[fattoush, 1]], { saleType: "credit", customerId: 1 })).data.orderId;
  const line = await one("SELECT idOrderItem FROM OrderItems WHERE orderId=?", [X]);
  const r = await call("POST", "/order-returns", { orderId: X, refundMethod: "cash", items: [{ orderItemId: line, quantity: 1, disposition: "wasted" }] }, c.A);
  check("refund recorded on the account", r.status === 200 && r.data.return.refundMethod === "credit", JSON.stringify(r.data).slice(0, 120));
  check("drawer untouched (0)", +(await c.shift()).expectedCash === 0);
  check("customer balance back to 0", +(await call("GET", "/customers/1/profile", null, c.A)).data.balance === 0);
};

S.exchangeUsesIngredients = async () => {
  console.log("An exchange's replacement uses ingredients in the current shift; returned-to-stock gives them back");
  const c = await ctx(); const sh1 = await c.shift();
  const juice = c.m("عصير برتقال طازج"), kebab = c.m("كباب لحم");
  const X = (await c.order([[juice, 1]])).data.orderId;
  await c.close(sh1.idDailyReceipt, 3000);
  const sh2 = await c.shift();
  const mince = () => one("SELECT s.quantity FROM IngredientStock s JOIN Ingredients i ON i.idIngredient=s.ingredientId WHERE s.locationId=2 AND i.ingredientName='لحم مفروم'");
  const orange = () => one("SELECT s.quantity FROM IngredientStock s JOIN Ingredients i ON i.idIngredient=s.ingredientId WHERE s.locationId=2 AND i.ingredientName='برتقال'");
  const m0 = +(await mince()), o0 = +(await orange());
  const line = await one("SELECT idOrderItem FROM OrderItems WHERE orderId=?", [X]);
  await call("POST", "/order-returns", { orderId: X, refundMethod: "cash", items: [{ orderItemId: line, quantity: 1, disposition: "returned_to_stock", replacementMenuItemId: kebab.idMenuItem, replacementQuantity: 1 }] }, c.A);
  check("replacement kebab used 0.3 kg mince", Math.abs(+(await mince()) - (m0 - 0.3)) < 1e-6, `${m0} → ${await mince()}`);
  check("returned juice gave back its 0.4 kg orange", Math.abs(+(await orange()) - (o0 + 0.4)) < 1e-6, `${o0} → ${await orange()}`);
  check("no kitchen portion created for a drink", (await one("SELECT COUNT(*) FROM KitchenItemStock WHERE menuItemId=?", [juice.idMenuItem])) === 0);
  await c.close(sh2.idDailyReceipt, 11000);
  const L = await c.shiftLines(sh2.idDailyReceipt);
  // kebab 4,450 used, juice 625 given back → 3,825 in shift 2
  check("shift 2 cost of goods 3,825", c.sumBy(L, "5101", "debit") - c.sumBy(L, "5101", "credit") === 3825, `${c.sumBy(L, "5101", "debit")} / ${c.sumBy(L, "5101", "credit")} / 1301 ${c.sumBy(L, "1301", "credit")}`);
};

S.cashPurchaseFromDrawer = async () => {
  console.log("A cash purchase received during a shift comes out of the drawer");
  const c = await ctx(); const sh = await c.shift();
  await c.order([[c.m("كباب لحم"), 2]]);   // 28,000 cash
  const P = await login("purchases@gusto.com"), ST = await login("storage@gusto.com");
  const oilId = await one("SELECT idIngredient FROM Ingredients WHERE ingredientName='زيت زيتون'");
  const po = await call("POST", "/purchases", { purchaseNumber: "PO-C", purchaseDate: today(), supplierId: 2, supplierName: "x", paymentType: "cash", totalAmount: 18000, items: [{ ingredientId: oilId, orderedQuantity: 2, unitPrice: 9000 }] }, P);
  await call("POST", `/purchases/${po.data.id}/receive`, { items: [{ idPurchaseItem: await one("SELECT idPurchaseItem FROM PurchaseItems WHERE purchaseId=?", [po.data.id]), receivedQuantity: 2 }] }, ST);
  check("drawer 28,000 − 18,000 = 10,000", +(await c.shift()).expectedCash === 10000, String((await c.shift()).expectedCash));
  check("cash box shows the 18,000 purchase", +(await call("GET", "/box/balance", null, c.A)).data.totalPurchases === 18000);
  const r = await c.close(sh.idDailyReceipt, 10000);
  check("shift closes at 0 difference", r.status === 200 && +r.data.summary.discrepancy === 0, r.status + " " + r.data.summary?.discrepancy);
};

S.kitchenPortions = async () => {
  console.log("Made-to-order dishes always sell; tracked portions can't be oversold");
  const c = await ctx(); await c.shift();
  const biryani = c.m("برياني دجاج"), kebab = c.m("كباب لحم");
  await sql("DELETE FROM KitchenItemStock WHERE menuItemId = ?", [biryani.idMenuItem]);
  check("dish without tracked portions sells (made to order)", (await c.order([[biryani, 3]])).status === 200);
  await sql("UPDATE KitchenItemStock SET quantity = 1 WHERE menuItemId = ?", [kebab.idMenuItem]);
  const [a, b] = await Promise.all([c.order([[kebab, 1]]), c.order([[kebab, 1]])]);
  check("two cashiers, last kebab: exactly one sale", [a.status, b.status].sort().join() === "200,400", `${a.status}/${b.status}`);
  check("portions never negative", (await one("SELECT quantity FROM KitchenItemStock WHERE menuItemId=?", [kebab.idMenuItem])) === 0);
};

S.stockEditing = async () => {
  console.log("Editing an ingredient never changes stock; waste is valued and can't go negative");
  const c = await ctx(); await c.shift(); const ST = await login("storage@gusto.com");
  const id = await one("SELECT idIngredient FROM Ingredients WHERE ingredientName='طماطم'"); // 30 kg @ 1,000
  await call("PUT", `/inventory/${id}`, { ingredientName: "طماطم", unit: "kg", currentStock: 999, minStock: 5, maxStock: 60, costPerUnit: 1000 }, ST);
  check("edit with currentStock 999 leaves stock at 30", +(await one("SELECT currentStock FROM Ingredients WHERE idIngredient=?", [id])) === 30);
  let r = await call("PATCH", `/inventory/${id}/adjust-stock`, { transactionType: "waste", quantity: 2 }, ST);
  check("waste 2 kg: stock 28, valued 2,000 at the average cost", r.status === 200 && +r.data.currentStock === 28 && r.data.totalCost === 2000, JSON.stringify(r.data));
  r = await call("PATCH", `/inventory/${id}/adjust-stock`, { transactionType: "waste", quantity: 100 }, ST);
  check("wasting more than in stock refused", r.status === 400, r.status + " " + r.data.message);
  check("unknown movement type refused", (await call("PATCH", `/inventory/${id}/adjust-stock`, { transactionType: "purchase", quantity: 5 }, ST)).status === 400);
  const sh = await c.shift();
  await c.close(sh.idDailyReceipt, 0);
  const L = await c.shiftLines(sh.idDailyReceipt);
  check("shift posts the 2,000 waste (Dr 5103)", c.sumBy(L, "5103", "debit") === 2000, String(c.sumBy(L, "5103", "debit")));
};

S.publicMenu = async () => {
  console.log("The public menu shows dishes but not recipes or costs");
  const kebabId = await one("SELECT idMenuItem FROM MenuItems WHERE itemName='كباب لحم'");
  const pub = await call("GET", `/menu/${kebabId}`);
  check("visitor sees the dish without recipes", pub.status === 200 && pub.data.itemName === "كباب لحم" && pub.data.recipes === undefined);
  const staff = await call("GET", `/menu/${kebabId}`, null, await login("admin@gusto.com", "admin123"));
  check("staff still see recipes", Array.isArray(staff.data.recipes) && staff.data.recipes.length > 0);
  await sql("UPDATE MenuItems SET isActive = 0 WHERE idMenuItem = ?", [kebabId]);
  check("visitor can't see an inactive dish", (await call("GET", `/menu/${kebabId}`)).status === 404);
};

S.staffManagement = async () => {
  console.log("Staff: edits save, passwords reset, history kept, admins can't lock themselves out");
  const c = await ctx(); await c.shift(); const A = c.A;
  const cashierId = await one("SELECT idStaff FROM Staff WHERE email='cashier@gusto.com'");
  let r = await call("PUT", `/staff/${cashierId}`, { fullName: "الكاشير", phone: "1", role: "cashier", salary: 1, isActive: true, email: "cash2@gusto.com", hireDate: "2026-01-15", password: "newpass1" }, A);
  check("email, hire date and password saved", r.status === 200 && (await one("SELECT email FROM Staff WHERE idStaff=?", [cashierId])) === "cash2@gusto.com" && (await one("SELECT hireDate FROM Staff WHERE idStaff=?", [cashierId])) === "2026-01-15" && !!(await login("cash2@gusto.com", "newpass1")), r.status + " " + JSON.stringify(r.data).slice(0, 150) + " " + (await one("SELECT hireDate FROM Staff WHERE idStaff=?", [cashierId])));
  check("no password hash in responses", r.data.password === undefined && (await call("GET", `/staff/${cashierId}`, null, A)).data.password === undefined);
  check("invalid role refused", (await call("PUT", `/staff/${cashierId}`, { fullName: "x", role: "bartender", isActive: true }, A)).status === 400);
  check("admin can't demote themselves", (await call("PUT", "/staff/1", { fullName: "Admin", role: "cashier", isActive: true }, A)).status === 400);
  await c.order([[c.m("فتوش"), 1]], { token: await login("cash2@gusto.com", "newpass1") });
  r = await call("DELETE", `/staff/${cashierId}`, null, A);
  check("deleting someone with orders deactivates them", r.data.deactivated === true && (await one("SELECT isActive FROM Staff WHERE idStaff=?", [cashierId])) === 0);
  const waiterId = await one("SELECT idStaff FROM Staff WHERE email='waiter@gusto.com'");
  check("unused account really deleted", (await call("DELETE", `/staff/${waiterId}`, null, A)).status === 200 && (await one("SELECT COUNT(*) FROM Staff WHERE idStaff=?", [waiterId])) === 0);
};

S.tips = async () => {
  console.log("Tips: in the drawer and the books of their shift, positive only");
  const c = await ctx(); const sh = await c.shift(); const C = await login("cashier@gusto.com");
  check("negative tip refused", (await call("POST", "/tips", { tipDate: today(), amount: -500 }, C)).status === 400);
  check("tip without an order recorded", (await call("POST", "/tips", { tipDate: today(), amount: 2000 }, C)).status === 201);
  check("drawer expects the 2,000 tip", +(await c.shift()).expectedCash === 2000, String((await c.shift()).expectedCash));
  const r = await c.close(sh.idDailyReceipt, 2000);
  check("closes at 0 difference", r.status === 200 && +r.data.summary.discrepancy === 0, r.status + " " + r.data.summary?.discrepancy);
  const L = await c.shiftLines(sh.idDailyReceipt);
  check("tip posted (Dr cash 2,000)", c.sumBy(L, "1101", "debit") === 2000, JSON.stringify(L));
  const tipId = await one("SELECT idTip FROM Tips LIMIT 1");
  check("tip in a closed shift can't be edited", (await call("PUT", `/tips/${tipId}`, { amount: 1 }, c.A)).status === 400);
};

S.sizeDeleteKeepsHistory = async () => {
  console.log("Deleting a size deactivates it; past orders keep it");
  const c = await ctx(); await c.shift();
  const juice = c.m("عصير برتقال طازج");
  const large = await one("SELECT idItemSize FROM ItemSizes WHERE menuItemId=? AND sizeName='كبير'", [juice.idMenuItem]);
  const X = (await c.order([[juice, 1, 4000, large]])).data.orderId;
  await call("DELETE", `/item-sizes/${large}`, null, c.A);
  check("order line still points at the size", (await one("SELECT itemSizeId FROM OrderItems WHERE orderId=?", [X])) === large);
  check("size hidden from the menu", !(await call("GET", `/item-sizes/menu-item/${juice.idMenuItem}`)).data.some((z) => z.idItemSize === large));
  check("new orders with it refused", (await c.order([[juice, 1, 4000, large]])).status === 400);
};
