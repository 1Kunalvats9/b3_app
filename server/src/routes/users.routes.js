import express from 'express';
import { requireAuth } from '@clerk/express';
import Users from '../models/users.model.js';
import Bcoins from '../models/bcoin.model.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth());

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const { userId, sessionClaims } = req.auth;
        
        let user = await Users.findOne({ clerk_id: userId });
        
        if (!user) {
            // Create user if doesn't exist
            console.log('Creating new user with sessionClaims:', sessionClaims);
            
            // Extract email from sessionClaims
            const email = sessionClaims?.email || sessionClaims?.email_addresses?.[0]?.email_address || 'unknown@email.com';
            const name = sessionClaims?.name || sessionClaims?.first_name || sessionClaims?.full_name || email.split('@')[0];
            
            user = new Users({
                clerk_id: userId,
                email: email,
                name: name,
                role: sessionClaims.metadata?.role || 'user'
            });
            
            await user.save();
            console.log('New user created successfully:', user);
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { name, phone } = req.body;
        
        const updatedUser = await Users.findOneAndUpdate(
            { clerk_id: userId },
            { name, phone },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Add address
router.post('/addresses', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { type, address, city, pincode, isDefault } = req.body;
        
        const user = await Users.findOne({ clerk_id: userId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // If this is set as default, unset other defaults
        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }
        
        user.addresses.push({
            type,
            address,
            city,
            pincode,
            isDefault: isDefault || user.addresses.length === 0
        });
        
        await user.save();
        
        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            data: user.addresses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding address',
            error: error.message
        });
    }
});

// Update address
router.put('/addresses/:addressId', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { addressId } = req.params;
        const { type, address, city, pincode, isDefault } = req.body;
        
        const user = await Users.findOne({ clerk_id: userId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        
        if (addressIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        
        // If this is set as default, unset other defaults
        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }
        
        user.addresses[addressIndex] = {
            ...user.addresses[addressIndex],
            type,
            address,
            city,
            pincode,
            isDefault
        };
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Address updated successfully',
            data: user.addresses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message
        });
    }
});

// Delete address
router.delete('/addresses/:addressId', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { addressId } = req.params;
        
        const user = await Users.findOne({ clerk_id: userId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        
        // If deleted address was default and there are other addresses, make first one default
        if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
            user.addresses[0].isDefault = true;
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Address deleted successfully',
            data: user.addresses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: error.message
        });
    }
});

// Get user's bcoin history
router.get('/bcoins', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { page = 1, limit = 20 } = req.query;
        
        const skip = (page - 1) * limit;
        
        const bcoins = await Bcoins.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Bcoins.countDocuments({ user_id: userId });
        
        // Get current bcoin balance
        const user = await Users.findOne({ clerk_id: userId });
        const currentBalance = user?.total_bcoins || 0;
        
        res.json({
            success: true,
            data: {
                transactions: bcoins,
                currentBalance
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bcoin history',
            error: error.message
        });
    }
});

// Admin routes
const requireAdmin = (req, res, next) => {
    const { sessionClaims } = req.auth;
    if (sessionClaims?.metadata?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Get all users (Admin only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (page - 1) * limit;
        
        const users = await Users.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Users.countDocuments(query);
        
        res.json({
            success: true,
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

export default router;