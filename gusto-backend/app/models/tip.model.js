const db = require("./db");

const Tip = function(tip) {
  this.tipDate = tip.tipDate;
  this.amount = tip.amount;
  this.orderId = tip.orderId || null;
  this.recordedBy = tip.recordedBy;
};

// Create new tip
Tip.create = (newTip, result) => {
  db.query("INSERT INTO Tips SET ?", newTip, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newTip });
  });
};

// Get all tips with filters
Tip.getAll = (filters, result) => {
  let query = `
    SELECT 
      t.*,
      s.fullName as recordedByName,
      o.orderNumber
    FROM Tips t
    LEFT JOIN Staff s ON t.recordedBy = s.idStaff
    LEFT JOIN Orders o ON t.orderId = o.idOrder
    WHERE 1=1
  `;

  const params = [];

  if (filters.startDate) {
    query += ` AND t.tipDate >= ?`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    query += ` AND t.tipDate <= ?`;
    params.push(filters.endDate);
  }

  if (filters.orderId) {
    query += ` AND t.orderId = ?`;
    params.push(filters.orderId);
  }

  query += ` ORDER BY t.tipDate DESC, t.createdAt DESC`;

  if (filters.limit) {
    query += ` LIMIT ?`;
    params.push(parseInt(filters.limit));
  }

  db.query(query, params, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

// Get tip by ID
Tip.findById = (id, result) => {
  const query = `
    SELECT 
      t.*,
      s.fullName as recordedByName,
      o.orderNumber
    FROM Tips t
    LEFT JOIN Staff s ON t.recordedBy = s.idStaff
    LEFT JOIN Orders o ON t.orderId = o.idOrder
    WHERE t.idTip = ?
  `;

  db.query(query, [id], (err, res) => {
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

// Update tip
Tip.updateById = (id, tip, result) => {
  db.query("UPDATE Tips SET ? WHERE idTip = ?", [tip, id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, { id: id, ...tip });
  });
};

// Delete tip
Tip.remove = (id, result) => {
  db.query("DELETE FROM Tips WHERE idTip = ?", [id], (err, res) => {
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

// Get tip summary by date range
Tip.getSummary = (startDate, endDate, result) => {
  const query = `
    SELECT 
      COALESCE(SUM(amount), 0) as totalTips,
      COUNT(*) as tipCount
    FROM Tips
    WHERE tipDate >= ? AND tipDate <= ?
  `;

  db.query(query, [startDate, endDate], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res[0]);
  });
};

module.exports = Tip;

