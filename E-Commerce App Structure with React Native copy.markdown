# E-Commerce App Architecture with React Native, Clerk, and B-Coin System

This document outlines the architecture and workflow for building a React Native e-commerce application with authentication, role-based access, product management, cart functionality, admin features, and a b-coin reward system. The app uses Expo, Clerk for authentication, Cloudinary for image storage, react-native-upi-payment for payments, and NativeWind for styling.

## Backend Architecture

### Technology Stack
- **Server**: Node.js with Express for RESTful APIs.
- **Database**: MongoDB for storing products, orders, categories, and b-coin transactions.
- **Authentication**: Clerk Backend SDK for token verification and user management.
- **Image Storage**: Cloudinary Node.js SDK for product image uploads.
- **Payments**: Optional server-side verification for UPI payments using react-native-upi-payment data.

### Database Schema
The MongoDB database includes the following collections:

| Collection        | Fields                                                                 |
|-------------------|----------------------------------------------------------------------|
| **Products**      | `id`, `name`, `description`, `price`, `category`, `image_url`        |
| **Orders**        | `id`, `user_id` (Clerk user ID), `status` (e.g., 'placed', 'processing', 'shipped', 'delivered'), `total_amount`, `delivery_address`, `phone_number`, `payment_mode` |
| **OrderItems**    | `id`, `order_id`, `product_id`, `quantity`, `price_at_purchase`     |
| **Categories**    | `id`, `name`                                                       |
| **BCoinTransactions** | `id`, `user_id` (Clerk user ID), `order_id`, `amount_spent`, `b_coins_earned`, `created_at` |

- **Users**: Managed by Clerk, with roles stored in `publicMetadata` (e.g., `{ role: 'admin' }` or `{ role: 'user' }`).
- **B-Coins**: Stored in `BCoinTransactions`, with `b_coins_earned` calculated as `floor(amount_spent / 100)` when an order’s status is set to 'delivered'.

### API Endpoints
The backend exposes RESTful APIs, secured with Clerk token verification. Role-based access control restricts admin actions.

| Endpoint                | Method | Description                              | Access       |
|-------------------------|--------|------------------------------------------|--------------|
| `/api/products`         | GET    | List products with filters (category, search) | All users    |
| `/api/products/:id`     | GET    | Get product details                      | All users    |
| `/api/products`         | POST   | Create product (with image upload)       | Admin only   |
| `/api/products/:id`     | PUT    | Update product                           | Admin only   |
| `/api/products/:id`     | DELETE | Delete product                           | Admin only   |
| `/api/orders`           | GET    | List orders (user-specific or all for admin) | Authenticated |
| `/api/orders/:id`       | GET    | Get order details                        | Authenticated |
| `/api/orders`           | POST   | Create order                             | Authenticated |
| `/api/orders/:id`       | PUT    | Update order status, award b-coins if 'delivered' | Admin only   |
| `/api/categories`       | GET    | List categories                          | All users    |
| `/api/bcoins/balance`   | GET    | Get user’s b-coin balance                | Authenticated |
| `/api/bcoins/transactions` | GET | List user’s b-coin transactions          | Authenticated |

### Authentication
- **Clerk Integration**: Use `@clerk/backend` to verify session tokens. Configure tokens in the Clerk Dashboard to include `publicMetadata` with `{ "metadata": "{{user.public_metadata}}" }`.
- **Middleware**: An Express middleware verifies tokens using `clerkClient.sessions.verifyToken()`. The user’s role is extracted from `tokenClaims.metadata.role` for authorization.

### B-Coin System
- **Awarding B-Coins**: When an order’s status is updated to 'delivered' via `/api/orders/:id` (PUT), check if a `BCoinTransaction` exists for the order. If not, calculate `b_coins_earned = Math.floor(order.total_amount / 100)` and create a new `BCoinTransaction`.
- **Balance Calculation**: The `/api/bcoins/balance` endpoint uses MongoDB aggregation to sum `b_coins_earned` for a user’s transactions.
- **Transaction History**: The `/api/bcoins/transactions` endpoint retrieves all transactions for a user, sorted by `created_at`.

