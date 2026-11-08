const db = require("../models/db");
const { businessWindow } = require("./businessDay");

/**
 * The one definition of profit, used by the dashboard, reports and cash box:
 *   net sales     = orders after discount − refunds for returns + exchange replacements
 *   gross profit  = net sales − cost of goods sold (ingredient cost of what was sold)
 *   net profit    = gross profit − operating expenses + other income
 * Purchases are stock, not an expense; their cost counts when the food is sold.
 * Payments to suppliers (expenses tagged with a supplier) settle debts and are not expenses.
 *
 * startDate/endDate are business dates (YYYY-MM-DD); the window is 07:00 → 02:59 next day.
 */
function profitForPeriod(startDate, endDate, callback) {
  const { startDateTime, endDateTime } = businessWindow(startDate, endDate);
  const query = `
    SELECT
      (SELECT COALESCE(SUM(totalAmount), 0) FROM Orders
        WHERE orderDate BETWEEN ? AND ? AND status != 'cancelled') AS sales,
      (SELECT COALESCE(SUM(ri.refundAmount), 0) FROM OrderReturnItems ri
        JOIN OrderReturns r ON r.idOrderReturn = ri.orderReturnId
        WHERE r.returnDate BETWEEN ? AND ?) AS refunds,
      (SELECT COALESCE(SUM(ri.replacementPrice * ri.replacementQuantity), 0) FROM OrderReturnItems ri
        JOIN OrderReturns r ON r.idOrderReturn = ri.orderReturnId
        WHERE r.returnDate BETWEEN ? AND ? AND ri.replacementMenuItemId IS NOT NULL) AS replacements,
      (SELECT COALESCE(SUM(it.totalCost), 0) FROM InventoryTransactions it
        JOIN Orders o ON o.idOrder = it.orderId
        WHERE it.transactionType = 'usage' AND o.orderDate BETWEEN ? AND ?) AS cogs,
      (SELECT COALESCE(SUM(amount), 0) FROM Expenses
        WHERE supplierId IS NULL AND expenseDate BETWEEN ? AND ?) AS operatingExpenses,
      (SELECT COALESCE(SUM(amount), 0) FROM OtherIncomes
        WHERE incomeDate BETWEEN ? AND ?) AS otherIncome
  `;
  const params = [
    startDateTime, endDateTime,
    startDateTime, endDateTime,
    startDateTime, endDateTime,
    startDateTime, endDateTime,
    startDate, endDate,
    startDate, endDate,
  ];
  db.query(query, params, (err, rows) => {
    if (err) return callback(err);
    const r = rows[0];
    const n = (k) => Number(r[k] || 0);
    const round2 = (x) => Math.round(x * 100) / 100;
    const netSales = round2(n("sales") - n("refunds") + n("replacements"));
    const grossProfit = round2(netSales - n("cogs"));
    const netProfit = round2(grossProfit - n("operatingExpenses") + n("otherIncome"));
    callback(null, {
      sales: n("sales"),
      refunds: n("refunds"),
      replacements: n("replacements"),
      netSales,
      cogs: n("cogs"),
      grossProfit,
      operatingExpenses: n("operatingExpenses"),
      otherIncome: n("otherIncome"),
      netProfit,
      profitMargin: netSales > 0 ? Number(((netProfit / netSales) * 100).toFixed(2)) : 0,
    });
  });
}

module.exports = { profitForPeriod };
