import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product_id: {
        type: String,
        required: true
    },
    product_name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unit_price: {
        type: Number,
        required: true
    },
    total_price: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        default: 'piece'
    }
});

const orderSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            required: true,
        },
        user_id: {
            type: String,
            required: true
        },
        items: [orderItemSchema],
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
            default: 'pending'
        },
        total_amount: {
            type: Number,
            required: true
        },
        delivery_address: {
            type: String,
            required: true
        },
        phone_number: {
            type: String,
            required: true
        },
        payment_mode: {
            type: String,
            enum: ['cash_on_delivery', 'online', 'bcoins'],
            default: 'cash_on_delivery'
        },
        payment_status: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending'
        },
        bcoins_used: {
            type: Number,
            default: 0
        },
        delivery_fee: {
            type: Number,
            default: 0
        },
        estimated_delivery: {
            type: Date
        }
    },
    { timestamps: true }
);

const Orders = mongoose.model('Orders', orderSchema);
export default Orders;