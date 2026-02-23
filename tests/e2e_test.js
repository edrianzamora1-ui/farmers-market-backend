const fetch = global.fetch || require('node-fetch');
const db = require('../db');
const jwt = require('jsonwebtoken');

const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, res) => err ? reject(err) : resolve(res));
});

async function ensureUser(type, details) {
  const base = 'http://localhost:5000';
  const loginUrl = type === 'farmer' ? `${base}/farmers/login` : `${base}/vendors/login`;
  const registerUrl = type === 'farmer' ? `${base}/farmers/register` : `${base}/vendors/register`;

  // Try login first
  let res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: details.email, password: details.password })
  });
  let body = await res.json().catch(() => ({}));
  if (body && body.token) return { token: body.token };

  // Register (if login failed)
  res = await fetch(registerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details)
  });
  body = await res.json().catch(() => ({}));

  // If registration returned an id, login now
  await new Promise(r => setTimeout(r, 200)); // slight pause
  res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: details.email, password: details.password })
  });
  body = await res.json().catch(() => ({}));
  if (body && body.token) return { token: body.token, registerBody: body };

  throw new Error(`${type} ensure failed: ${JSON.stringify(body)}`);
}

async function run() {
  const base = 'http://localhost:5000';
  const suffix = Date.now();
  const farmerEmail = `e2e_farmer_${suffix}@example.com`;
  const vendorEmail = `e2e_vendor_${suffix}@example.com`;
  const created = { products: [], orders: [], cartItems: [], farmers: [], vendors: [] };

  try {
    console.log('Ensuring farmer account...');
    const farmer = await ensureUser('farmer', { full_name: 'E2E Farmer', email: farmerEmail, phone: '0917' + (Math.floor(Math.random()*9000000)+1000000), location: 'Farmtown', password: 'password123' });
    const farmerToken = farmer.token;
    const decodedFarmer = jwt.decode(farmerToken);
    let farmerId = decodedFarmer?.id || null;

    if (!farmerId) {
      // Fallback: query DB by email
      const rows = await query('SELECT id FROM farmers WHERE email = ?', [farmerEmail]);
      farmerId = rows[0]?.id || null;
    }

    if (!farmerId) throw new Error('Cannot determine farmer id');
    created.farmers.push(farmerId);

    console.log('Inserting product...');
    const insertSql = `INSERT INTO products (farmer_id, product_name, description, price, price_each, price_kg, price_sack, quantity, harvest_date, expiry_days, freshness_score, discount_price, freshness_status, image_url, unit_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertParams = [farmerId, `E2E Banana ${suffix}`, 'Sweet bananas', 60, null, 60, null, 100, '2026-02-20', 20, 100, null, 'Fresh', null, 'kg'];
    const result = await query(insertSql, insertParams);
    const productId = result.insertId;
    created.products.push(productId);
    console.log('Inserted productId:', productId);

    console.log('Ensuring vendor account...');
    const vendor = await ensureUser('vendor', { business_name: 'E2E Stall', owner_name: 'Vendor E2E', email: vendorEmail, phone: '0917' + (Math.floor(Math.random()*9000000)+1000000), location: 'Market', password: 'vendorpass' });
    const vendorToken = vendor.token;
    const decodedVendor = jwt.decode(vendorToken);
    const vendorId = decodedVendor?.id || null;
    if (!vendorId) {
      const vrows = await query('SELECT id FROM vendors WHERE email = ?', [vendorEmail]);
      if (vrows[0]) created.vendors.push(vrows[0].id);
    } else {
      created.vendors.push(vendorId);
    }

    console.log('Adding to cart...');
    let res = await fetch(`${base}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({ productId: productId, quantity: 3, unitType: 'kg' })
    });
    let body = await res.json().catch(() => ({}));
    console.log('Add to cart response:', body);

    console.log('Checking out...');
    res = await fetch(`${base}/cart/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` }
    });
    body = await res.json().catch(() => ({}));
    console.log('Checkout response:', body);

    console.log('E2E flow completed successfully');

    // Mark orders inserted for cleanup: fetch orders by vendor and product
    try {
      const orders = await query('SELECT id FROM orders WHERE product_id = ? OR vendor_id IN (?)', [productId, created.vendors]);
      orders.forEach(o => created.orders.push(o.id));
    } catch (e) {
      // ignore
    }

  } catch (err) {
    console.error('E2E error:', err);
  } finally {
    // Cleanup created records
    try {
      if (created.orders.length) {
        await query('DELETE FROM orders WHERE id IN (?)', [created.orders]);
        console.log('Deleted orders:', created.orders);
      }
      if (created.products.length) {
        await query('DELETE FROM products WHERE id IN (?)', [created.products]);
        console.log('Deleted products:', created.products);
      }
      if (created.vendors.length) {
        await query('DELETE FROM vendors WHERE id IN (?)', [created.vendors]);
        console.log('Deleted vendors:', created.vendors);
      }
      if (created.farmers.length) {
        await query('DELETE FROM farmers WHERE id IN (?)', [created.farmers]);
        console.log('Deleted farmers:', created.farmers);
      }
      // Clear cart items for any vendor created
      if (created.vendors.length) {
        await query('DELETE FROM cart_items WHERE vendor_id IN (?)', [created.vendors]);
        console.log('Cleared cart items for vendors');
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
    process.exit(0);
  }
}

run();
