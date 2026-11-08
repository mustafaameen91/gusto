module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const authMiddleware = require("../middleware/auth.middleware");
  const waiterOrders = require("../controllers/waiterOrder.controller");
  const router = require("express").Router();

  router.use(authMiddleware.verifyToken);
  const takers = requireRole(["waiter", "admin", "supervisor"]); // who may send orders from a tablet
  const till = requireRole(["admin", "supervisor", "cashier"]); // who receives them

  router.post("/", takers, waiterOrders.create);
  router.get("/mine", takers, waiterOrders.mine);
  router.get("/", till, waiterOrders.list);
  router.patch("/:id/reject", till, waiterOrders.reject);
  router.patch("/:id/cancel", takers, waiterOrders.cancel);

  app.use("/api/waiter-orders", router);
};
