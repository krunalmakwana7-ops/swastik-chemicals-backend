# Swastik Chemicals Backend

Complete production-ready backend for Swastik Chemicals B2B ordering platform.

## Features

✅ **JWT Authentication** - Register, Login, Logout with Remember Me option
✅ **Order Management** - Create orders with MOQ (1000kg) and 24-hour lead time validation
✅ **WhatsApp Notifications** - Twilio integration for order confirmations
✅ **Admin Analytics** - Complex SQL queries for client usage analytics
✅ **Product Management** - Admin can create and manage products
✅ **Role-Based Access** - ADMIN and CUSTOMER roles with proper authorization
✅ **Error Handling** - Comprehensive error handling with structured responses
✅ **Rate Limiting** - Authentication endpoints protected with rate limiting

## Tech Stack

- **Node.js** + **Express.js** - REST API
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Twilio** - WhatsApp notifications
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **express-rate-limit** - Rate limiting

## Installation

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/krunalmakwana7-ops/swastik-chemicals-backend.git
   cd swastik-chemicals-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** (copy from `.env.example`)
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/swastik_chemicals
   JWT_SECRET=your_jwt_secret_key_here
   JWT_REMEMBER_ME_SECRET=your_remember_me_secret_key_here
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
   ADMIN_WHATSAPP_TO=whatsapp:+919876543210
   ```

5. **Create PostgreSQL database**
   ```bash
   createdb swastik_chemicals
   ```

6. **Run database migrations**
   ```bash
   psql -U postgres -d swastik_chemicals -f migrations/001_initial_schema.sql
   ```

7. **Start the server**
   ```bash
   npm start
   ```

   Server will run on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (requires auth)

### Orders

- `POST /api/orders` - Create new order (requires auth)
  - Minimum quantity: 1000 kg
  - Minimum lead time: 24 hours
- `GET /api/orders` - List all orders (customers see their own, admins see all)
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status (admin only)

### Products

- `POST /api/products` - Create product (admin only)
- `GET /api/products` - List products
  - Query param: `activeOnly=true` to filter active products

### Admin

- `GET /api/admin/analytics` - Get client usage analytics (admin only)
  - Returns customer data with order volumes, statuses, and average orders

## Default Admin Credentials

- **Email:** admin@swastikchemicals.com
- **Mobile:** 9999999999
- **Password:** admin123

## API Response Format

All responses follow a consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": { "timestamp": "2026-06-13T12:00:00.000Z" }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error description",
  "details": null,
  "meta": { "timestamp": "2026-06-13T12:00:00.000Z" }
}
```

## Authentication

Include JWT token in request headers:
```
Authorization: Bearer <your_jwt_token>
```

## Example Usage

### Register Customer
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@company.com",
    "password": "SecurePassword123",
    "companyName": "ABC Chemicals",
    "ownerName": "John Doe",
    "deliveryAddress": "123 Factory St, City",
    "gstNumber": "27AABCT1234H1Z5"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "customer@company.com",
    "password": "SecurePassword123",
    "rememberMe": true
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productId": "00000000-0000-0000-0000-000000000002",
    "quantityKg": 5000,
    "requestedDeliveryAt": "2026-06-15T10:00:00Z"
  }'
```

## Database Schema

### Users Table
- `id` - UUID primary key
- `email` - Unique email
- `mobile` - Unique mobile number
- `password_hash` - Bcrypt hashed password
- `role` - ENUM: 'ADMIN' or 'CUSTOMER'

### Customer Profiles Table
- `id` - UUID primary key
- `user_id` - FK to users
- `company_name` - Company name
- `owner_name` - Business owner name
- `delivery_address` - Delivery location
- `gst_number` - Unique GST number

### Products Table
- `id` - UUID primary key
- `product_name` - Product name
- `grade` - ENUM: 'TEXTILE', 'CHEMICAL', 'FOOD'
- `moq_kg` - Minimum order quantity in kg
- `price_per_kg` - Price per kilogram
- `is_active` - Product active status

### Orders Table
- `id` - UUID primary key
- `customer_id` - FK to users
- `product_id` - FK to products
- `quantity_kg` - Order quantity
- `order_status` - ENUM: 'PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED'
- `requested_delivery_at` - Requested delivery date
- `confirmed_delivery_at` - Confirmed delivery date

## Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTH_ERROR` - Authentication failed
- `INSUFFICIENT_PERMISSIONS` - User lacks required role
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate entry
- `MOQ_VIOLATION` - Order quantity below minimum
- `LEAD_TIME_VIOLATION` - Delivery date too soon
- `INVALID_STATUS_TRANSITION` - Invalid order status update
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

## Production Deployment

### Environment Variables for Production
```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://prod_user:secure_password@prod-db-host:5432/swastik_chemicals
JWT_SECRET=<very_long_secure_random_string>
JWT_REMEMBER_ME_SECRET=<very_long_secure_random_string>
TWILIO_ACCOUNT_SID=<your_production_twilio_sid>
TWILIO_AUTH_TOKEN=<your_production_twilio_token>
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
ADMIN_WHATSAPP_TO=whatsapp:+919876543210
```

### Recommended Hosting
- **Backend:** Heroku, AWS EC2, DigitalOcean, Railway
- **Database:** AWS RDS, DigitalOcean Managed PostgreSQL, Azure Database
- **SSL/TLS:** Let's Encrypt (automatic with most platforms)

## Support

For issues or questions, contact: support@swastikchemicals.com

## License

Proprietary - Swastik Chemicals
