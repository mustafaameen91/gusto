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

Staff.ROLES = ["admin", "supervisor", "cashier", "kitchen", "waiter", "purchases", "storage"];

// Updates the editable fields; a new password is hashed and saved only when one is given
Staff.updateById = (id, staff, result) => {
  const fields = { fullName: staff.fullName, phone: staff.phone, role: staff.role, salary: staff.salary, isActive: staff.isActive };
  if (staff.email !== undefined) fields.email = staff.email;
  if (staff.hireDate) fields.hireDate = String(staff.hireDate).slice(0, 10);
  if (staff.password) fields.password = require("bcryptjs").hashSync(staff.password, 10);
  Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
  db.query(
    "UPDATE Staff SET ? WHERE idStaff = ?",
    [fields, id],
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

// Someone with orders, shifts or other records is deactivated instead of deleted,
// so the history keeps its names; only an unused account is really deleted
Staff.remove = (id, result) => {
  db.query(
    `SELECT (SELECT COUNT(*) FROM Orders WHERE cashierId = ?) + (SELECT COUNT(*) FROM DailyReceipts WHERE openedBy = ? OR closedBy = ?)
          + (SELECT COUNT(*) FROM Expenses WHERE recordedBy = ?) + (SELECT COUNT(*) FROM Purchases WHERE createdBy = ?) AS uses`,
    [id, id, id, id, id],
    (errUse, rows) => {
      if (errUse) return result(errUse, null);
      if (Number(rows[0].uses) > 0) {
        return db.query("UPDATE Staff SET isActive = 0 WHERE idStaff = ?", [id], (errD, r) => {
          if (errD) return result(errD, null);
          if (!r.affectedRows) return result({ kind: "not_found" }, null);
          result(null, { deactivated: true });
        });
      }
      deleteStaff();
    }
  );
  const deleteStaff = () => db.query("DELETE FROM Staff WHERE idStaff = ?", [id], (err, res) => {
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

