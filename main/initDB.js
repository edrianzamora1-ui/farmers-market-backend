require("dotenv").config();
const mysql = require("mysql2");

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3307,
  multipleStatements: true // Enable multiple statements for running migration scripts if needed
});

db.connect((err) => {
  if (err) {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL");

  // Create database
  const createDB = `CREATE DATABASE IF NOT EXISTS farmers_market;`;
  db.query(createDB, (err) => {
    if (err) {
      console.error("❌ Error creating database:", err);
      process.exit(1);
    }
    console.log("✅ Database created/exists");

    // Switch to database
    db.changeUser({ database: "farmers_market" }, (err) => {
      if (err) {
        console.error("❌ Error switching database:", err);
        process.exit(1);
      }
      console.log("✅ Switched to farmers_market database");

      // Create tables
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
              quantity INT DEFAULT 0,
              harvest_date DATE,
              expiry_days INT,
              freshness_score INT,
              discount_price DECIMAL(10, 2),
              freshness_status ENUM('Fresh', 'Aging', 'Old') DEFAULT 'Fresh',
              reserved_quantity INT DEFAULT 0,
              image_url VARCHAR(255),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
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
        },
        {
          name: "cart_items",
          sql: `
            CREATE TABLE IF NOT EXISTS cart_items (
              id INT PRIMARY KEY AUTO_INCREMENT,
              vendor_id INT NOT NULL,
              product_id INT NOT NULL,
              quantity INT NOT NULL DEFAULT 1,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
              FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
          `
        },
        {
          name: "orders",
          sql: `
            CREATE TABLE IF NOT EXISTS orders(
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
              FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
              FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
            )
          `
        }
      ];

      // Create all tables
      let completed = 0;
      tables.forEach(table => {
        db.query(table.sql, (err) => {
          if (err) {
            console.error(`❌ Error creating ${table.name} table: `, err);
          } else {
            console.log(`✅ Table '${table.name}' created / exists`);
          }
          completed++;
          if (completed === tables.length) {
            console.log("\n✅ Database initialization complete!");
            console.log("📋 You can now:");
            console.log("   1. Go to http://localhost:3001");
            console.log("   2. Register a new account");
            console.log("   3. Verify OTP (any 6 digits)");
            console.log("   4. Login");
            console.log("   5. Access dashboard\n");
            db.end();
            process.exit(0);
          }
        });
      });
    });
  });
});
