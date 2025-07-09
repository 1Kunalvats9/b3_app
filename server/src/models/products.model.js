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
        description:{
            type:String,
        },
        price:{
            type:Number
        },
        category:{
            type:String,
        },
        image_url:{
            type:String,
            default:""
        }
    },
    { timestamps: true }
);

const Products = mongoose.model('Products', productSchema);
export default Products;