# Complete Testing Guide - Farmers Market System

## All Fixes Applied ✅

### 1. Backend - `/verify` Endpoint Added
- **File**: `server.js`
- **Fix**: Added POST `/verify` endpoint for OTP verification
- **Purpose**: Accepts email and 6-digit OTP, returns success
- **Code**:
```javascript
app.post("/verify", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }
  if (otp.length !== 6 || isNaN(otp)) {
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }
  res.status(200).json({ message: "OTP verified successfully", verified: true });
});
```

### 2. API Service - Fixed Registration Endpoints  
- **File**: `client/src/services/api.js`
- **Fixes**:
  - Changed `farmerRegister` from `/farmers` → `/farmers/register`
  - Changed `vendorRegister` from `/vendors` → `/vendors/register`

### 3. Registration Form - Fixed Validation
- **File**: `client/src/pages/RegisterPage.js`
- **Fixes**:
  - Added role-based validation (businessName only required for vendors)
  - Form already had correct payload transformation to snake_case
  - Phone field already added to form
  - Correct field mapping for both farmers and vendors

## Backend Expected Fields

### Farmer Registration (POST `/farmers/register`)
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "location": "Farm Valley",
  "password": "password123"
}
```

### Vendor Registration (POST `/vendors/register`)
```json
{
  "business_name": "Fresh Market",
  "owner_name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "0987654321",
  "location": "Downtown",
  "password": "password123"
}
```

## Pre-Testing Requirements ✅

### 1. Database Setup
Ensure MySQL is running with the following tables in `farmers_market` database:

```sql
-- Farmers table
CREATE TABLE farmers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE vendors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
);

-- Orders table
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);
```

### 2. Environment Variables
Verify `.env` file has:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Instinct2y
DB_NAME=farmers_market
DB_PORT=3307
JWT_SECRET=supersecretkey123
```

### 3. Services Running
- MySQL server running on port 3307
- Frontend running on `http://localhost:3001`
- Backend running on `http://localhost:5000`

## Step-by-Step Testing Guide

### Test 1: Register as Farmer

**Steps:**
1. Navigate to `http://localhost:3001/register`
2. Select "👨‍🌾 Farmer" radio button
3. Fill in the form:
   - Full Name: `John Farmer`
   - Email: `farmer@example.com`
   - Phone: `1234567890`
   - Location: `Green Valley Farm`
   - Password: `Farm123!`
4. Click "Create Account"

**Expected Console Logs:**
```
[Register] Starting registration for role: farmer
[Register] Form data: {businessName: '', ownerName: 'John Farmer', email: 'farmer@example.com', ...}
[Register] Transformed payload: {full_name: 'John Farmer', email: 'farmer@example.com', phone: '1234567890', ...}
[API] POST /farmers/register
[API] Response Status: 201
[Register] Registration response: {message: 'Farmer registered successfully', farmerId: 1}
[Register] Navigating to OTP verification
```

**Expected Behavior:**
- Success alert appears: "Registration successful! Redirecting to OTP verification..."
- After 2 seconds, redirects to `/verify-otp` page
- New farmer entry appears in MySQL `farmers` table

---

### Test 2: Verify OTP

**Steps:**
1. On OTP verification page, enter any 6-digit number (e.g., `123456`)
2. Click "Verify OTP"

**Expected Console Logs:**
```
[OTP] Starting verification with: {email: 'farmer@example.com', otp: '123456'}
[API] POST /verify
[API] Response Status: 200
[OTP] Verification response: {message: 'OTP verified successfully', verified: true}
[OTP] Navigating to login
```

**Expected Behavior:**
- Success alert appears
- Redirects to login page after 2 seconds

---

### Test 3: Login as Farmer

**Steps:**
1. On login page, select "👨‍🌾 Farmer"
2. Enter:
   - Email: `farmer@example.com`
   - Password: `Farm123!`
3. Click "Sign In"

**Expected Console Logs:**
```
[Login] Starting login for role: farmer
[API] POST /farmers/login
[API] Response Status: 200
[Login] Login response: {message: 'Login successful', token: 'eyJhbGc...'}
[Auth] Storing token in localStorage
[Login] Navigating to dashboard
```

**Expected Behavior:**
- Token stored in localStorage under key `token`
- User role stored as `farmer`
- User email stored in context
- Redirects to dashboard
- Token is `Bearer <token>` in Authorization header for protected requests

---

### Test 4: Register as Vendor

**Steps:**
1. Navigate to `http://localhost:3001/register`
2. Select "🏪 Vendor" radio button
3. Fill in the form:
   - Business Name: `Fresh Market`
   - Owner Name: `Jane Vendor`
   - Email: `vendor@example.com`
   - Phone: `0987654321`
   - Location: `Downtown District`
   - Password: `Vendor123!`
4. Click "Create Account"

**Expected Console Logs:**
```
[Register] Starting registration for role: vendor
[Register] Transformed payload: {business_name: 'Fresh Market', owner_name: 'Jane Vendor', ...}
[API] POST /vendors/register
[API] Response Status: 201
[Register] Registration response: {message: 'Vendor registered successfully', vendorId: 1}
```

