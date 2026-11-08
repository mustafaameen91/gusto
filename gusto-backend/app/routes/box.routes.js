module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const box = require("../controllers/box.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Get current cash box balance
  const boxViewers = requireRole(["admin", "cashier", "supervisor"]);
  router.get("/balance", boxViewers, box.getBalance);

  // Get box summary (daily/weekly/monthly)
  router.get("/summary", requireRole(["admin"]), box.getSummary);

  // Get all transactions
  router.get("/transactions", boxViewers, box.getTransactions);

  // Get per-account balances (from JournalLines)
  router.get("/account-balances", boxViewers, box.getAccountBalances);

  // Get transactions for a specific account
  router.get("/account-transactions/:accountId", boxViewers, box.getAccountTransactions);

  // Transfer money between boxes/accounts (cash ↔ bank)
  router.post("/transfer", requireRole(["admin"]), box.transfer);

  app.use("/api/box", router);
};

