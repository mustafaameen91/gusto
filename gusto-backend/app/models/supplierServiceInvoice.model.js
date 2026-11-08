const db = require("./db");

// Create service invoice with items (multi-service per invoice)
function create(invoice, items, createdBy, result) {
  const inv = {
    supplierId: invoice.supplierId,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate || null,
    notes: invoice.notes || null,
    createdBy: createdBy || null
  };
  db.query("INSERT INTO SupplierServiceInvoices SET ?", inv, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    const invoiceId = res.insertId;
    if (!items || items.length === 0) {
      result(null, { id: invoiceId, ...inv, items: [] });
      return;
    }
    const placeholders = items.map(() => "(?, ?, ?)").join(", ");
    const values = items.flatMap((it) => [invoiceId, (it.description || "").trim(), parseFloat(it.amount)]);
    db.query(
      `INSERT INTO SupplierServiceInvoiceItems (invoiceId, description, amount) VALUES ${placeholders}`,
      values,
      (err2) => {
        if (err2) {
          result(err2, null);
          return;
        }
        result(null, { id: invoiceId, ...inv, items });
      }
    );
  });
}

// Get all service invoices for a supplier (with total from items)
function getBySupplier(supplierId, result) {
  const query = `
    SELECT 
      i.idSupplierServiceInvoice AS idSupplierServiceInvoice,
      i.supplierId,
      i.invoiceDate,
      i.dueDate,
      i.notes,
      i.createdAt,
      i.createdBy,
      (SELECT COALESCE(SUM(it.amount), 0) FROM SupplierServiceInvoiceItems it WHERE it.invoiceId = i.idSupplierServiceInvoice) AS totalAmount
    FROM SupplierServiceInvoices i
    WHERE i.supplierId = ?
    ORDER BY i.invoiceDate DESC, i.createdAt DESC
  `;
  db.query(query, [supplierId], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    if (!rows || rows.length === 0) {
      result(null, []);
      return;
    }
    const invoiceIds = rows.map((r) => r.idSupplierServiceInvoice);
    const placeholders = invoiceIds.map(() => "?").join(",");
    db.query(
      `SELECT idSupplierServiceInvoiceItem AS id, invoiceId, description, amount FROM SupplierServiceInvoiceItems WHERE invoiceId IN (${placeholders}) ORDER BY invoiceId, idSupplierServiceInvoiceItem`,
      invoiceIds,
      (err2, itemRows) => {
        if (err2) {
          result(err2, null);
          return;
        }
        const byInvoice = {};
        (itemRows || []).forEach((it) => {
          if (!byInvoice[it.invoiceId]) byInvoice[it.invoiceId] = [];
          byInvoice[it.invoiceId].push(it);
        });
        const list = rows.map((r) => ({
          ...r,
          items: byInvoice[r.idSupplierServiceInvoice] || []
        }));
        result(null, list);
      }
    );
  });
}

// Get one invoice by id with items (for edit)
function getById(invoiceId, result) {
  db.query(
    "SELECT * FROM SupplierServiceInvoices WHERE idSupplierServiceInvoice = ?",
    [invoiceId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      if (!rows || rows.length === 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      const inv = rows[0];
      db.query(
        "SELECT idSupplierServiceInvoiceItem AS id, invoiceId, description, amount FROM SupplierServiceInvoiceItems WHERE invoiceId = ? ORDER BY idSupplierServiceInvoiceItem",
        [invoiceId],
        (err2, itemRows) => {
          if (err2) {
            result(err2, null);
            return;
          }
          result(null, { ...inv, items: itemRows || [] });
        }
      );
    }
  );
}

// Update invoice and replace items
function update(invoiceId, invoice, items, result) {
  db.query(
    "UPDATE SupplierServiceInvoices SET invoiceDate = ?, dueDate = ?, notes = ? WHERE idSupplierServiceInvoice = ?",
    [invoice.invoiceDate, invoice.dueDate || null, invoice.notes || null, invoiceId],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows === 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      db.query("DELETE FROM SupplierServiceInvoiceItems WHERE invoiceId = ?", [invoiceId], (err2) => {
        if (err2) {
          result(err2, null);
          return;
        }
        if (!items || items.length === 0) {
          result(null, { id: invoiceId });
          return;
        }
        const placeholders = items.map(() => "(?, ?, ?)").join(", ");
        const values = items.flatMap((it) => [invoiceId, (it.description || "").trim(), parseFloat(it.amount)]);
        db.query(
          `INSERT INTO SupplierServiceInvoiceItems (invoiceId, description, amount) VALUES ${placeholders}`,
          values,
          (err3) => {
            if (err3) result(err3, null);
            else result(null, { id: invoiceId });
          }
        );
      });
    }
  );
}

// Delete invoice (cascade deletes items)
function remove(invoiceId, result) {
  db.query("DELETE FROM SupplierServiceInvoices WHERE idSupplierServiceInvoice = ?", [invoiceId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows === 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, true);
  });
}

// Total service debt for a supplier (sum of all invoice totals)
function getTotalServiceDebtBySupplier(supplierId, result) {
  const query = `
    SELECT COALESCE(SUM(t.totalAmount), 0) AS totalServiceDebt
    FROM (
      SELECT i.idSupplierServiceInvoice,
        (SELECT COALESCE(SUM(it.amount), 0) FROM SupplierServiceInvoiceItems it WHERE it.invoiceId = i.idSupplierServiceInvoice) AS totalAmount
      FROM SupplierServiceInvoices i
      WHERE i.supplierId = ?
    ) t
  `;
  db.query(query, [supplierId], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, parseFloat(rows[0]?.totalServiceDebt || 0));
  });
}

module.exports = {
  create,
  getBySupplier,
  getById,
  update,
  remove,
  getTotalServiceDebtBySupplier
};
