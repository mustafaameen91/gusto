module.exports = (app) => {
  const otherIncome = require("../controllers/otherIncome.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);

  router.get("/", otherIncome.list);
  router.post("/", otherIncome.create);

  app.use("/api/other-incomes", router);
};
