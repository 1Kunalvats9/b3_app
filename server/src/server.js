import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from "@clerk/express";
import dotenv from 'dotenv';
import connectDb from './utils/connectDb.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDb();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8081',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(clerkMiddleware());

// Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} ✅`);
});

export default app;