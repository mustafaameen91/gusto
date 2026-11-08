module.exports = (app) => {
  const inventory = require("../controllers/inventory.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  router.post("/", authMiddleware.isStorage, inventory.create);
  router.get("/", inventory.findAll);
  router.get("/low-stock", inventory.getLowStock);
  router.get("/usage-summary", inventory.getUsageSummary);
  router.get("/:id", inventory.findOne);
  router.get("/:id/transactions", inventory.getTransactions);
  router.put("/:id", authMiddleware.isStorage, inventory.update);
  router.patch("/:id/adjust-stock", inventory.adjustStock);
  router.delete("/:id", authMiddleware.isAdmin, inventory.delete);

  app.use("/api/inventory", router);
};

