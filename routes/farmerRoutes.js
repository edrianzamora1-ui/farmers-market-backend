const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmerController");
const authenticateToken = require("../middleware/authMiddleware");

// Public routes
router.post("/register", farmerController.registerFarmer);
router.post("/login", farmerController.loginFarmer);
router.get("/", farmerController.getAllFarmers);
router.get("/list", farmerController.getAllFarmers); // Keep for backward compatibility

// Protected routes
router.get("/orders", authenticateToken, farmerController.getFarmerOrders);
router.get("/revenue", authenticateToken, farmerController.getFarmerRevenue);

module.exports = router;
