const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Initialize Razorpay
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Razorpay Order
// @route   POST /api/payments/create-razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to pay for this order' });
        }

        if (order.orderStatus !== 'pending') {
            return res.status(400).json({ message: 'Order is already paid or processing' });
        }

        // Razorpay expects amount in paise (multiply by 100)
        const options = {
            amount: Math.round(order.totalAmount * 100),
            currency: 'INR',
            receipt: `receipt_order_${order._id}`,
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        res.status(200).json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
        });
    } catch (error) {
        console.error("RAZORPAY ERROR STACK:", error);
        res.status(500).json({ message: 'Server Error', error: error.message, details: error.error || error });
    }
};

// @desc    Verify Razorpay payment signature, decrement stock atomically, or refund if out of stock
// @route   POST /api/payments/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // 1. Generate the expected signature using HMAC SHA256
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // 2. Compare expected signature with the signature returned by Razorpay
        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // 3. Atomically decrement stock only if enough inventory exists
        const decrementedItems = [];

        for (const item of order.orderItems) {
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );

            // Race condition hit: Someone else claimed the last item first!
            if (!updatedProduct) {
                // Roll back any items previously decremented in this multi-item order
                for (const rollbackItem of decrementedItems) {
                    await Product.findByIdAndUpdate(rollbackItem.product, {
                        $inc: { stock: rollbackItem.quantity },
                    });
                }

                // Update order status to Cancelled
                order.orderStatus = 'cancelled - out of stock';
                await order.save();

                // Issue an immediate automated refund via Razorpay
                await razorpayInstance.payments.refund(razorpay_payment_id, {
                    notes: {
                        reason: 'Item went out of stock during simultaneous checkout',
                        orderId: order._id.toString(),
                    },
                });

                return res.status(409).json({
                    message: 'Item went out of stock while processing. An automatic refund has been issued.',
                    orderStatus: order.orderStatus,
                });
            }

            decrementedItems.push(item);
        }

        // 4. Mark order as Paid only after inventory is confirmed and secured
        order.orderStatus = 'paid';
        order.paymentResult = {
            id: razorpay_payment_id,
            status: 'success',
            update_time: Date.now(),
        };

        const updatedOrder = await order.save();

        res.status(200).json({
            message: 'Payment verified, stock updated, and order completed successfully',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
};