module.exports = (app) => {
  const accounts = require("../controllers/account.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const roleMiddleware = require("../middleware/role.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);
  router.use(roleMiddleware.requireRole(["admin"]));

  router.get("/", accounts.getAll);
  router.get("/:id", accounts.findById);
  router.post("/", accounts.create);
  router.put("/:id", accounts.update);
  router.delete("/:id", accounts.delete);

  app.use("/api/accounts", router);
};
