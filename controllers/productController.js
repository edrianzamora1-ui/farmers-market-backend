const db = require("../db");
const multer = require("multer");
const path = require("path");

// Configure Multer for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

exports.uploadMiddleware = upload.single("image");

// Add Product
exports.addProduct = (req, res) => {
  if (req.user.role !== "farmer") {
    return res.status(403).json({ message: "Only farmers can add products" });
  }

  const {
    product_name,
    description,
    price_each,
    price_kg,
    price_sack,
    quantity,
    harvest_date,
    expiry_days,
    unit_type
  } = req.body;
  const farmer_id = req.user.id;
  const image_url = req.file ? req.file.filename : null;

  // Determine a base price (used for freshness/discount and legacy fields)
  const defaultUnit = (unit_type || 'kg').toLowerCase();
  const prices = {
    each: price_each ? parseFloat(price_each) : null,
    kg: price_kg ? parseFloat(price_kg) : null,
    sack: price_sack ? parseFloat(price_sack) : null,
  };

  let basePrice =
    (defaultUnit === 'kg' && prices.kg) ||
    (defaultUnit === 'each' && prices.each) ||
    (defaultUnit === 'sack' && prices.sack) ||
    prices.kg ||
    prices.each ||
    prices.sack;

  if (!basePrice) {
    return res.status(400).json({ message: "At least one price (each, kg, or sack) is required" });
  }

  // Calculate Freshness Score
  let freshness_score = 100;
  let discount_price = null;
  let freshness_status = 'Fresh';

  if (harvest_date && expiry_days) {
    const harvestDate = new Date(harvest_date);
    const today = new Date();
    const timeDiff = today - harvestDate;
    const daysPassed = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert ms to days

    const expiry = parseInt(expiry_days);
    if (expiry > 0) {
      freshness_score = Math.max(0, Math.round(100 - ((daysPassed / expiry) * 100)));
    }

    // Determine Status & Discount
    if (freshness_score < 40) {
      freshness_status = 'Old';
      // Apply 20% Smart Deal Discount based on base price
      discount_price = (parseFloat(basePrice) * 0.8).toFixed(2);
    } else if (freshness_score < 70) {
      freshness_status = 'Aging';
    }
  }

  const sql = `
    INSERT INTO products
    (farmer_id, product_name, description,
     price, price_each, price_kg, price_sack,
     quantity, harvest_date, expiry_days,
     freshness_score, discount_price, freshness_status, image_url, unit_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      farmer_id,
      product_name,
      description,
      basePrice,
      prices.each,
      prices.kg,
      prices.sack,
      quantity,
      harvest_date,
      expiry_days,
      freshness_score,
      discount_price,
      freshness_status,
      image_url,
      defaultUnit
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.status(201).json({
        message: "Product added successfully",
        productId: result.insertId,
        freshness_score,
        discount_price
      });
    }
  );
};

// Get All Products
exports.getAllProducts = (req, res) => {
  const sql = `
    SELECT p.*, f.full_name as farmer_name 
    FROM products p
    JOIN farmers f ON p.farmer_id = f.id
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(200).json(results);
  });
};
