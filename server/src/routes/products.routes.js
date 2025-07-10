import express from 'express';
import { requireAuth } from '@clerk/express';
import Products from '../models/products.model.js';
import Categories from '../models/categories.model.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all products (public route)
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
        console.log('fetching products')
        const query = { isActive: true };
        
        if (category) {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (page - 1) * limit;
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const products = await Products.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));
            
        console.log('done products')
        const total = await Products.countDocuments(query);
        
        res.json({
            success: true,
            data: products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Products.findOne({ id: req.params.id, isActive: true });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});


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

// Create new product (Admin only)
router.post('/', async (req, res) => {
    try {
        const {
            name,
            description,
            originalPrice,
            discountedPrice,
            category,
            image_url,
            stock,
            isOpen,
            unit
        } = req.body;
        
        const productId = uuidv4();
        
        const newProduct = new Products({
            id: productId,
            name,
            description,
            originalPrice,
            discountedPrice,
            category,
            image_url,
            stock,
            isOpen,
            unit
        });
        
        await newProduct.save();
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

router.put('/save/:id', async (req, res) => {
    try {
        console.log('saving product....')
        const updatedProduct = await Products.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        console.log('saved')
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

// Delete product (Admin only)
router.delete('/delete/:id', async (req, res) => {
    try {
        const product = await Products.findOneAndUpdate(
            { id: req.params.id },
            { isActive: false },
            { new: true }
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
});

export default router;