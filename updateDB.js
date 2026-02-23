require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Instinct2y",
    database: process.env.DB_NAME || "farmers_market",
    port: process.env.DB_PORT || 3307,
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error("❌ Connection failed:", err);
        process.exit(1);
    }
    console.log("✅ Connected to MySQL");

    const alterQueries = [
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS harvest_date DATE;",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_days INT;",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS freshness_score INT;",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2);",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS freshness_status ENUM('Fresh', 'Aging', 'Old') DEFAULT 'Fresh';",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_quantity INT DEFAULT 0;"
    ];

    let completed = 0;
    alterQueries.forEach(query => {
        db.query(query, (err) => {
            if (err) {
                // Ignore "Duplicate column name" error code 1060 if logic above fails
                if (err.code !== 'ER_DUP_FIELDNAME') {
                    console.error("⚠️ Error altering table (might already exist):", err.message);
                }
            } else {
                console.log("✅ Column checked/added");
            }
            completed++;
            if (completed === alterQueries.length) {
                console.log("✅ Schema update complete");
                db.end();
                process.exit(0);
            }
        });
    });
});
