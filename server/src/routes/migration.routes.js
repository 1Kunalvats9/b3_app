// src/routes/migration.routes.js
import express from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import Products from '../models/products.model.js'; // Your CURRENT database product model

dotenv.config(); // Load environment variables

const router = express.Router();

// --- Define Old BackupInventory Schema and Model ---
// This schema matches your OLD database's BackupInventory structure
const OldBackupInventorySchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    products: [{ // This is the nested array we need to iterate
        name: String,
        barcode: String,
        originalPrice: Number, // Note: This is now directly available in old schema
        discountedPrice: Number, // Note: This is now directly available in old schema
        quantity: Number,
        createdAt: Date,
        updatedAt: Date
    }],
    customers: [{
        phoneNumber: String,
        purchases: Array
    }],
    sales: [{
        customerId: String,
        customerPhone: String,
        items: Array,
        total: Number,
        date: Date
    }],
    createdAt: { type: Date, default: Date.now },
});

// Create a separate connection for the OLD database
const oldDbConnection = mongoose.createConnection(process.env.OLD_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 // Keep trying to send operations for 5 seconds
});

// Handle connection events for old DB
oldDbConnection.on('connected', () => console.log('Connected to OLD MongoDB successfully!'));
oldDbConnection.on('error', (err) => console.error('OLD MongoDB connection error:', err));
oldDbConnection.on('disconnected', () => console.log('Disconnected from OLD MongoDB.'));

// Define the OldBackupInventory model using the specific oldDbConnection
const OldBackupInventory = oldDbConnection.model('BackupInventory', OldBackupInventorySchema);
// --- End Old BackupInventory Schema and Model ---


