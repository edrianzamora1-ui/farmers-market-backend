require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3307
});

db.connect((err) => {
  if (err) {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL");

  // Switch to database
  db.changeUser({ database: "farmers_market" }, (err) => {
    if (err) {
      console.error("❌ Error switching database:", err);
      process.exit(1);
    }
    console.log("✅ Switched to farmers_market database");

    // Disable foreign key checks
    db.query("SET FOREIGN_KEY_CHECKS = 0", (err) => {
      if (err) {
        console.error("❌ Error disabling FK checks:", err);
        process.exit(1);
      }
      console.log("✅ Foreign key checks disabled");

      const tablesToDrop = [
        "cart_items",
        "orders",
        "products",
        "vendors",
        "farmers",
        "market_prices",
        "demand_signals"
      ];

      let droppedCount = 0;
      tablesToDrop.forEach((table) => {
        db.query(`DROP TABLE IF EXISTS ${table}`, (err) => {
          if (err) {
            console.error(`❌ Error dropping ${table}:`, err);
          } else {
            console.log(`✅ Dropped: ${table}`);
          }
          droppedCount++;
          if (droppedCount === tablesToDrop.length) {
            console.log("\n✅ All old tables removed");
            createTables();
          }
        });
      });
    });
  });
});

function createTables() {
  const tables = [
    {
      name: "farmers",
      sql: `
        CREATE TABLE farmers (
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
        CREATE TABLE vendors (
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
        CREATE TABLE products (
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
        CREATE TABLE cart_items (
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
        CREATE TABLE orders (
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
        CREATE TABLE market_prices (
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
        CREATE TABLE demand_signals (
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
        process.exit(1);
      } else {
        console.log(`✅ Created: ${table.name}`);
      }
      completed++;
      if (completed === tables.length) {
        db.query("SET FOREIGN_KEY_CHECKS = 1", (err) => {
          if (err) {
            console.error("❌ Error enabling FK checks:", err);
          } else {
            console.log("✅ Foreign key checks re-enabled");
          }

          console.log("\n✅✅✅ DATABASE RESET COMPLETE! ✅✅✅");
          db.end();
          process.exit(0);
        });
      }
    });
  });
}
