const mysql = require("mysql2");
const dbConfig = require("../config/db.config.js");

// Create connection pool
const connection = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  port: dbConfig.PORT,
  multipleStatements: true,
  // DATE columns as 'YYYY-MM-DD' text; as JS Dates they shift to the previous day in UTC
  dateStrings: ["DATE"],
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// MySQL uses the same clock as the app: NOW() and CURRENT_TIMESTAMP in the restaurant's
// time zone, even when the database server itself runs in UTC.
const tzOffset = () => {
  const m = -new Date().getTimezoneOffset();
  const sign = m >= 0 ? "+" : "-";
  return `${sign}${String(Math.floor(Math.abs(m) / 60)).padStart(2, "0")}:${String(Math.abs(m) % 60).padStart(2, "0")}`;
};
connection.on("connection", (conn) => {
  conn.query("SET time_zone = ?", [tzOffset()]);
});

// Test connection
connection.getConnection((error, conn) => {
  if (error) {
    console.error("❌ Database connection error:", error.message);
    if (error.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (error.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (error.code === "ECONNREFUSED") {
      console.error("Database connection was refused.");
    }
  } else {
    console.log("✅ Successfully connected to MySQL database:", dbConfig.DB);
    conn.release();
  }
});

// Handle connection errors
connection.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection lost. Reconnecting...');
  }
});

module.exports = connection;

