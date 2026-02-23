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

/* ===============================
   OTP VERIFICATION ROUTE
================================ */
app.post("/verify", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  // Simple validation: accept any 6-digit OTP
  if (otp.length !== 6 || isNaN(otp)) {
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }

  // In a real app, validate OTP from email service or database
  // For now, accept any valid 6-digit OTP
  res.status(200).json({
    message: "OTP verified successfully",
    verified: true
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
