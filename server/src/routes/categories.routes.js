import express from 'express';
import { requireAuth } from '@clerk/express';
import Categories from '../models/categories.model.js';
import Products from "../models/products.model.js"
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all categories (public route)
router.get('/', async (req, res) => {
    try {
        console.log("getting all the categories");
        const categories = await Categories.find().sort({ name: 1 });
        console.log('categories done sending now')
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
});

router.get('/own-categories', async (req, res) => {
    try {
        console.log("Getting all unique categories");
        
        const uniqueCategories = await Products.distinct('category');
        
        console.log('Unique categories fetched, sending now');
        res.json({
            success: true,
            data: uniqueCategories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
});

// Admin routes - require authentication and admin role
router.use(requireAuth());

// Middleware to check admin role
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

// Create new category (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }
        
        const categoryId = uuidv4();
        
        const newCategory = new Categories({
            id: categoryId,
            name
        });
        
        await newCategory.save();
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: newCategory
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
});

// Update category (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        
        const updatedCategory = await Categories.findOneAndUpdate(
            { id: req.params.id },
            { name },
            { new: true, runValidators: true }
        );
        
        if (!updatedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
});

// Delete category (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const deletedCategory = await Categories.findOneAndDelete({ id: req.params.id });
        
        if (!deletedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
});

export default router;