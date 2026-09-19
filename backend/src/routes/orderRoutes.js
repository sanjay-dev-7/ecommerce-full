const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getAllOrders,
  deleteOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Specific collection routes
router.route('/')
  .post(protect, addOrderItems);

router.route('/myorders')
  .get(protect, getMyOrders);

// Admin route: fetch all orders across all customers
router.route('/all')
  .get(protect, admin, getAllOrders);

// Dynamic ID routes
router.route('/:id')
  .get(protect, getOrderById)
  .delete(protect, deleteOrder);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

module.exports = router;