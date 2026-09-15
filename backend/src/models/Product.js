const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a product name'],
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
        },
        price: {
            type: Number,
            required: [true, 'Please add a price'],
            min: [0, 'Price cannot be negative'],
        },
        stock: {
            type: Number,
            required: [true, 'Please add stock quantity'],
            min: [0, 'Stock cannot be negative'],
        },
        images: [
            {
                type: String,
                required: true,
            },
        ],
        category: {
            type: String,
            required: [true, 'Please assign a category'],
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);