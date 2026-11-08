module.exports = (app) => {
  const categories = require("../controllers/expenseCategory.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const roleMiddleware = require("../middleware/role.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);

  router.get("/", categories.getAll);
  router.post("/", roleMiddleware.requireRole(["admin"]), categories.create);

  app.use("/api/expense-categories", router);
};
