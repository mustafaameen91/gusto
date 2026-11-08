module.exports = (app) => {
  const payments = require("../controllers/payment.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);

  router.get("/", payments.list);

  app.use("/api/payments", router);
};