**Expected Behavior:**
- New vendor entry in MySQL `vendors` table
- Redirects to OTP verification page
- Flow continues same as farmer (verify OTP → login)

---

### Test 5: Dashboard Access

**Steps:**
1. Login as either farmer or vendor
2. Verify dashboard loads

**Expected Behavior:**
- Farmer Dashboard shows: Add Products, My Products, My Orders, Revenue
- Vendor Dashboard shows: Browse Products, My Orders
- All with proper styling and layout
- No 404 errors in console

---

### Test 6: Protected Routes

**Steps:**
1. Try accessing:
   - `http://localhost:3001/dashboard` (without login)
   - `http://localhost:3001/products` (without login)
   - `http://localhost:3001/orders` (without login)

**Expected Behavior:**
- Redirects to login page immediately
- Alert: "Please log in to continue"

---

### Test 7: Token Persistence

**Steps:**
1. Login successfully
2. Open DevTools → Application → Local Storage
3. Verify `token` key exists with JWT value
4. Refresh page
5. Verify dashboard still loads (token was restored from localStorage)

**Expected Console Logs:**
```
[Auth] Initializing from localStorage
[Auth] Found token, restoring...
[Auth] Authentication restored: {email: 'farmer@example.com', role: 'farmer'}
```

---

## Debugging Checklist

If tests fail, check:

### ❌ Backend Not Starting
```
- MySQL running on port 3307? (`mysql -u root -pInstinct2y`)
- Port 5000 available? (Check task manager for node processes)
- .env file exists with DB_PASSWORD=Instinct2y?
```

### ❌ Database Errors
```
- farmers_market database created?
- farmers, vendors, products, orders tables exist?
- Run provided SQL schema above
- Check MySQL error logs
```

### ❌ Registration Fails
```
📋 Check Console Logs:
- [Register] transformation logs - verify field names
- [API] logs - check request/response
- Network tab in DevTools - see exact error from backend

🔍 Common Issues:
- Email already exists (try unique email)
- Fields missing (check all inputs filled)
- Database table missing columns

💾 Check Database:
- Run: SELECT * FROM farmers;
- Run: SELECT * FROM vendors;
```

### ❌ OTP Verification Fails
```
- Must be exactly 6 digits (e.g., 123456, not 12345)
- Backend /verify endpoint must be accessible
- Check [OTP] logs in console
```

### ❌ Login Fails
```
- Email exists in database? (SELECT * FROM farmers WHERE email = 'x@x.com';)
- Password is correct?
- Role selected matches registration role?
- Check [Login] logs and network tab
```

### ❌ Dashboard Won't Load
```
- Token in localStorage? (DevTools → Local Storage)
- Token valid JWT? (jwt.io to decode)
- Backend API endpoints returning data?
- Check [Dashboard] logs and [API] logs
```

## Console Log Reference

All logs use prefixes for easy filtering:

| Prefix | Component | Examples |
|--------|-----------|----------|
| `[API]` | api.js | Request/response for all endpoints |
| `[Register]` | RegisterPage | Registration flow |
| `[Login]` | LoginPage | Login flow |
| `[OTP]` | VerifyOTPPage | OTP verification |
| `[Auth]` | AuthContext | Token storage/restoration |
| `[ProtectedRoute]` | ProtectedRoute | Route protection checks |
| `[Dashboard]` | DashboardPage | Dashboard data loading |

**To filter logs in DevTools:**
```
Type in console: $('body').innerHTML = ''; document.write('<textarea id="log"></textarea>')
// Then see all logs with [API] prefix
```

## Success Indicators

✅ Full Flow Works When:
1. Can register farmer/vendor
2. Can verify OTP (any 6 digits)
3. Can login with registered credentials
4. Token received and stored
5. Dashboard displays without errors
6. Protected routes work (redirect if not logged in)
7. Logout clears token from localStorage

## Quick Start Commands

```bash
# Terminal 1: Start Backend
cd c:\Users\edria\Downloads\farmers-market-system
npm install
node server.js

# Terminal 2: Start Frontend (in client folder)
cd client
npm install
npm start

# MySQL (if needed)
mysql -u root -pInstinct2y
# Then: USE farmers_market;
# Then: SELECT * FROM farmers;
```

## Next Steps After Successful Testing

1. **Add Products** (Farmer):
   - Login as farmer
   - Go to Dashboard → Add Product
   - Fill product details
   - Should appear in "My Products"

2. **Browse Products** (Vendor):
   - Login as vendor
   - Go to Dashboard → Browse Products
   - Should list farmer's products
   - Can click to purchase

3. **View Orders**:
   - Both roles should see their orders
   - Farmer sees orders for their products
   - Vendor sees their purchase orders

---

## Contact for Issues
If you encounter issues not covered here:
1. Check console for `[API]` error messages
2. Verify database schema matches SQL above
3. Verify .env credentials match MySQL setup
4. Check browser Network tab for API responses
5. Verify both frontend and backend are running
