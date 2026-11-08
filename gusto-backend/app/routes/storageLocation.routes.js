module.exports = (app) => {
  const controller = require("../controllers/storageLocation.controller");
  const auth = require("../middleware/auth.middleware");
  const router = require("express").Router();

  router.use(auth.verifyToken);
  router.get("/", controller.getAll);
  router.get("/:id", controller.findById);

  app.use("/api/storage-locations", router);
};
