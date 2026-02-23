const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

// Register Vendor
exports.registerVendor = async (req, res) => {
  const { business_name, owner_name, email, phone, location, password } = req.body;

  if (!business_name || !owner_name || !email || !phone || !location || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO vendors
      (business_name, owner_name, email, phone, location, password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [business_name, owner_name, email, phone, location, hashedPassword, "active"],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        res.status(201).json({
          message: "Vendor registered successfully",
          vendorId: result.insertId
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login Vendor
exports.loginVendor = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const sql = "SELECT * FROM vendors WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Vendor not found" });
    }

    const vendor = results[0];

    const isMatch = await bcrypt.compare(password, vendor.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: vendor.id, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Vendor login successful",
      token
    });
  });
};

// Get Vendor Orders
exports.getVendorOrders = (req, res) => {
  const vendorId = req.user.id;

  const sql = `
    SELECT 
      orders.id,
      products.product_name,
      orders.quantity,
      orders.total_price,
      orders.status,
      orders.created_at
    FROM orders
    JOIN products ON orders.product_id = products.id
    WHERE orders.vendor_id = ?
    ORDER BY orders.created_at DESC
  `;

  db.query(sql, [vendorId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({
      message: "Vendor order history retrieved",
      orders: results
    });
  });
};
