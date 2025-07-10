import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        clerk_id: {
            type: String,
            unique: true,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            default: null
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        addresses: [{
            type: {
                type: String,
                enum: ['home', 'work', 'other'],
                default: 'home'
            },
            address: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            },
            isDefault: {
                type: Boolean,
                default: false
            }
        }],
        total_bcoins: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const Users = mongoose.model('Users', userSchema);
export default Users;