### Image Handling
- **Cloudinary Setup**: Install `cloudinary` and configure with API key, secret, and cloud name from [Cloudinary](https://cloudinary.com/documentation/node_integration).
- **Upload Process**: Admins upload images via a POST request to `/api/products`. The backend uses `cloudinary.v2.uploader.upload` to store images and saves the URL in the product’s `image_url`.

### Payment Verification
- **UPI Payments**: The frontend initiates UPI payments using react-native-upi-payment. The backend may verify payment success using `txnId` and `responseCode` if required by the gateway.
- **Cash on Delivery**: Orders are created with `payment_mode: 'cod'`, and b-coins are awarded upon delivery.

## Frontend Architecture

### Technology Stack
- **Framework**: React Native with Expo for cross-platform development.
- **Navigation**: Expo Router with a bottom tab navigator.
- **Authentication**: Clerk Expo SDK (`@clerk/clerk-expo`) for Google and Apple sign-in.
- **State Management**: Context API for cart state.
- **Styling**: NativeWind for Tailwind CSS-inspired styling.
- **Payments**: react-native-upi-payment for UPI transactions.

### Navigation Structure
Using Expo Router, the app has the following routes:

- **Authentication Routes**:
  - `(auth)/_layout.tsx`: Layout for authentication screens.
  - `(auth)/sign-in.tsx`: Sign-in screen with Clerk’s `<SignIn />`.
  - `(auth)/sign-up.tsx`: Sign-up screen with Clerk’s `<SignUp />`.

- **Main Tabs**:
  - `(tabs)/_layout.tsx`: Bottom tab navigator, conditionally showing the Admin tab for admins.
  - `(tabs)/home.tsx`: Product listing with search, category filter, and sorting.
  - `(tabs)/cart.tsx`: Cart management with delivery and payment options.
  - `(tabs)/profile.tsx`: User profile with b-coin balance display.
  - `(tabs)/orders.tsx`: Order history and status tracking.
  - `(tabs)/admin/_layout.tsx`: Stack navigator for admin features (visible only to admins).
    - `(tabs)/admin/products.tsx`: List and edit products.
    - `(tabs)/admin/orders.tsx`: View and update orders, including past orders.

### Key Features

#### Authentication
- **Setup**: Install `@clerk/clerk-expo` and `expo-secure-store`. Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local`. Wrap the app in `<ClerkProvider>` in `app/_layout.tsx`.
- **Role-Based Access**: Use `useUser()` to access `user.publicMetadata.role`. Show the Admin tab only if `role === 'admin'`.

#### Home Tab
- **Product Listing**: Fetch products from `/api/products` with query parameters for search, category, and sorting.
- **Category Scrollbar**: Fetch categories from `/api/categories` and display in a horizontal ScrollView.
- **Search and Sorting**: Implement a search bar and sorting options (e.g., price, name) using API query parameters.

#### Cart Tab
- **Cart Management**: Use Context API to store cart items (product ID, quantity). Display items, calculate total, and allow removal.
- **Checkout**: Collect delivery address, phone number, and payment mode (UPI or cash on delivery). Send order details to `/api/orders`.
- **UPI Payment**: Use `react-native-upi-payment` to initiate payment with parameters like `vpa`, `payeeName`, `amount`, and `transactionRef`. Handle success/failure callbacks to update order status.

#### Profile Tab
- Display user information (e.g., name, email) using `useUser()`. Fetch and show b-coin balance from `/api/bcoins/balance`. Allow sign-out with `useClerk().signOut()`.
- Optionally, add a button to navigate to a transaction history screen using `/api/bcoins/transactions`.

#### Orders Tab
- Fetch user orders from `/api/orders` and display order history with statuses (e.g., 'placed', 'processing', 'shipped', 'delivered'). Show details like products, total amount, and b-coins earned (if delivered).

#### Admin Tab
- **Products**: List products with options to add/edit/delete. Use Cloudinary for image uploads via the backend.
- **Orders**: Display all orders with status updates (e.g., preparing, out for delivery, delivered). Include a section for past completed orders.

### Workflow
1. **User Sign-In**: Users authenticate via Google or Apple using Clerk. The `useUser()` hook retrieves the role from `publicMetadata`.
2. **Product Browsing**: Users browse products, filter by category, search, and sort. Add items to the cart using Context API.
3. **Checkout**: Users enter delivery details and select payment mode. For UPI, initiate payment and update order status upon success. For cash on delivery, create the order with status 'placed'.
4. **Order Tracking**: Users view order history and statuses via `/api/orders`.
5. **B-Coin Awarding**: When an admin updates an order to 'delivered', the backend awards b-coins based on the total amount.
6. **Admin Functions**: Admins manage products (CRUD) and orders (view/update statuses) in the Admin tab, with role-based access control.

## Step-by-Step Development Guide
1. **Project Setup**
   - Initialize an Expo project: `npx create-expo-app my-app`.
   - Install dependencies: `npm install @clerk/clerk-expo expo-secure-store nativewind react-native-upi-payment axios`.
   - Configure NativeWind per [NativeWind documentation](https://www.nativewind.dev/).
   - Set up environment variables in `.env.local`.

2. **Authentication**
   - Sign up at [Clerk](https://clerk.com/docs) and obtain the publishable key.
   - Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local`.
   - Wrap the app in `<ClerkProvider>` in `app/_layout.tsx`.
   - Create `(auth)/sign-in.tsx` and `(auth)/sign-up.tsx` using Clerk’s `<SignIn />` and `<SignUp />` components.
   - Configure user roles in Clerk Dashboard under User Metadata.

3. **Navigation**
   - Set up Expo Router with a bottom tab navigator in `(tabs)/_layout.tsx`.
   - Conditionally render the Admin tab based on `user.publicMetadata.role`.

4. **Home Screen**
   - Fetch products from `/api/products` using Axios.
   - Implement search, category scrollbar (from `/api/categories`), and sorting.
   - Display products in a grid with cards linking to details.

5. **Cart Management**
   - Create a `CartContext` to manage cart state (add, remove, update items).
   - Build `(tabs)/cart.tsx` to display cart items, quantities, and total.
   - Allow users to remove items or proceed to checkout.

6. **Checkout Process**
   - Collect delivery address, phone number, and payment mode in the cart screen.
   - For UPI, use `react-native-upi-payment` to initiate payment (see [GitHub](https://github.com/nitish24p/react-native-upi)).
   - On payment success, create an order via `/api/orders` with `status: 'placed'`.
   - For cash on delivery, create the order directly.

7. **Backend Implementation**
   - Set up a Node.js/Express server with MongoDB using `mongoose`.
   - Connect to MongoDB: `mongoose.connect(process.env.MONGODB_URI)`.
   - Define schemas for Products, Orders, OrderItems, Categories, and BCoinTransactions.
   - Implement API endpoints with Clerk authentication middleware.
   - Configure Cloudinary with API credentials for image uploads.

8. **Admin Features**
   - Create `(tabs)/admin/products.tsx` for product CRUD operations.
   - Create `(tabs)/admin/orders.tsx` for order management, including status updates and past orders.
   - Restrict access to admins using `publicMetadata.role`.

9. **B-Coin System Integration**
   - In `/api/orders/:id` (PUT), award b-coins when `status` is set to 'delivered'.
   - Implement `/api/bcoins/balance` and `/api/bcoins/transactions` endpoints.
   - Ensure b-coins are awarded only once per order using `BCoinTransaction` checks.

10. **User Profile**
    - In `(tabs)/profile.tsx`, display user info and b-coin balance using `/api/bcoins/balance`.
    - Optionally, add a transaction history screen.

11. **Testing**
    - Test authentication and role-based access.
    - Verify product listing, search, and sorting functionality.
    - Check cart and checkout flows for both UPI and cash on delivery.
    - Ensure b-coins are awarded correctly and displayed in the profile.
    - Test admin features for restricted access and functionality.
    - Validate image uploads via Cloudinary.
    - Ensure API security and error handling.
    - Test on multiple devices and emulators using Expo.

## Sample Code

### Backend (Node.js/Express)
```javascript
const express = require('express');
const { createClerkClient } = require('@clerk/backend');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const app = express();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const session = await clerk.sessions.verifyToken(token);
    req.user = session;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Admin-only middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.metadata.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Product creation with image upload
app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, description, price, category, image } = req.body;
  try {
    const uploadResult = await cloudinary.uploader.upload(image, { folder: 'products' });
    const product = new Product({
      name,
      description,
      price,
      category,
      image_url: uploadResult.secure_url,
    });
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status and award b-coins
app.put('/api/orders/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    order.status = status;
    await order.save();

    if (status === 'delivered') {
      const existingTransaction = await BCoinTransaction.findOne({ order_id: order._id });
      if (!existingTransaction) {
        const b_coins_earned = Math.floor(order.total_amount / 100);
        const transaction = new BCoinTransaction({
          user_id: order.user_id,
          order_id: order._id,
          amount_spent: order.total_amount,
          b_coins_earned,
          created_at: new Date(),
        });
        await transaction.save();
      }
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get b-coin balance
app.get('/api/bcoins/balance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await BCoinTransaction.aggregate([
      { $match: { user_id: userId } },
      { $group: { _id: null, total: { $sum: "$b_coins_earned" } } }
    ]);
    const balance = result.length > 0 ? result[0].total : 0;
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get b-coin transactions
app.get('/api/bcoins/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await BCoinTransaction.find({ user_id: userId }).sort({ created_at: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
```

### Frontend (React Native/Expo)
```javascript
// app/_layout.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={SecureStore}
    >
      <Slot />
    </ClerkProvider>
  );
}

// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

匆匆

export default function TabsLayout() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata.role === 'admin';

  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      {isAdmin && <Tabs.Screen name="admin" options={{ title: 'Admin' }} />}
    </Tabs>
  );
}

// app/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useUser, useClerk } from '@clerk/clerk-expo';
import axios from 'axios';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [bCoinBalance, setBCoinBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await axios.get('/api/bcoins/balance', {
          headers: { Authorization: `Bearer ${await user.getToken()}` }
        });
        setBCoinBalance(response.data.balance);
      } catch (error) {
        console.error('Error fetching b-coin balance:', error);
      }
    };
    fetchBalance();
  }, [user]);

  return (
    <View className="p-4">
      <Text className="text-lg">Welcome, {user.firstName}</Text>
      <Text className="text-lg">B-Coins: {bCoinBalance}</Text>
      <Button title="Sign Out" onPress={() => signOut()} />
    </View>
  );
}

// app/(tabs)/cart.tsx
import { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import RNUpiPayment from 'react-native-upi-payment';
import { CartContext } from '../context/CartContext';

export default function CartScreen() {
  const { cart, clearCart } = useContext(CartContext);

  const handleCheckout = async (paymentMode, deliveryDetails) => {
    try {
      if (paymentMode === 'upi') {
        RNUpiPayment.initializePayment(
          {
            vpa: 'merchant@upi',
            payeeName: 'Merchant Name',
            amount: cart.total,
            transactionRef: `order-${Date.now()}`,
          },
          async (data) => {
            // Success callback
            await axios.post('/api/orders', { ...deliveryDetails, payment_mode: 'upi', status: 'placed' });
            clearCart();
          },
          (data) => {
            console.log('Payment failed:', data);
          }
        );
      } else {
        await axios.post('/api/orders', { ...deliveryDetails, payment_mode: 'cod', status: 'placed' });
        clearCart();
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <View className="p-4">
      <Text className="text-lg">Cart Total: ₹{cart.total}</Text>
      <Button title="Checkout" onPress={() => handleCheckout('upi', {})} />
    </View>
  );
}
```

## Additional Notes
- **B-Coin Accuracy**: Ensure `total_amount` reflects the final amount spent (after discounts/taxes) for accurate b-coin calculations.
- **Concurrency**: Use MongoDB’s unique index on `order_id` in `BCoinTransactions` to prevent duplicate b-coin awards.
- **Security**: Secure all API endpoints with HTTPS and proper error handling in production.
- **Notifications**: Consider adding push notifications for b-coin earnings to enhance user engagement.

## Resources
- [Clerk Documentation](https://clerk.com/docs)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [react-native-upi-payment GitHub](https://github.com/nitish24p/react-native-upi)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

This architecture and guide provide a comprehensive plan for building a scalable, user-friendly e-commerce app with a robust b-coin reward system.