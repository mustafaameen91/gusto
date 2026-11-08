module.exports = (app) => {
  const controller = require("../controllers/kitchenItemStock.controller");
  const auth = require("../middleware/auth.middleware");
  const router = require("express").Router();

  router.use(auth.verifyToken);
  router.get("/menu", controller.getMenu);
  router.post("/add", controller.add);
  router.patch("/decrease", controller.decrease);
  router.put("/set", controller.setQuantity);

  app.use("/api/kitchen-stock", router);
};
