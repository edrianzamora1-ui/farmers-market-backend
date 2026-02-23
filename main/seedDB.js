require("dotenv").config();
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Instinct2y",
  port: process.env.DB_PORT || 3307,
  database: "farmers_market"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to database");

  async function seedData() {
    try {
      // Sample Farmers
      const farmers = [
        {
          full_name: "Raj Kumar",
          email: "raj@farm.com",
          phone: "9876543210",
          location: "Punjab",
          password: "Farmer@123"
        },
        {
          full_name: "Priya Singh",
          email: "priya@farm.com",
          phone: "8765432109",
          location: "Haryana",
          password: "Farmer@123"
        },
        {
          full_name: "Arjun Patel",
          email: "arjun@farm.com",
          phone: "7654321098",
          location: "Gujarat",
          password: "Farmer@123"
        }
      ];

      // Sample Vendors
      const vendors = [
        {
          business_name: "Fresh Market Store",
          owner_name: "Arun Sharma",
          email: "arun@vendor.com",
          phone: "9988776655",
          location: "Delhi",
          password: "Vendor@123"
        },
        {
          business_name: "Green Grocery",
          owner_name: "Meera Kapoor",
          email: "meera@vendor.com",
          phone: "8877665544",
          location: "Mumbai",
          password: "Vendor@123"
        }
      ];

      // Insert Farmers
      console.log("\n🌾 Adding Farmers...");
      for (const farmer of farmers) {
        const hashedPassword = await bcrypt.hash(farmer.password, 10);
        await new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO farmers (full_name, email, phone, location, password, status) VALUES (?, ?, ?, ?, ?, ?)",
            [farmer.full_name, farmer.email, farmer.phone, farmer.location, hashedPassword, "active"],
            (err, result) => {
              if (err) reject(err);
              else {
                console.log(`✅ Added farmer: ${farmer.full_name} (ID: ${result.insertId})`);
                resolve(result.insertId);
              }
            }
          );
        });
      }

      // Get farmer IDs
      const farmerResults = await new Promise((resolve, reject) => {
        db.query("SELECT id FROM farmers ORDER BY id", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      const farmerIds = farmerResults.map(f => f.id);

      // Insert Vendors
      console.log("\n🏪 Adding Vendors...");
      for (const vendor of vendors) {
        const hashedPassword = await bcrypt.hash(vendor.password, 10);
        await new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO vendors (business_name, owner_name, email, phone, location, password, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [vendor.business_name, vendor.owner_name, vendor.email, vendor.phone, vendor.location, hashedPassword, "active"],
            (err, result) => {
              if (err) reject(err);
              else {
                console.log(`✅ Added vendor: ${vendor.business_name} (ID: ${result.insertId})`);
                resolve(result.insertId);
              }
            }
          );
        });
      }

      // Get vendor IDs
      const vendorResults = await new Promise((resolve, reject) => {
        db.query("SELECT id FROM vendors ORDER BY id", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      const vendorIds = vendorResults.map(v => v.id);

      // Sample Products for each farmer
      const products = [
        // Farmer 1
        { farmer_id: farmerIds[0], product_name: "Fresh Tomatoes", description: "Organic red tomatoes, farm fresh", price: 40, quantity: 100 },
        { farmer_id: farmerIds[0], product_name: "Green Peppers", description: "Capsicum green peppers", price: 60, quantity: 80 },
        { farmer_id: farmerIds[0], product_name: "Carrots", description: "Sweet orange carrots", price: 35, quantity: 120 },
        
        // Farmer 2
        { farmer_id: farmerIds[1], product_name: "Eggplant", description: "Purple brinjal", price: 50, quantity: 90 },
        { farmer_id: farmerIds[1], product_name: "Cucumbers", description: "Fresh crispy cucumbers", price: 30, quantity: 150 },
        { farmer_id: farmerIds[1], product_name: "Spinach", description: "Fresh leafy greens", price: 25, quantity: 200 },
        
        // Farmer 3
        { farmer_id: farmerIds[2], product_name: "Onions", description: "White onions", price: 30, quantity: 300 },
        { farmer_id: farmerIds[2], product_name: "Potatoes", description: "Golden potatoes", price: 25, quantity: 250 },
        { farmer_id: farmerIds[2], product_name: "Garlic", description: "Fresh garlic bulbs", price: 80, quantity: 50 }
      ];

      console.log("\n🥕 Adding Products...");
      for (const product of products) {
        await new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO products (farmer_id, product_name, description, price, quantity) VALUES (?, ?, ?, ?, ?)",
            [product.farmer_id, product.product_name, product.description, product.price, product.quantity],
            (err, result) => {
              if (err) reject(err);
              else {
                console.log(`✅ Added product: ${product.product_name} by farmer ${product.farmer_id}`);
                resolve(result.insertId);
              }
            }
          );
        });
      }

      // Get all products
      const productResults = await new Promise((resolve, reject) => {
        db.query("SELECT id FROM products ORDER BY id", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      const productIds = productResults.map(p => p.id);

      // Sample Orders
      const orders = [
        { vendor_id: vendorIds[0], product_id: productIds[0], quantity: 10, total_price: 400, status: "pending" },
        { vendor_id: vendorIds[0], product_id: productIds[1], quantity: 5, total_price: 300, status: "pending" },
        { vendor_id: vendorIds[1], product_id: productIds[3], quantity: 8, total_price: 400, status: "completed" },
        { vendor_id: vendorIds[1], product_id: productIds[6], quantity: 20, total_price: 600, status: "completed" }
      ];

      console.log("\n📦 Adding Sample Orders...");
      for (const order of orders) {
        await new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO orders (vendor_id, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)",
            [order.vendor_id, order.product_id, order.quantity, order.total_price, order.status],
            (err, result) => {
              if (err) reject(err);
              else {
                console.log(`✅ Added order: Vendor ${order.vendor_id} → Product ${order.product_id}`);
                resolve(result.insertId);
              }
            }
          );
        });
      }

      console.log("\n✅✅✅ SEEDING COMPLETE! ✅✅✅");
      console.log("\n🔑 Test Credentials:");
      console.log("\n👨‍🌾 Farmers:");
      console.log("  1. Email: raj@farm.com | Password: Farmer@123");
      console.log("  2. Email: priya@farm.com | Password: Farmer@123");
      console.log("  3. Email: arjun@farm.com | Password: Farmer@123");
      console.log("\n🏪 Vendors:");
      console.log("  1. Email: arun@vendor.com | Password: Vendor@123");
      console.log("  2. Email: meera@vendor.com | Password: Vendor@123");
      console.log("\n📊 Data Summary:");
      console.log("  ✓ 3 Farmers registered");
      console.log("  ✓ 2 Vendors registered");
      console.log("  ✓ 9 Products listed");
      console.log("  ✓ 4 Sample orders created\n");

      db.end();
      process.exit(0);
    } catch (error) {
      console.error("❌ Error:", error.message);
      db.end();
      process.exit(1);
    }
  }

  seedData();
});
