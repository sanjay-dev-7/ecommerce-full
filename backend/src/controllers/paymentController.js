const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TZ4A4Gc6CNe03Y',
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

    // Case-insensitive status check
    const currentStatus = order.orderStatus ? order.orderStatus.toLowerCase() : '';
    if (currentStatus !== 'pending') {
      return res.status(400).json({ message: 'Order is already paid or processing' });
    }

    // Razorpay expects amount in paise (multiply by 100)
    const options = {
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: `rcpt_${order._id.toString().slice(-10)}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      id: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount,
    });
  } catch (error) {
    console.error('RAZORPAY ERROR STACK:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Verify Razorpay payment signature, decrement stock atomically, or refund if out of stock
// @route   POST /api/payments/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Validate signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 2. Prevent duplicate stock deductions on retries
    if (order.isPaid || order.orderStatus?.toLowerCase() === 'paid') {
      return res.status(200).json({
        message: 'Order already verified and paid',
        order,
      });
    }

    // 3. Atomically decrement stock for both `stock` and `countInStock`
    const decrementedItems = [];

    for (const item of order.orderItems) {
      const qty = Number(item.quantity) || 1;

      // Decrement only if inventory is sufficient
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          $or: [{ countInStock: { $gte: qty } }, { stock: { $gte: qty } }],
        },
        {
          $inc: {
            countInStock: -qty,
            stock: -qty,
          },
        },
        { new: true }
      );

      // Race condition: Item ran out before completion
      if (!updatedProduct) {
        // Rollback already deducted items in this order
        for (const rollbackItem of decrementedItems) {
          const rQty = Number(rollbackItem.quantity) || 1;
          await Product.findByIdAndUpdate(rollbackItem.product, {
            $inc: { countInStock: rQty, stock: rQty },
          });
        }

        // Use valid schema enum 'Cancelled'
        order.orderStatus = 'cancelled';
        await order.save();

        // Issue instant automated refund via Razorpay
        await razorpayInstance.payments.refund(razorpay_payment_id, {
          notes: {
            reason: 'Item went out of stock during checkout',
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

    // 4. Mark order as Paid (Capitalized to pass Mongoose enum validation)
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
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