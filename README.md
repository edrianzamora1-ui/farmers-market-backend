# Farmers Market System - MVC Refactored Backend

## Overview
This backend has been refactored into a clean MVC (Model-View-Controller) structure with proper separation of concerns. The application is now ready for deployment on platforms like Render.

## Project Structure

```
farmers-market-system/
├── server.js                 # Express app setup & route mounting
├── db.js                     # Database connection configuration
├── package.json              # Dependencies
├── .env                      # Environment variables (local)
├── .env.example              # Environment variables template for deployment
│
├── middleware/
│   └── authMiddleware.js     # JWT authentication middleware
│
├── controllers/
│   ├── farmerController.js   # Farmer registration, login, orders, revenue
│   ├── vendorController.js   # Vendor registration, login, orders
│   ├── productController.js  # Product creation and listing
│   └── orderController.js    # Order management
│
└── routes/
    ├── farmerRoutes.js       # Farmer endpoints
    ├── vendorRoutes.js       # Vendor endpoints
    ├── productRoutes.js      # Product endpoints
    └── orderRoutes.js        # Order endpoints
```

## API Routes

### Farmer Routes (`/farmers`)
- **POST /farmers/register** - Register a new farmer
- **POST /farmers/login** - Farmer login (returns JWT token)
- **GET /farmers/orders** - Get all orders for farmer's products (requires auth)
- **GET /farmers/revenue** - Get total revenue earned by farmer (requires auth)

### Vendor Routes (`/vendors`)
- **POST /vendors/register** - Register a new vendor
- **POST /vendors/login** - Vendor login (returns JWT token)
- **GET /vendors/orders** - Get vendor's order history (requires auth)

### Product Routes (`/products`)
- **POST /products** - Add a new product (requires auth, farmers only)
- **GET /products** - Get all available products (public)

### Order Routes (`/orders`)
- **GET /orders** - Get orders (requires auth)

## Authentication
- Uses JWT (JSON Web Tokens) for secure authentication
- Token expires in 1 hour by default
- Protected routes require `Authorization: Bearer <token>` header
- User role validation: farmers vs vendors

## Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
# Server Configuration
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=farmers_market
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_key_here
```

## Deployment to Render

1. **Create `.env` in Render Dashboard:**
   - Set environment variables for database and JWT secret
   - Use production database credentials
   - Use strong JWT secret

2. **Install Dependencies:**
   ```
   npm install
   ```

3. **Start Server:**
   ```
   node server.js
   ```

## Database Configuration

The application uses MySQL with the following tables:
- `farmers` - Farmer accounts
- `vendors` - Vendor accounts
- `products` - Product listings (associated with farmers)
- `orders` - Order records

## Key Features

✅ **MVC Architecture** - Clean separation of concerns
✅ **JWT Authentication** - Secure token-based auth
✅ **Role-Based Access** - Farmers vs Vendors
✅ **Environment Variables** - Ready for deployment
✅ **Error Handling** - Consistent error responses
✅ **Database Joins** - Proper queries for cross-table data
✅ **Farmer Revenue** - Calculate total earnings with aggregation
✅ **Vendor Order History** - Track orders by vendor

## Running Locally

```bash
# Install dependencies
npm install

# Start the server
node server.js

# Server will run on http://localhost:5000
```

## Notes
- All sensitive data (passwords) are hashed using bcrypt
- JWT tokens are signed with the secret from environment variables
- Database connections use connection pooling for performance
