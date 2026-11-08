module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const otherIncome = require("../controllers/otherIncome.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);

  router.get("/", requireRole(["admin", "cashier", "supervisor"]), otherIncome.list);
  router.post("/", requireRole(["admin"]), otherIncome.create);

  app.use("/api/other-incomes", router);
};
