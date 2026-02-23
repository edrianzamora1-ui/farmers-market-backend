const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authenticateToken = require("../middleware/authMiddleware");

// Add product (protected - farmers only)
// Add product (protected - farmers only, with image upload)
router.post("/", authenticateToken, productController.uploadMiddleware, productController.addProduct);

// Get all products (public)
router.get("/", productController.getAllProducts);

module.exports = router;
