module.exports = (app) => {
  const dailyReceipts = require("../controllers/dailyReceipt.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Get all daily receipts (history)
  router.get("/", dailyReceipts.getAll);

  // Get current open receipt
  router.get("/current", dailyReceipts.getCurrent);

  // Get specific receipt by ID
  router.get("/:id", dailyReceipts.findById);

  // Open cash register
  router.post("/", dailyReceipts.open);

  // Close cash register
  router.put("/:id/close", dailyReceipts.close);

  // Get cash counts for a receipt
  router.get("/:id/cash-counts", dailyReceipts.getCashCounts);

  app.use("/api/daily-receipts", router);
};

