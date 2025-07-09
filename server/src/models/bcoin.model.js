import mongoose from 'mongoose';
const bcoinSchema = new mongoose.Schema({
    id:{
        type:String,
        unique:true
    },
    user_id:{
        type:String,
        unique:true
    },
    order_id:{
        type:String,
    },
    amount_spend:{
        type:Number,
    },
    bcoins_earned:{
        type:Number,
    },
    createdAt:{
        type:Date,
    },
},{
    timestamps:true
})