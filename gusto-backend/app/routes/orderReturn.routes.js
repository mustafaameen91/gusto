module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const orderReturn = require("../controllers/orderReturn.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);

  router.post("/", requireRole(["admin", "supervisor"]), orderReturn.create);
  const returnViewers = requireRole(["admin", "supervisor", "cashier"]);
  router.get("/", returnViewers, orderReturn.getByOrder);
  router.get("/order/:orderId", returnViewers, orderReturn.getByOrder);

  app.use("/api/order-returns", router);
};
