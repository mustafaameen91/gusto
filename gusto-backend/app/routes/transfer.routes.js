module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const controller = require("../controllers/transfer.controller");
  const auth = require("../middleware/auth.middleware");
  const router = require("express").Router();

  router.use(auth.verifyToken);
  router.post("/", requireRole(["admin", "storage"]), controller.create);
  router.get("/", requireRole(["admin", "storage"]), controller.getAll);

  app.use("/api/transfers", router);
};
