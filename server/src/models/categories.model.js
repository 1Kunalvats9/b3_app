import mongoose from "mongoose";
const categorySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            required: true,
        },
        name:{
            type:String,
        }
    },
    { timestamps: true }
);
const Categories = mongoose.model('Categories', categorySchema);
export default Categories;