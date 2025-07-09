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
            default: false // true for products sold by weight (kg/grams)
        },
        unit: {
            type: String,
            enum: ['piece', 'kg', 'gram', 'liter', 'ml'],
            default: 'piece'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const Products = mongoose.model('Products', productSchema);
export default Products;