const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "mysql-b4c9296-edrianzamora1-4e69.c.aivencloud.com",
    user: "avnadmin",
    password: "AVNS_jVQYavMK5zpjtCWmkVk",
    port: 15155,
    database: "defaultdb",
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) {
        console.error("❌ Connection failed:", err);
        process.exit(1);
    }
    console.log("✅ Connected to Aiven MySQL");

    const tables = [
        {
            name: "farmers",
            sql: `
        CREATE TABLE IF NOT EXISTS farmers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20) NOT NULL,
          location VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
        },
        {
            name: "vendors",
            sql: `
        CREATE TABLE IF NOT EXISTS vendors (
          id INT PRIMARY KEY AUTO_INCREMENT,
          business_name VARCHAR(255) NOT NULL,
          owner_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20) NOT NULL,
          location VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
        },
        {
            name: "products",
            sql: `
        CREATE TABLE IF NOT EXISTS products (
          id INT PRIMARY KEY AUTO_INCREMENT,
          farmer_id INT NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          price_each DECIMAL(10, 2),
          price_kg DECIMAL(10, 2),
          price_sack DECIMAL(10, 2),
          quantity INT DEFAULT 0,
          harvest_date DATE,
          expiry_days INT,
          freshness_score INT,
          discount_price DECIMAL(10, 2),
          freshness_status ENUM('Fresh', 'Aging', 'Old') DEFAULT 'Fresh',
          image_url VARCHAR(255),
          unit_type VARCHAR(50) DEFAULT 'kg',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
        )
      `
        },
        {
            name: "cart_items",
            sql: `
        CREATE TABLE IF NOT EXISTS cart_items (
          id INT PRIMARY KEY AUTO_INCREMENT,
          vendor_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          unit_type VARCHAR(50) DEFAULT 'kg',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `
        },
        {
            name: "orders",
            sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id INT PRIMARY KEY AUTO_INCREMENT,
          vendor_id INT,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'COD',
          delivery_address TEXT,
          delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
          order_notes TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
        )
      `
        },
        {
            name: "market_prices",
            sql: `
        CREATE TABLE IF NOT EXISTS market_prices (
          id INT PRIMARY KEY AUTO_INCREMENT,
          product_name VARCHAR(255) NOT NULL,
          average_price DECIMAL(10, 2) NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `
        },
        {
            name: "demand_signals",
            sql: `
        CREATE TABLE IF NOT EXISTS demand_signals (
          id INT PRIMARY KEY AUTO_INCREMENT,
          product_category VARCHAR(255) NOT NULL,
          demand_level ENUM('High', 'Medium', 'Low') NOT NULL,
          trend ENUM('Rising', 'Stable', 'Falling') NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `
        }
    ];

    let completed = 0;
    tables.forEach(table => {
        db.query(table.sql, (err) => {
            if (err) {
                console.error(`❌ Error creating ${table.name}:`, err.message);
            } else {
                console.log(`✅ Created/Verified: ${table.name}`);
            }
            completed++;
            if (completed === tables.length) {
                console.log("\n✅✅✅ REMOTE DATABASE INITIALIZATION COMPLETE! ✅✅✅");
                db.end();
                process.exit(0);
            }
        });
    });
});
