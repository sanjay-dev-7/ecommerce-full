const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                price: { type: Number, required: true }, // The price at the time of purchase
            },
        ],
        shippingAddress: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            phone: { type: String, required: true },
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentIntentId: {
            type: String,
            // Will be populated once Stripe confirms payment
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);