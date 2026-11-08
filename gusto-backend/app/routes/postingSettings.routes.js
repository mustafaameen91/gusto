module.exports = (app) => {
  const postingSettings = require("../controllers/postingSettings.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const roleMiddleware = require("../middleware/role.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);
  router.use(roleMiddleware.requireRole(["admin"]));

  router.get("/", (req, res) => postingSettings.getByName(req, res));
  router.get("/:name", (req, res) => postingSettings.getByName(req, res));
  router.put("/", (req, res) => postingSettings.update(req, res));
  router.put("/:name", (req, res) => postingSettings.update(req, res));

  app.use("/api/posting-settings", router);
};
