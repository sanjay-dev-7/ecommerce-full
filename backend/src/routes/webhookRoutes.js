const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');

// Do NOT use auth middleware here; Razorpay calls this anonymously
router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;