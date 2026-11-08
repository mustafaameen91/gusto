module.exports = (app) => {
  const tips = require("../controllers/tip.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const roleMiddleware = require("../middleware/role.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Create a new tip (admin, cashier)
  router.post("/", roleMiddleware.requireRole(["admin", "cashier"]), tips.create);

  // Get tip summary
  router.get("/summary", tips.getSummary);

  // Get all tips with filters
  router.get("/", tips.getAll);

  // Get tip by ID
  router.get("/:id", tips.findById);

  // Update tip (admin, cashier)
  router.put("/:id", roleMiddleware.requireRole(["admin", "cashier"]), tips.update);

  // Delete tip (admin only)
  router.delete("/:id", roleMiddleware.requireRole(["admin"]), tips.delete);

  app.use("/api/tips", router);
};

