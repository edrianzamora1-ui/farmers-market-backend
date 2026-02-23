const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authenticateToken = require("../middleware/authMiddleware");

// Get orders (protected)
// Get orders (protected) - Controller handles role logic
router.get("/", authenticateToken, (req, res) => {
    if (req.user.role === 'farmer') {
        return orderController.getFarmerOrders(req, res);
    } else {
        return orderController.getVendorOrders(req, res);
    }
});

// Create order (protected)
router.post("/", authenticateToken, orderController.createOrder);

// Update order status (Farmer only)
router.put("/:id/status", authenticateToken, orderController.updateOrderStatus);

module.exports = router;
