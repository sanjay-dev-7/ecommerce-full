const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getAllOrders
} = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Specific routes first to prevent parameter collisions
router.route('/')
  .post(protect, addOrderItems);

router.route('/myorders')
  .get(protect, getMyOrders);

// Admin route: fetch all orders across all customers
router.route('/all')
  .get(protect, admin, getAllOrders);

// Dynamic ID route goes last
router.route('/:id')
  .get(protect, getOrderById);

module.exports = router;