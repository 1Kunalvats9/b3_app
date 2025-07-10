// src/models/products.model.js (UPDATED)
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            required: true,
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        originalPrice: {
            type: Number,
            required: true
        },
        discountedPrice: {
            type: Number,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        image_url: {
            type: String,
            default: ""
        },
        stock: {
            type: Number,
            required: true,
            default: 0
        },
        isOpen: {
            type: Boolean,
            default: false 
        },
        unit: {
            type: String,
            enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'unit', 'other'],
            default: 'piece'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        legacyBarcode: {
            type: String,
            unique: true, 
            sparse: true  
        }
    },
    { timestamps: true }
);

const Products = mongoose.model('Products', productSchema);
export default Products;