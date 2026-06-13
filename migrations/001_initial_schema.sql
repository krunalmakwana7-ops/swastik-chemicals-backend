-- Create ENUM types
CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED');
CREATE TYPE product_grade AS ENUM ('TEXTILE', 'CHEMICAL', 'FOOD');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  mobile VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_role ON users(role);

-- Customer Profiles table
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  delivery_address TEXT NOT NULL,
  gst_number VARCHAR(15) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX idx_customer_profiles_gst ON customer_profiles(gst_number);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  grade product_grade NOT NULL DEFAULT 'TEXTILE',
  moq_kg NUMERIC(12, 2) NOT NULL,
  price_per_kg NUMERIC(12, 4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_grade ON products(grade);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_kg NUMERIC(12, 2) NOT NULL,
  order_status order_status NOT NULL DEFAULT 'PENDING',
  requested_delivery_at TIMESTAMP NOT NULL,
  confirmed_delivery_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, mobile, password_hash, role) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@swastikchemicals.com',
  '9999999999',
  '$2b$12$DZbxk6h2pFdzJh.RBWxhY.6eUngNBbYZ2TWVZ9N5oJXz1GyXbkqV2',
  'ADMIN'
);

-- Insert sample product
INSERT INTO products (id, product_name, grade, moq_kg, price_per_kg, is_active) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Sodium Silicate',
  'TEXTILE',
  1000,
  45.00,
  true
);
