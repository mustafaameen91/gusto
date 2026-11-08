module.exports = (app) => {
  const box = require("../controllers/box.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Get current cash box balance
  router.get("/balance", box.getBalance);

  // Get box summary (daily/weekly/monthly)
  router.get("/summary", box.getSummary);

  // Get all transactions
  router.get("/transactions", box.getTransactions);

  // Get per-account balances (from JournalLines)
  router.get("/account-balances", box.getAccountBalances);

  // Get transactions for a specific account
  router.get("/account-transactions/:accountId", box.getAccountTransactions);

  // Transfer money between boxes/accounts (cash ↔ bank)
  router.post("/transfer", box.transfer);

  app.use("/api/box", router);
};

