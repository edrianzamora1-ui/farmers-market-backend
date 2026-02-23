-- Run this in your MySQL database so vendors can buy by kg, each, or sack.
-- Run each line; if you get "Duplicate column" then that column already exists.

-- Products: per-unit prices
ALTER TABLE products ADD COLUMN unit_type VARCHAR(16) NOT NULL DEFAULT 'kg';
ALTER TABLE products ADD COLUMN price_each DECIMAL(10,2) NULL;
ALTER TABLE products ADD COLUMN price_kg DECIMAL(10,2) NULL;
ALTER TABLE products ADD COLUMN price_sack DECIMAL(10,2) NULL;

-- Cart: which unit the vendor chose (so "each" shows correctly in cart)
ALTER TABLE cart_items ADD COLUMN unit_type VARCHAR(16) NOT NULL DEFAULT 'kg';
