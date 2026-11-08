module.exports = (app) => {
  const controller = require("../controllers/transfer.controller");
  const auth = require("../middleware/auth.middleware");
  const router = require("express").Router();

  router.use(auth.verifyToken);
  router.post("/", controller.create);
  router.get("/", controller.getAll);

  app.use("/api/transfers", router);
};
