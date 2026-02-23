require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "farmers_market",
  port: process.env.DB_PORT || 3307,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : null
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database on port " + (process.env.DB_PORT || 3307));
  }
});

module.exports = db;