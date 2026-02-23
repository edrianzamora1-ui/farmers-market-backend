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
    console.log("✅ Connected");

    db.query("DESCRIBE products", (err, results) => {
        if (err) {
            console.error("❌ Error describing table:", err);
        } else {
            console.log("📋 Products Table Columns:");
            console.table(results);
        }
        db.end();
    });
});
