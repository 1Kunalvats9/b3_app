import express from 'express';
import { requireAuth } from '@clerk/express';
import Orders from '../models/orders.model.js';
import Products from '../models/products.model.js';
import Users from '../models/users.model.js';
import Bcoins from '../models/bcoin.model.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// All routes require authentication
router.use(requireAuth());

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    const { userId } = req.auth;
    
    // Check user role from database
    Users.findOne({ clerk_id: userId })
        .then(user => {
            if (!user || user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }
            next();
        })
        .catch(error => {
            console.error('Error checking admin role:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verifying admin access'
            });
        });
};

// Alternative middleware that checks Clerk metadata directly
const requireAdminClerk = (req, res, next) => {
    const { sessionClaims } = req.auth;
    if (sessionClaims?.publicMetadata?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Get user's orders
router.get('/my-orders', async (req, res) => {
    try {
        console.log("getting alll your orders")
        const { userId } = req.auth;
        const { page = 1, limit = 10, status } = req.query;
        
        const query = { user_id: userId };
        if (status) {
            query.status = status;
        }
        
        const skip = (page - 1) * limit;
        
        const orders = await Orders.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Orders.countDocuments(query);
        
        res.json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

// Get single order
router.get('/:id', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { sessionClaims } = req.auth;
        const isAdmin = sessionClaims?.metadata?.role === 'admin';
        
        const query = { id: req.params.id };
        if (!isAdmin) {
            query.user_id = userId;
        }
        
        const order = await Orders.findOne(query);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
});

// Create new order
router.post('/create-order', async (req, res) => {
    try {
        const { userId } = req.auth;
        const {
            items,
            delivery_address,
            phone_number,
            payment_mode,
            bcoins_used = 0
        } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order items are required'
            });
        }
        
        // Validate and calculate total
        let total_amount = 0;
        const validatedItems = [];
        
        for (const item of items) {
            const product = await Products.findOne({ id: item.product_id, isActive: true });
            
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product ${item.product_id} not found`
                });
            }
            
            if (!product.isOpen && product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }
            
            const itemTotal = product.discountedPrice * item.quantity;
            total_amount += itemTotal;
            
            validatedItems.push({
                product_id: product.id,
                product_name: product.name,
                quantity: item.quantity,
                unit_price: product.discountedPrice,
                total_price: itemTotal,
                unit: product.unit
            });
            
            // Update stock for non-open products
            if (!product.isOpen) {
                await Products.findOneAndUpdate(
                    { id: product.id },
                    { $inc: { stock: -item.quantity } }
                );
            }
        }
        
        // Apply bcoins discount
        if (bcoins_used > 0) {
            const user = await Users.findOne({ clerk_id: userId });
            if (!user || user.total_bcoins < bcoins_used) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient bcoins'
                });
            }
            
            total_amount = Math.max(0, total_amount - bcoins_used);
            
            // Deduct bcoins from user
            await Users.findOneAndUpdate(
                { clerk_id: userId },
                { $inc: { total_bcoins: -bcoins_used } }
            );
        }
        
        const orderId = uuidv4();
        
        const newOrder = new Orders({
            id: orderId,
            user_id: userId,
            items: validatedItems,
            total_amount,
            delivery_address,
            phone_number,
            payment_mode,
            bcoins_used,
            estimated_delivery: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        });
        
        await newOrder.save();
        
        // Award bcoins (1% of order value)
        const originalAmount = total_amount + bcoins_used; // Add back bcoins to get original amount
        if (originalAmount > 0) {
            const bcoinsEarned = Math.floor(originalAmount / 100); // 1 bcoin per ₹100
            
            if (bcoinsEarned > 0) {
                const bcoinId = uuidv4();
                const bcoinRecord = new Bcoins({
                    id: bcoinId,
                    user_id: userId,
                    order_id: orderId,
                    amount_spend: originalAmount,
                    bcoins_earned: bcoinsEarned,
                    transaction_type: 'earned',
                    description: `Earned from order ${orderId}`
                });
                
                await bcoinRecord.save();
                
                await Users.findOneAndUpdate(
                    { clerk_id: userId },
                    { $inc: { total_bcoins: bcoinsEarned } }
                );
            }
        }
        
        // Record bcoin redemption if used
        if (bcoins_used > 0) {
            const bcoinRedemptionId = uuidv4();
            const bcoinRedemptionRecord = new Bcoins({
                id: bcoinRedemptionId,
                user_id: userId,
                order_id: orderId,
                amount_spend: bcoins_used * 2, // Amount saved
                bcoins_earned: bcoins_used, // Actually bcoins redeemed
                transaction_type: 'redeemed',
                description: `Redeemed for order ${orderId}`
            });
            
            await bcoinRedemptionRecord.save();
        }
        
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: newOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
});

// Admin routes
// Get all orders (Admin only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, user_id } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (user_id) query.user_id = user_id;
        
        const skip = (page - 1) * limit;
        
        const orders = await Orders.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Orders.countDocuments(query);
        
        res.json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

// Update order status (Admin only)
router.patch('/:id/status', requireAdmin, async (req, res) => {
    try {
        console.log('entered order status change')
        const { status } = req.body;
        
        const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        console.log('valid status hai')
        
        const updatedOrder = await Orders.findOneAndUpdate(
            { id: req.params.id },
            { status },
            { new: true }
        );
        
        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        console.log("order updated")
        
        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
});

export default router;