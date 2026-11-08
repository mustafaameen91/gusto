const db = require("./db");

const StorageLocation = {};

StorageLocation.getAll = (result) => {
  db.query(
    "SELECT * FROM StorageLocations WHERE isActive = 1 ORDER BY idStorageLocation",
    [],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, rows);
    }
  );
};

StorageLocation.findById = (id, result) => {
  db.query(
    "SELECT * FROM StorageLocations WHERE idStorageLocation = ?",
    [id],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      if (!rows || rows.length === 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, rows[0]);
    }
  );
};

StorageLocation.findByCode = (code, result) => {
  db.query(
    "SELECT * FROM StorageLocations WHERE code = ? AND isActive = 1",
    [code],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      if (!rows || rows.length === 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, rows[0]);
    }
  );
};

module.exports = StorageLocation;
