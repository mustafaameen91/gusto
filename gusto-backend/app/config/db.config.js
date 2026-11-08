require("dotenv").config();

module.exports = {
  HOST: process.env.host || process.env.DB_HOST || "localhost",
  USER: process.env.user || process.env.DB_USER || "root",
  PASSWORD: process.env.password || process.env.DB_PASSWORD || "",
  DB: process.env.DB_NAME || process.env.db || "gusto_db",
  PORT: process.env.port || process.env.DB_PORT || 3306,
};

