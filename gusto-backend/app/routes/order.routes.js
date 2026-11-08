module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const orders = require("../controllers/order.controller");
  const orderItems = require("../controllers/orderItem.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Order routes
  router.post("/", requireRole(["admin", "supervisor", "cashier", "waiter"]), orders.create);
  router.get("/", orders.findAll);
  router.get("/active", orders.getActive);
  router.get("/daily-summary", orders.getDailySummary);
  router.get("/:id", orders.findOne);
  router.patch("/:id/status", requireRole(["admin", "supervisor", "kitchen", "cashier"]), orders.updateStatus);
  router.patch("/:id/recompute-status", orders.recomputeStatus);

  // Order item routes
  router.get("/items/:id", orderItems.findOne);
  // Kitchen/drinks screens move items forward; cancelling is checked again (admin/supervisor) in the service
  router.patch("/items/:id/status", requireRole(["admin", "supervisor", "kitchen", "cashier"]), orderItems.updateStatus);

  app.use("/api/orders", router);
};

