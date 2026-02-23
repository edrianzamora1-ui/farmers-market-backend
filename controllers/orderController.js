const db = require("../db");

// Get Farmer Orders (Orders containing farmer's products)
exports.getFarmerOrders = (req, res) => {
  if (req.user.role !== "farmer") {
    return res.status(403).json({ message: "Only farmers can view their sales" });
  }

  const sql = `
    SELECT 
      orders.id,
      products.product_name as productName,
      orders.quantity,
      orders.total_price as totalPrice,
      orders.status,
      orders.created_at as createdAt,
      orders.delivery_address as deliveryAddress,
      orders.payment_method as paymentMethod,
      orders.order_notes as orderNotes,
      v.owner_name as buyerName
    FROM orders
    JOIN products ON orders.product_id = products.id
    JOIN vendors v ON orders.vendor_id = v.id
    WHERE products.farmer_id = ?
    ORDER BY orders.created_at DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({
      message: "Sales history retrieved",
      orders: results
    });
  });
};

// Get Vendor Orders (note: This is now moved to vendorController, but keeping as reference)
exports.getVendorOrders = (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Only vendors can view their orders" });
  }

  const sql = `
    SELECT 
      orders.id,
      products.product_name as productName,
      orders.quantity,
      orders.total_price as totalPrice,
      orders.status,
      orders.created_at as createdAt,
      orders.delivery_address as deliveryAddress,
      orders.payment_method as paymentMethod,
      orders.order_notes as orderNotes,
      f.full_name as farmerName
    FROM orders
    JOIN products ON orders.product_id = products.id
    JOIN farmers f ON products.farmer_id = f.id
    WHERE orders.vendor_id = ?
    ORDER BY orders.created_at DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({
      message: "Order history retrieved",
      orders: results
    });
  });
};

// Create Order (Direct Purchase)
exports.createOrder = (req, res) => {
  const vendor_id = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ message: "Product ID and quantity are required" });
  }

  // 1. Get Product Details
  const getProductSql = "SELECT * FROM products WHERE id = ?";
  db.query(getProductSql, [productId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Product not found" });

    const product = results[0];

    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // 2. Calculate Total Price (Apply discount if exists)
    const price = product.discount_price || product.price;
    const total_price = price * quantity;

    // 3. Create Order
    const createOrderSql = `
      INSERT INTO orders (vendor_id, product_id, quantity, total_price, status)
      VALUES (?, ?, ?, ?, 'pending')
    `;

    db.query(createOrderSql, [vendor_id, productId, quantity, total_price], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error creating order" });

      // 4. Update Product Quantity
      const updateProductSql = "UPDATE products SET quantity = quantity - ? WHERE id = ?";
      db.query(updateProductSql, [quantity, productId], (err) => {
        if (err) console.error("Error updating stock:", err); // Non-fatal, but serious

        res.status(201).json({
          message: "Order placed successfully",
          orderId: result.insertId
        });
      });
    });
  });
};

// Update Order Status (Farmer only)
exports.updateOrderStatus = (req, res) => {
  if (req.user.role !== "farmer") {
    return res.status(403).json({ message: "Only farmers can update order status" });
  }

  const farmerId = req.user.id;
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  const allowedStatuses = new Set([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "completed",
  ]);

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  // Ensure the order belongs to this farmer (via product ownership)
  const ownershipSql = `
    SELECT orders.id
    FROM orders
    JOIN products ON orders.product_id = products.id
    WHERE orders.id = ? AND products.farmer_id = ?
    LIMIT 1
  `;

  db.query(ownershipSql, [orderId, farmerId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updateSql = "UPDATE orders SET status = ? WHERE id = ?";
    db.query(updateSql, [status, orderId], (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ message: "Database error" });
      }

      return res.json({
        message: "Order status updated",
        id: Number(orderId),
        status,
      });
    });
  });
};
