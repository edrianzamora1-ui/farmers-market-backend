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

    const updates = [
        "ALTER TABLE products ADD COLUMN image_url VARCHAR(255)",
        "ALTER TABLE products ADD COLUMN harvest_date DATE",
        "ALTER TABLE products ADD COLUMN expiry_days INT",
        "ALTER TABLE products ADD COLUMN freshness_score INT",
        "ALTER TABLE products ADD COLUMN discount_price DECIMAL(10, 2)",
        "ALTER TABLE products ADD COLUMN freshness_status ENUM('Fresh', 'Aging', 'Old') DEFAULT 'Fresh'",
        "ALTER TABLE products ADD COLUMN reserved_quantity INT DEFAULT 0"
    ];

    let completed = 0;

    function runUpdate(index) {
        if (index >= updates.length) {
            console.log("✅ All executable updates processed.");
            db.end();
            process.exit(0);
            return;
        }

        const query = updates[index];
        db.query(query, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column already exists (skipped): ${query.split(' ')[5]}`);
                } else {
                    console.error(`⚠️ Error running query: ${query}`, err.message);
                }
            } else {
                console.log(`✅ Success: ${query}`);
            }
            runUpdate(index + 1);
        });
    }

    runUpdate(0);
});
