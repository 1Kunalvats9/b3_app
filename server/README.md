# E-commerce Backend Server

A Node.js/Express backend server for an e-commerce application with Clerk authentication, MongoDB database, and Cloudinary image storage.

## Features

- **Authentication**: Clerk-based authentication with role-based access control (Admin/User)
- **Products Management**: CRUD operations for products with categories, pricing, and stock management
- **Order Management**: Complete order processing with status tracking
- **User Management**: User profiles, addresses, and bcoin rewards system
- **Image Upload**: Cloudinary integration for product images
- **Database**: MongoDB with Mongoose ODM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Clerk
- **Image Storage**: Cloudinary
- **File Upload**: Multer

## Project Structure

```
server/
├── src/
│   ├── models/           # Database models
│   │   ├── products.model.js
│   │   ├── categories.model.js
│   │   ├── orders.model.js
│   │   ├── users.model.js
│   │   └── bcoin.model.js
│   ├── routes/           # API routes
│   │   ├── products.routes.js
│   │   ├── categories.routes.js
│   │   ├── orders.routes.js
│   │   ├── users.routes.js
│   │   ├── upload.routes.js
│   │   └── index.js
│   ├── middleware/       # Custom middleware
│   │   └── errorHandler.js
│   ├── utils/           # Utility functions
│   │   ├── connectDb.js
│   │   └── cloudinary.js
│   └── server.js        # Main server file
├── package.json
└── README.md
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/ecommerce
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=3000
CLIENT_URL=http://localhost:8081
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Running the Server

Development mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Public Routes
- `GET /api/health` - Health check
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/categories` - Get all categories

### User Routes (Authenticated)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address
- `GET /api/users/bcoins` - Get bcoin history
- `GET /api/orders/my-orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get single order

### Admin Routes (Admin Only)
- `GET /api/users` - Get all users
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `GET /api/orders` - Get all orders
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/upload/image` - Upload image
- `DELETE /api/upload/image/:publicId` - Delete image

## Database Models

### Products
- Basic product information (name, description, prices)
- Category and stock management
- Support for weight-based products (isOpen flag)
- Image URL storage
- Active/inactive status

### Orders
- Complete order tracking with items
- Multiple payment modes support
- Bcoin integration for discounts
- Status tracking (pending → delivered)
- Address and contact information

### Users
- Clerk integration for authentication
- Multiple addresses support
- Bcoin balance tracking
- Role-based access (user/admin)

### Categories
- Simple category management
- Used for product organization

### Bcoins
- Reward system tracking
- Earned/redeemed transactions
- Linked to orders and users

## Features

### Authentication & Authorization
- Clerk-based authentication
- Role-based access control
- JWT token validation
- Admin-only routes protection

### Product Management
- Full CRUD operations
- Category-based organization
- Stock management
- Weight-based products support
- Image upload integration
- Search and filtering

### Order Processing
- Cart-to-order conversion
- Stock validation
- Bcoin discount application
- Status tracking
- Order history

### Reward System
- Automatic bcoin earning (1% of order value)
- Bcoin redemption for discounts
- Transaction history tracking

### Image Management
- Cloudinary integration
- Automatic image optimization
- Upload and delete operations
- Admin-only access

## Error Handling
- Centralized error handling middleware
- Validation error responses
- Proper HTTP status codes
- Detailed error messages

## Security Features
- CORS configuration
- Request size limits
- File type validation
- Role-based access control
- Input validation and sanitization