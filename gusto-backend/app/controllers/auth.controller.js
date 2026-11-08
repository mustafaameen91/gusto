const bcrypt = require("bcryptjs");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");
const jwt = require("jsonwebtoken");
const Staff = require("../models/staff.model");

exports.login = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      message: "البريد الإلكتروني وكلمة المرور مطلوبان"
    });
  }
  // Same answer for an unknown email and a wrong password, so logins don't reveal which emails exist
  const badLogin = () => res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });

  Staff.findByEmail(req.body.email, (err, staff) => {
    if (err) {
      if (err.kind === "not_found") return badLogin();
      console.error("[auth] login lookup failed:", err.message);
      return res.status(500).json({ message: "Error retrieving user." });
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, staff.password);
    if (!passwordIsValid) return badLogin();

    if (!staff.isActive) {
      return res.status(403).json({
        message: "الحساب غير فعّال. يرجى مراجعة الإدارة."
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: staff.idStaff, 
        role: staff.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: 86400 } // 24 hours
    );

    // Update last login
    Staff.updateLastLogin(staff.idStaff, (err) => {
      if (err) {
        console.error("Failed to update last login:", err);
      }
    });

    // Return user info and token (without password)
    
    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: staff.idStaff,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role
      }
    });
  });
};

exports.register = (req, res) => {
  if (!req.body.fullName || !req.body.email || !req.body.password) {
    return res.status(400).json({
      message: "Name, email, and password are required!"
    });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  const newStaff = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone || "",
    password: hashedPassword,
    role: req.body.role || "cashier",
    hireDate: req.body.hireDate || todayBusinessDate(),
    salary: req.body.salary || 0,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  };

  Staff.create(newStaff, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating user."
      });
    }

    res.json({
      message: "User registered successfully",
      user: {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role
      }
    });
  });
};

/**
 * POST /api/auth/verify-credentials
 * Verifies email+password and checks that the user has an allowed role.
 * Used for supervisor/admin authentication before sensitive actions (e.g. returns).
 * Body: { email, password, allowedRoles: ['admin','supervisor'] }
 * Returns: { verified: true, staff: { id, fullName, role } }
 */
exports.verifyCredentials = (req, res) => {
  const { email, password, allowedRoles } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
  }

  const roles = Array.isArray(allowedRoles) && allowedRoles.length > 0
    ? allowedRoles
    : ['admin', 'supervisor'];

  Staff.findByEmail(email, (err, staff) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }
      return res.status(500).json({ message: err.message });
    }

    if (!staff.isActive) {
      return res.status(403).json({ message: "هذا الحساب معطل" });
    }

    if (!roles.includes(staff.role)) {
      return res.status(403).json({ message: "ليس لديك صلاحية لتنفيذ هذا الإجراء. يجب أن تكون مديراً أو مشرفاً." });
    }

    const valid = bcrypt.compareSync(password, staff.password);
    if (!valid) {
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }

    res.json({
      verified: true,
      staff: {
        id: staff.idStaff,
        fullName: staff.fullName,
        role: staff.role
      }
    });
  });
};

exports.me = (req, res) => {
  Staff.findById(req.userId, (err, staff) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: "User not found!"
        });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving user."
      });
    }

    res.json({
      id: staff.idStaff,
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      role: staff.role
    });
  });
};

