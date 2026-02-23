const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const emailService = require("../utils/emailService");

// Register Vendor
exports.registerVendor = async (req, res) => {
  const { business_name, owner_name, email, phone, location, password } = req.body;

  if (!business_name || !owner_name || !email || !phone || !location || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const sqlVendor = `
      INSERT INTO vendors
      (business_name, owner_name, email, phone, location, password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sqlVendor,
      [business_name, owner_name, email, phone, location, hashedPassword, "pending"],
      async (err, result) => {
        if (err) {
          console.error(err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Email already registered" });
          }
          return res.status(500).json({ message: "Database error" });
        }

        // 2. Store OTP
        const sqlOTP = `
          INSERT INTO otp_verifications (email, otp, expires_at)
          VALUES (?, ?, ?)
        `;

        db.query(sqlOTP, [email, otp, expiresAt], async (err) => {
          if (err) {
            console.error("❌ Error storing OTP:", err);
          }

          // 3. Send Email
          try {
            await emailService.sendOTP(email, otp);
            res.status(201).json({
              message: "Vendor registered successfully. Please verify your email.",
              vendorId: result.insertId,
              email: email
            });
          } catch (emailErr) {
            console.error("❌ Email sending failed:", emailErr);
            res.status(201).json({
              message: "Vendor registered, but email failed to send.",
              vendorId: result.insertId,
              email: email
            });
          }
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

    // Check account status
    if (vendor.status !== "active") {
      return res.status(403).json({
        message: "Account not verified. Please check your email for the OTP.",
        verified: false
      });
    }

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
