const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authenticateToken = require("../middleware/authMiddleware");

// All cart routes are protected
router.use(authenticateToken);

router.post("/add", cartController.addToCart);
router.get("/", cartController.getCart);
router.delete("/:id", cartController.removeFromCart);
router.post("/checkout", cartController.checkout);

module.exports = router;
