const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Listen for Razorpay Webhooks (order.paid, payment.captured)
// @route   POST /api/webhooks/razorpay
// @access  Public (Validated by Razorpay Signature)
const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const razorpaySignature = req.headers['x-razorpay-signature'];

  // 1. Verify webhook signature using the raw body buffer
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    console.error('⚠️ Invalid webhook signature received.');
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  // 2. Handle successful payment events
  if (event === 'order.paid') {
    const razorpayOrder = payload.order.entity;
    const payment = payload.payment.entity;

    // Razorpay receipt contains our MongoDB Order ID: receipt_order_<order_id>
    const orderId = razorpayOrder.receipt.replace('receipt_order_', '');

    const order = await Order.findById(orderId);

    if (order && order.orderStatus !== 'Paid') {
      // Mark as Paid
      order.orderStatus = 'Paid';
      order.paymentResult = {
        id: payment.id,
        status: payment.status,
        update_time: Date.now(),
      };

      await order.save();

      // Decrement inventory atomically
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      console.log(`✅ Webhook processed: Order ${orderId} marked as Paid via webhook.`);
    }
  }

  // 3. Always acknowledge Razorpay with a 200 OK immediately
  res.status(200).json({ status: 'ok' });
};

module.exports = {
  handleRazorpayWebhook,
};