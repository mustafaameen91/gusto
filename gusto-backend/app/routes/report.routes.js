module.exports = (app) => {
  const reports = require("../controllers/report.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Financial Report (Profit & Loss)
  router.get("/financial", reports.getFinancial);

  // Sales Report
  router.get("/sales", reports.getSales);

  // Expense Report
  router.get("/expenses", reports.getExpenses);

  // Purchase Report
  router.get("/purchases", reports.getPurchases);

  // Daily Summary Report
  router.get("/daily-summary", reports.getDailySummary);

  // Profit since opening (2025-11-24 until now) — single number, performant
  router.get("/profit-since-opening", reports.getProfitSinceOpening);

  // Item Sales Report
  router.get("/item-sales", reports.getItemSales);

  // Time-window Sales Report (items sold in a date+time range)
  router.get("/time-sales", reports.getTimeSales);

  // Material Usage Report
  router.get("/material-usage", reports.getMaterialUsage);

  app.use("/api/reports", router);
};

