const db = require("../db");

// Add Item to Cart
exports.addToCart = (req, res) => {
    const vendor_id = req.user.id;
    const { productId, quantity, unitType } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ message: "Product ID and quantity are required" });
    }

    const raw = (unitType != null && unitType !== '') ? String(unitType).trim() : 'kg';
    const chosenUnit = raw.toLowerCase();
    const allowedUnits = new Set(['kg', 'each', 'sack']);
    if (!allowedUnits.has(chosenUnit)) {
        return res.status(400).json({ message: "Invalid unit type. Use kg, each, or sack." });
    }

    // First, ensure the product exists (and we could validate prices here if needed)
    const productSql = "SELECT id FROM products WHERE id = ?";
    db.query(productSql, [productId], (err, productRows) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (!productRows || productRows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if item with same unit already exists in cart
        const checkSql = "SELECT * FROM cart_items WHERE vendor_id = ? AND product_id = ? AND unit_type = ?";
        db.query(checkSql, [vendor_id, productId, chosenUnit], (err, results) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (results.length > 0) {
                // Update quantity
                const newQuantity = results[0].quantity + parseInt(quantity, 10);
                const updateSql = "UPDATE cart_items SET quantity = ? WHERE id = ?";
                db.query(updateSql, [newQuantity, results[0].id], (err) => {
                    if (err) return res.status(500).json({ message: "Database error" });
                    return res.json({ message: "Cart updated successfully" });
                });
            } else {
                // Insert new item
                const insertSql = "INSERT INTO cart_items (vendor_id, product_id, quantity, unit_type) VALUES (?, ?, ?, ?)";
                db.query(insertSql, [vendor_id, productId, quantity, chosenUnit], (err) => {
                    if (err) return res.status(500).json({ message: "Database error" });
                    return res.status(201).json({ message: "Item added to cart" });
                });
            }
        });
    });
};

// Get Cart Items
exports.getCart = (req, res) => {
    const vendor_id = req.user.id;
    const sql = `
    SELECT
      c.id,
      c.product_id,
      c.quantity,
      c.unit_type,
      p.product_name,
      p.price,
      p.price_each,
      p.price_kg,
      p.price_sack,
      p.image_url,
      f.full_name as farmer_name
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    JOIN farmers f ON p.farmer_id = f.id
    WHERE c.vendor_id = ?
  `;

    db.query(sql, [vendor_id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        const mapped = results.map((row) => {
            const unitType = (row.unit_type || 'kg').toLowerCase();
            let unitPrice;
            if (unitType === 'each') {
                unitPrice = row.price_each || row.price;
            } else if (unitType === 'sack') {
                unitPrice = row.price_sack || row.price;
            } else {
                unitPrice = row.price_kg || row.price;
            }

            const total_price = Number(unitPrice || 0) * row.quantity;

            return {
                ...row,
                unit_type: unitType,
                unit_price: unitPrice,
                total_price
            };
        });

        res.json(mapped);
    });
};

// Remove Item from Cart
exports.removeFromCart = (req, res) => {
    const vendor_id = req.user.id;
    const { id } = req.params;

    const sql = "DELETE FROM cart_items WHERE id = ? AND vendor_id = ?";
    db.query(sql, [id, vendor_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: "Item removed from cart" });
    });
};

// Checkout (Create Orders from Cart)
exports.checkout = (req, res) => {
    const vendor_id = req.user.id;
    const { paymentMethod, deliveryAddress, orderNotes } = req.body;

    // 1. Get all cart items
    const getCartSql = `
    SELECT
      c.product_id,
      c.quantity,
      c.unit_type,
      p.price,
      p.price_each,
      p.price_kg,
      p.price_sack,
      p.farmer_id,
      p.quantity as stock,
      p.product_name
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.vendor_id = ?
  `;

    db.query(getCartSql, [vendor_id], (err, cartItems) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });

        // 2. Validate Stock
        for (const item of cartItems) {
            if (item.quantity > item.stock) {
                return res.status(400).json({
                    message: `Insufficient stock for ${item.product_name}. Available: ${item.stock}`
                });
            }
        }

        // 3. Create orders for each item
        const createOrderSql = `
      INSERT INTO orders (vendor_id, product_id, quantity, total_price, payment_method, delivery_address, order_notes, status)
      VALUES ?
    `;

        const orderValues = cartItems.map(item => {
            const unitType = (item.unit_type || 'kg').toLowerCase();
            let unitPrice;
            if (unitType === 'each') {
                unitPrice = item.price_each || item.price;
            } else if (unitType === 'sack') {
                unitPrice = item.price_sack || item.price;
            } else {
                unitPrice = item.price_kg || item.price;
            }

            const totalPrice = Number(unitPrice || 0) * item.quantity;

            return [
                vendor_id,
                item.product_id,
                item.quantity,
                totalPrice,
                paymentMethod || 'COD',
                deliveryAddress || '',
                orderNotes || '',
                'pending'
            ];
        });

        db.query(createOrderSql, [orderValues], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Error creating orders" });
            }

            // 4. Clear cart
            db.query("DELETE FROM cart_items WHERE vendor_id = ?", [vendor_id], (err) => {
                if (err) console.error("Error clearing cart", err);

                // 5. Update product quantities
                // Note: In a production app, use transactions to ensure data integrity
                cartItems.forEach(item => {
                    db.query("UPDATE products SET quantity = quantity - ? WHERE id = ?", [item.quantity, item.product_id]);
                });

                res.json({ message: "Checkout successful! Orders created." });
            });
        });
    });
};
