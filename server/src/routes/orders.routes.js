import express from 'express';
import { requireAuth } from '@clerk/express';
import Orders from '../models/orders.model.js';
import Products from '../models/products.model.js';
import Users from '../models/users.model.js';
import Bcoins from '../models/bcoin.model.js';
import { v4 as uuidv4 } from 'uuid';
import { sendSMSProgrammatic } from '../utils/sendSms.js';

const router = express.Router();

router.use(requireAuth());

const requireAdmin = (req, res, next) => {
    const { userId } = req.auth;
    
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
            
            if (!product.isOpen) {
                await Products.findOneAndUpdate(
                    { id: product.id },
                    { $inc: { stock: -item.quantity } }
                );
            }
        }
        
        if (bcoins_used > 0) {
            const user = await Users.findOne({ clerk_id: userId });
            if (!user || user.total_bcoins < bcoins_used) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient bcoins'
                });
            }
            
            total_amount = Math.max(0, total_amount - bcoins_used);
            
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
            estimated_delivery: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        
        await newOrder.save();
        
        const originalAmount = total_amount + bcoins_used;
        if (originalAmount > 0) {
            const bcoinsEarned = Math.floor(originalAmount / 100);
            
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
        
        if (bcoins_used > 0) {
            const bcoinRedemptionId = uuidv4();
            const bcoinRedemptionRecord = new Bcoins({
                id: bcoinRedemptionId,
                user_id: userId,
                order_id: orderId,
                amount_spend: bcoins_used * 2,
                bcoins_earned: bcoins_used,
                transaction_type: 'redeemed',
                description: `Redeemed for order ${orderId}`
            });
            
            await bcoinRedemptionRecord.save();
        }

        if (phone_number) {
            try {
                const customerMessage = `Your order ${newOrder.id} for ₹${newOrder.total_amount.toFixed(2)} has been placed successfully! Estimated delivery: ${newOrder.estimated_delivery.toDateString()}. Thank you for shopping with us!`;
                await sendSMSProgrammatic(phone_number, customerMessage);
            } catch (smsError) {
                console.error('Failed to send SMS to customer for new order:', smsError.message);
            }
        }

        if (process.env.OWNER_PHONE_NUMBER) {
            try {
                console.log('sending mssg to owner')
                const ownerPhoneNumber = `+91${process.env.OWNER_PHONE_NUMBER}`;
                const ownerMessage = `New order #${newOrder.id} placed! Total: ₹${newOrder.total_amount.toFixed(2)}. Customer phone: ${newOrder.phone_number}. Please check.`;
                await sendSMSProgrammatic(ownerPhoneNumber, ownerMessage);
            } catch (ownerSmsError) {
                console.error('Failed to send SMS to owner for new order:', ownerSmsError.message);
            }
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

        if (updatedOrder.phone_number) {
            try {
                const getStatusMessage = (status, orderId) => {
                    const orderShortId = orderId.substring(0, 8);
                    
                    switch (status) {
                        case 'confirmed':
                            return `✅ Order Confirmed!

Your order #${orderShortId} has been confirmed and is being prepared.

🕐 Estimated preparation time: 30-45 minutes
📱 We'll notify you when it's ready for delivery.

Thank you for your patience!
- B3 Store Team`;

                        case 'preparing':
                            return `👨‍🍳 Order in Kitchen!

Your order #${orderShortId} is now being prepared by our team.

🕐 Almost ready! Expected completion in 15-30 minutes.
📦 We'll update you once it's ready for delivery.

- B3 Store Team`;

                        case 'out_for_delivery':
                            return `🚚 Out for Delivery!

Great news! Your order #${orderShortId} is on its way to you.

📍 Our delivery partner will reach you shortly.
📱 Please keep your phone handy for delivery updates.

Thank you for choosing B3 Store!`;

                        case 'delivered':
                            return `🎉 Order Delivered!

Your order #${orderShortId} has been successfully delivered.

We hope you enjoy your purchase! 
⭐ Your feedback means a lot to us.

Thank you for shopping with B3 Store!`;

                        case 'cancelled':
                            return `❌ Order Cancelled

Your order #${orderShortId} has been cancelled.

💰 If you made an online payment, refund will be processed within 3-5 business days.

For any queries, please contact us.
- B3 Store Team`;

                        default:
                            return `📋 Order Update

Your order #${orderShortId} status: ${status.replace(/_/g, ' ').toUpperCase()}

We'll keep you updated on any changes.
- B3 Store Team`;
                    }
                };

                const statusUpdateMessage = getStatusMessage(status, updatedOrder.id);
                await sendSMSProgrammatic(updatedOrder.phone_number, statusUpdateMessage);
            } catch (smsError) {
                console.error('Failed to send SMS for order status update:', smsError.message);
            }
        }
        
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
