const bcrypt = require("bcryptjs");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");
const jwt = require("jsonwebtoken");
const Staff = require("../models/staff.model");

exports.login = (req, res) => {
  console.log("\n🔐 ===== LOGIN ATTEMPT =====");
  console.log("📧 Email received:", req.body.email);
  
  if (!req.body.email || !req.body.password) {
    console.log("❌ Missing email or password");
    return res.status(400).json({
      message: "Email and password are required!"
    });
  }

  Staff.findByEmail(req.body.email, (err, staff) => {
    if (err) {
      console.error("❌ Database error:", err);
      if (err.kind === "not_found") {
        console.log("❌ User NOT FOUND in database");
        return res.status(404).json({
          message: "User not found!"
        });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving user.",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    console.log("✅ User found in database:");
    console.log("   ID:", staff.idStaff);
    console.log("   Email:", staff.email);
    console.log("   Role:", staff.role);
    console.log("   Active:", staff.isActive);

    // Check if staff is active
    if (!staff.isActive) {
      console.log("❌ User account is INACTIVE");
      return res.status(403).json({
        message: "Your account has been deactivated!"
      });
    }

    // Verify password
    console.log("🔐 Comparing passwords...");
    
    const passwordIsValid = bcrypt.compareSync(req.body.password, staff.password);
    
    console.log("🔐 Password comparison result:", passwordIsValid ? "✅ MATCH" : "❌ NO MATCH");

    if (!passwordIsValid) {
      console.log("❌ LOGIN FAILED: Invalid password!");
      console.log("===========================\n");
      return res.status(401).json({
        message: "Invalid password!"
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: staff.idStaff, 
        role: staff.role 
      },
      process.env.JWT_SECRET || "gusto-secret-key",
      { expiresIn: 86400 } // 24 hours
    );

    // Update last login
    Staff.updateLastLogin(staff.idStaff, (err) => {
      if (err) {
        console.error("Failed to update last login:", err);
      }
    });

    // Return user info and token (without password)
    console.log("✅ LOGIN SUCCESSFUL!");
    console.log("🎫 Token generated");
    console.log("===========================\n");
    
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

