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
      const { password, ...withoutPassword } = data;
      res.json(withoutPassword);
    });
  });

  // Update staff
  router.put("/:id", (req, res) => {
    if (req.body.role !== undefined && !Staff.ROLES.includes(req.body.role)) {
      return res.status(400).json({ message: "الدور غير صحيح" });
    }
    if (req.body.password !== undefined && req.body.password !== "" && String(req.body.password).length < 6) {
      return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }
    // An admin can't lock themselves out
    if (Number(req.params.id) === Number(req.userId) && (req.body.role && req.body.role !== "admin" || req.body.isActive === false || req.body.isActive === 0)) {
      return res.status(400).json({ message: "لا يمكنك تعطيل حسابك أو تغيير دورك بنفسك" });
    }
    Staff.updateById(req.params.id, req.body, (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          return res.status(404).json({
            message: `Staff not found with id ${req.params.id}.`
          });
        }
        if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "البريد الإلكتروني مستخدم لموظف آخر" });
        return res.status(500).json({
          message: "Error updating staff with id " + req.params.id
        });
      }
      const { password, ...withoutPassword } = data;
      res.json(withoutPassword);
    });
  });

  // Delete staff
  router.delete("/:id", (req, res) => {
    if (Number(req.params.id) === Number(req.userId)) {
      return res.status(400).json({ message: "لا يمكنك حذف حسابك" });
    }
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
      if (data && data.deactivated) {
        return res.json({ message: "للموظف سجلات في النظام، لذلك تم تعطيل حسابه بدلاً من حذفه", deactivated: true });
      }
      res.json({ message: "Staff deleted successfully!" });
    });
  });

  app.use("/api/staff", router);
};

