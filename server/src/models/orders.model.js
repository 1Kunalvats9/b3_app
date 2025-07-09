import mongoose from "mongoose";
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
        status:{
            type:String,
        },
        total_amount:{
            type:Number
        },
        delivery_address:{
            type:String,
        },
        phone_number:{
            type:Number,
            default:null
        },
        payment_mode:{
            type:String,
        }
    },
    { timestamps: true }
);

const Orders = mongoose.model('Orders', orderSchema);
export default Orders;