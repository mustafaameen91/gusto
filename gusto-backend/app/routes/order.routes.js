module.exports = (app) => {
  const orders = require("../controllers/order.controller");
  const orderItems = require("../controllers/orderItem.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Order routes
  router.post("/", orders.create);
  router.get("/", orders.findAll);
  router.get("/active", orders.getActive);
  router.get("/daily-summary", orders.getDailySummary);
  router.get("/:id", orders.findOne);
  router.patch("/:id/status", orders.updateStatus);
  router.patch("/:id/recompute-status", orders.recomputeStatus);

  // Order item routes
  router.get("/items/:id", orderItems.findOne);
  router.patch("/items/:id/status", orderItems.updateStatus);

  app.use("/api/orders", router);
};

