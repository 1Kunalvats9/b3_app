import express from 'express';
import { requireAuth, clerkClient } from '@clerk/express';
import Users from '../models/users.model.js';
import Bcoins from '../models/bcoin.model.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth());

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const { userId } = req.auth;
        
        let user = await Users.findOne({ clerk_id: userId });
        
        if (!user) {
            // Fetch user data from Clerk
            console.log('User not found in database, fetching from Clerk...');
            
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                console.log('Clerk user data:', {
                    id: clerkUser.id,
                    email: clerkUser.emailAddresses?.[0]?.emailAddress,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    fullName: clerkUser.fullName
                });
                
                const email = clerkUser.emailAddresses?.[0]?.emailAddress || 'unknown@email.com';
                const name = clerkUser.fullName || 
                           `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
                           clerkUser.firstName || 
                           email.split('@')[0];
                
                // Check if user has admin role in Clerk metadata
                const role = clerkUser.publicMetadata?.role || 'user';
                
                user = new Users({
                    clerk_id: userId,
                    email: email,
                    name: name,
                    role: role
                });
                
                await user.save();
                console.log('New user created successfully:', user);
            } catch (clerkError) {
                console.error('Error fetching user from Clerk:', clerkError);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching user information from authentication service',
                    error: clerkError.message
                });
            }
        } else {
            // Update user info from Clerk if needed
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                const clerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
                const clerkName = clerkUser.fullName || 
                                `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
                                clerkUser.firstName;
                const clerkRole = clerkUser.publicMetadata?.role || 'user';
                
                // Update if there are differences
                let needsUpdate = false;
                const updates = {};
                
                if (clerkEmail && clerkEmail !== user.email) {
                    updates.email = clerkEmail;
                    needsUpdate = true;
                }
                
                if (clerkName && clerkName !== user.name) {
                    updates.name = clerkName;
                    needsUpdate = true;
                }
                
                if (clerkRole !== user.role) {
                    updates.role = clerkRole;
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    user = await Users.findOneAndUpdate(
                        { clerk_id: userId },
                        updates,
                        { new: true }
                    );
                    console.log('User updated with latest Clerk data');
                }
            } catch (clerkError) {
                console.error('Error updating user from Clerk:', clerkError);
                // Continue with existing user data if Clerk fetch fails
            }
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