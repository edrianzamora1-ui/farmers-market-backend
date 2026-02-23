require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Instinct2y",
    database: process.env.DB_NAME || "farmers_market",
    port: process.env.DB_PORT || 3307
});

db.connect((err) => {
    if (err) {
        console.error("❌ Connection failed:", err);
        process.exit(1);
    }
    console.log("✅ Connected to MySQL");

    const sql = `
    CREATE TABLE IF NOT EXISTS messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

    db.query(sql, (err) => {
        if (err) {
            console.error("❌ Error creating table:", err);
        } else {
            console.log("✅ 'messages' table created/verified");
        }
        db.end();
        process.exit(0);
    });
});
