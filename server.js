require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routes
const farmerRoutes = require("./routes/farmerRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes"); // Import cart routes

const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve uploaded images

/* ===============================
   DATABASE CONNECTION
================================ */
const db = require("./db");

/* ===============================
   TEST ROUTE
================================ */
app.get("/", (req, res) => {
  res.send("🚜 Farmers Market API Running");
});

app.post("/verify", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  // 1. Check OTP in database
  const sqlCheck = `
    SELECT * FROM otp_verifications 
    WHERE email = ? AND otp = ? AND verified = FALSE
    ORDER BY created_at DESC LIMIT 1
  `;

  db.query(sqlCheck, [email, otp], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid or already used OTP" });
    }

    const verification = results[0];

    // 2. Check Expiration
    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // 3. Mark OTP as verified
    db.query("UPDATE otp_verifications SET verified = TRUE WHERE id = ?", [verification.id], (err) => {
      if (err) console.error("❌ Error updating verification status:", err);
    });

    // 4. Activate User (Update both tables to handle users with both roles)
    const updateFarmer = new Promise((resolve) => {
      db.query("UPDATE farmers SET status = 'active' WHERE email = ?", [email], (err, result) => {
        if (err) console.error("❌ Error activating farmer:", err);
        resolve(result && result.affectedRows > 0);
      });
    });

    const updateVendor = new Promise((resolve) => {
      db.query("UPDATE vendors SET status = 'active' WHERE email = ?", [email], (err, result) => {
        if (err) console.error("❌ Error activating vendor:", err);
        resolve(result && result.affectedRows > 0);
      });
    });

    Promise.all([updateFarmer, updateVendor]).then(([isFarmer, isVendor]) => {
      if (isFarmer || isVendor) {
        return res.status(200).json({
          message: `Account verified and activated successfully! (${isFarmer ? 'Farmer' : ''}${isFarmer && isVendor ? ' & ' : ''}${isVendor ? 'Vendor' : ''})`,
          verified: true
        });
      } else {
        res.status(404).json({ message: "User account not found for activation" });
      }
    });
  });
});

/* ===============================
   ROUTES
================================ */
app.use("/farmers", farmerRoutes);
app.use("/vendors", vendorRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/cart", cartRoutes); // Register cart routes

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
