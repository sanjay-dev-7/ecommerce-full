const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/paymentController');

router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyRazorpayPayment);

module.exports = router;