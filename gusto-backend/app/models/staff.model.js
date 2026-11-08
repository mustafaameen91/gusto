const db = require("./db");

const Staff = function(staff) {
  this.fullName = staff.fullName;
  this.email = staff.email;
  this.phone = staff.phone;
  this.password = staff.password;
  this.role = staff.role;
  this.hireDate = staff.hireDate;
  this.salary = staff.salary;
  this.isActive = staff.isActive;
};

Staff.create = (newStaff, result) => {
  db.query("INSERT INTO Staff SET ?", newStaff, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newStaff });
  });
};

Staff.findById = (id, result) => {
  db.query("SELECT * FROM Staff WHERE idStaff = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

Staff.findByEmail = (email, result) => {
  db.query("SELECT * FROM Staff WHERE email = ?", [email], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

Staff.getAll = (result) => {
  db.query("SELECT idStaff, fullName, email, phone, role, hireDate, salary, isActive, lastLogin, createdAt FROM Staff", (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Staff.updateById = (id, staff, result) => {
  db.query(
    "UPDATE Staff SET fullName = ?, phone = ?, role = ?, salary = ?, isActive = ? WHERE idStaff = ?",
    [staff.fullName, staff.phone, staff.role, staff.salary, staff.isActive, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { id: id, ...staff });
    }
  );
};

Staff.updateLastLogin = (id, result) => {
  db.query(
    "UPDATE Staff SET lastLogin = NOW() WHERE idStaff = ?",
    [id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res);
    }
  );
};

Staff.remove = (id, result) => {
  db.query("DELETE FROM Staff WHERE idStaff = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, res);
  });
};

module.exports = Staff;

