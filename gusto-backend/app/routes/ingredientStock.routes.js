module.exports = (app) => {
  const controller = require("../controllers/ingredientStock.controller");
  const auth = require("../middleware/auth.middleware");
  const router = require("express").Router();

  router.use(auth.verifyToken);
  router.get("/main", controller.getMainStock);
  router.get("/location/:locationId", controller.getByLocation);
  router.get("/ingredient/:ingredientId", controller.getByIngredient);

  app.use("/api/ingredient-stock", router);
};
