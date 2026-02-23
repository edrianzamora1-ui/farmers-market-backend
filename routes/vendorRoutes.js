const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const authenticateToken = require("../middleware/authMiddleware");

// Public routes
router.post("/register", vendorController.registerVendor);
router.post("/login", vendorController.loginVendor);

// Protected routes
router.get("/orders", authenticateToken, vendorController.getVendorOrders);

module.exports = router;
