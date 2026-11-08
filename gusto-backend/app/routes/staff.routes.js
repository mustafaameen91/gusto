module.exports = (app) => {
  const Staff = require("../models/staff.model");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication and admin role
  router.use(authMiddleware.verifyToken);
  router.use(authMiddleware.isAdmin);

  // Get all staff
  router.get("/", (req, res) => {
    Staff.getAll((err, data) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving staff."
        });
      }
      res.json(data);
    });
  });

  // Get one staff member
  router.get("/:id", (req, res) => {
    Staff.findById(req.params.id, (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          return res.status(404).json({
            message: `Staff not found with id ${req.params.id}.`
          });
        }
        return res.status(500).json({
          message: "Error retrieving staff with id " + req.params.id
        });
      }
      res.json(data);
    });
  });

  // Update staff
  router.put("/:id", (req, res) => {
    Staff.updateById(req.params.id, req.body, (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          return res.status(404).json({
            message: `Staff not found with id ${req.params.id}.`
          });
        }
        return res.status(500).json({
          message: "Error updating staff with id " + req.params.id
        });
      }
      res.json(data);
    });
  });

  // Delete staff
  router.delete("/:id", (req, res) => {
    Staff.remove(req.params.id, (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          return res.status(404).json({
            message: `Staff not found with id ${req.params.id}.`
          });
        }
        return res.status(500).json({
          message: "Could not delete staff with id " + req.params.id
        });
      }
      res.json({ message: "Staff deleted successfully!" });
    });
  });

  app.use("/api/staff", router);
};

