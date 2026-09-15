const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public route to fetch all products | Admin route to create a product
router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

// Public route to fetch a single product by ID
router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

// Admin-specific route for rapid inventory adjustments
router.route('/:id/stock')
  .patch(protect, admin, updateProductStock);

module.exports = router;