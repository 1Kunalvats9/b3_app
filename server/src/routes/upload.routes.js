import express from 'express';
import { requireAuth } from '@clerk/express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// All routes require authentication
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

// Upload image (Admin only)
router.post('/image', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Convert buffer to base64
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const result = await uploadImage(base64Image, 'products');
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload image',
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: result.url,
                public_id: result.public_id
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
});

// Delete image (Admin only)
router.delete('/image/:publicId', requireAdmin, async (req, res) => {
    try {
        const { publicId } = req.params;
        
        const result = await deleteImage(publicId);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete image',
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting image',
            error: error.message
        });
    }
});

export default router;