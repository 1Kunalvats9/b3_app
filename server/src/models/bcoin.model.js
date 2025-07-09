import mongoose from 'mongoose';

const bcoinSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    order_id: {
        type: String,
        required: true
    },
    amount_spend: {
        type: Number,
        required: true
    },
    bcoins_earned: {
        type: Number,
        required: true
    },
    transaction_type: {
        type: String,
        enum: ['earned', 'redeemed'],
        default: 'earned'
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Bcoins = mongoose.model('Bcoins', bcoinSchema);
export default Bcoins;