import express from 'express';
import cors from 'cors'
import {clerkMiddleware} from "@clerk/express";
import dotenv from 'dotenv'

dotenv.config();

const app = express()
app.use(cors())
app.use(express.json());
app.use(clerkMiddleware())


const PORT = 3000

app.listen(PORT,(req,res)=>{
    console.log(`Server is running on port ${PORT} ✅`);
})
