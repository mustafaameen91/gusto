module.exports = (app) => {
  const orderReturn = require("../controllers/orderReturn.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();
  router.use(authMiddleware.verifyToken);

  router.post("/", orderReturn.create);
  router.get("/", orderReturn.getByOrder);
  router.get("/order/:orderId", orderReturn.getByOrder);

  app.use("/api/order-returns", router);
};
