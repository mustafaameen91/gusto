module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const payments = require("../controllers/payment.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);

  router.get("/", requireRole(["admin", "cashier", "supervisor"]), payments.list);

  app.use("/api/payments", router);
};