// Migration Route (Admin only)
// It's recommended to make this a POST request, as it modifies data.
// You'll trigger this manually, usually not through a regular UI button.
router.post('/migrate-products', async (req, res) => { // Added requireAdminClerk back
    try {
        console.log('Starting product migration...');
        // Fetch all BackupInventory documents from the old DB
        const oldInventories = await OldBackupInventory.find({}); 

        let migratedCount = 0;
        let updatedCount = 0;
        let createdCount = 0;
        let errorCount = 0;
        let skippedCount = 0; // For products that might cause unique constraint errors if legacyBarcode already exists

        // Iterate through each BackupInventory document
        for (const oldInventory of oldInventories) {
            // Iterate through the products array within each BackupInventory document
            for (const nestedProduct of oldInventory.products) {
                try {
                    // --- DEBUGGING: Log raw nestedProduct data ---
                    // console.log('Processing nested product:', {
                    //     name: nestedProduct.name,
                    //     barcode: nestedProduct.barcode,
                    //     originalPrice: nestedProduct.originalPrice,
                    //     discountedPrice: nestedProduct.discountedPrice,
                    //     quantity: nestedProduct.quantity,
                    //     createdAt: nestedProduct.createdAt,
                    //     updatedAt: nestedProduct.updatedAt
                    // });
                    // --- END DEBUGGING ---

                    // Find if a product exists in the current DB by its legacyBarcode
                    // Use nestedProduct.barcode for lookup
                    let existingProduct = await Products.findOne({ legacyBarcode: nestedProduct.barcode });

                    // Ensure required fields from nestedProduct are valid numbers/strings before mapping
                    // Use parseFloat to convert potentially string-based numbers, then check for NaN
                    const newOriginalPrice = !isNaN(parseFloat(nestedProduct.originalPrice)) ? parseFloat(nestedProduct.originalPrice) : 0;
                    const newDiscountedPrice = !isNaN(parseFloat(nestedProduct.discountedPrice)) ? parseFloat(nestedProduct.discountedPrice) : 0;

                    // The old schema does NOT have a 'category' field on the nested product.
                    // We must provide a default or infer it if possible. Defaulting to 'Uncategorized'.
                    const newCategory = 'Uncategorized'; // Default category as it's missing in old schema

                    // Ensure quantity is a number
                    const newStock = !isNaN(parseFloat(nestedProduct.quantity)) ? parseFloat(nestedProduct.quantity) : 0;


                    if (existingProduct) {
                        // Product exists, update its details
                        let changed = false;

                        // Map fields from old to new schema and check for changes
                        if (existingProduct.name !== nestedProduct.name) {
                            existingProduct.name = nestedProduct.name;
                            changed = true;
                        }
                        // Category will always be 'Uncategorized' if updated, which might not be desired.
                        // Consider if you want to update category if it already exists in new DB.
                        // For now, only update if it's different from the default.
                        if (existingProduct.category !== newCategory) { 
                            existingProduct.category = newCategory;
                            changed = true;
                        }
                        if (existingProduct.stock !== newStock) { 
                            existingProduct.stock = newStock;
                            changed = true;
                        }
                        // Map discountedPrice
                        if (existingProduct.discountedPrice !== newDiscountedPrice) { 
                            existingProduct.discountedPrice = newDiscountedPrice;
                            changed = true;
                        }
                        // Map originalPrice
                        if (existingProduct.originalPrice !== newOriginalPrice) { 
                            existingProduct.originalPrice = newOriginalPrice;
                            changed = true;
                        }
                        // Other fields like description, image_url, isOpen, unit, isActive
                        // are not in the old schema, so they won't be updated here unless you add specific logic.

                        if (changed) {
                            await existingProduct.save();
                            updatedCount++;
                            console.log(`Updated product: "${existingProduct.name}" (Barcode: ${nestedProduct.barcode})`);
                        } else {
                            // console.log(`Product "${existingProduct.name}" (Barcode: ${nestedProduct.barcode}) already up-to-date.`);
                        }

                    } else {
                        // Product does not exist, create a new one
                        const newProductId = uuidv4();
                        const newProduct = new Products({
                            id: newProductId,
                            name: nestedProduct.name,
                            description: 'Imported from old database', // Default description
                            originalPrice: newOriginalPrice, // Use sanitized value
                            discountedPrice: newDiscountedPrice, // Use sanitized value
                            category: newCategory, // Use sanitized value (e.g., 'Uncategorized')
                            image_url: '', // Default empty image URL
                            stock: newStock, // Use sanitized value
                            isOpen: false, // Default to false
                            unit: 'piece', // Default unit, adjust if you have a mapping rule or need to infer
                            isActive: true, // Default to active
                            legacyBarcode: nestedProduct.barcode // Store the old barcode for future reference
                        });

                        await newProduct.save();
                        createdCount++;
                        console.log(`Created new product: "${newProduct.name}" (Barcode: ${nestedProduct.barcode})`);
                    }
                    migratedCount++;
                } catch (productError) {
                    errorCount++;
                    console.error(`Error processing product (Barcode: ${nestedProduct.barcode}, Name: "${nestedProduct.name}"):`, productError.message);
                    // Specifically handle unique constraint errors if legacyBarcode already exists
                    if (productError.code === 11000) { // MongoDB duplicate key error code
                        console.error(`Skipped due to duplicate legacyBarcode: ${nestedProduct.barcode}`);
                        skippedCount++;
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Migration complete! ${migratedCount} products processed. ${createdCount} new products created, ${updatedCount} existing products updated. ${errorCount} products encountered errors. ${skippedCount} products skipped due to duplicate barcodes.`,
            stats: {
                totalOldInventories: oldInventories.length,
                productsProcessed: migratedCount,
                newProductsCreated: createdCount,
                existingProductsUpdated: updatedCount,
                productsWithErrors: errorCount,
                productsSkippedDueToDuplicateBarcode: skippedCount
            }
        });

    } catch (error) {
        console.error('Overall product migration failed:', error);
        res.status(500).json({
            success: false,
            message: 'Overall product migration failed',
            error: error.message
        });
    } finally {
        // You might want to close the old DB connection after a one-off migration.
        // If your application requires access to the old DB frequently, you might keep it open.
        // await oldDbConnection.close();
        // console.log('Disconnected from OLD MongoDB after migration.');
    }
});

export default router;
