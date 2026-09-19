const Product = require('../models/Product');

// Helper to normalize image input (single string or array) into an array of strings
const formatImages = (images, image) => {
  if (Array.isArray(images) && images.length > 0) {
    return images.filter(Boolean);
  }
  if (typeof image === 'string' && image.trim() !== '') {
    return [image.trim()];
  }
  return ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500'];
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to retrieve products', error: error.message });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Failed to retrieve product', error: error.message });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, price, description, image, images, category, countInStock, stock } = req.body;

    const stockQty = Number(stock ?? countInStock ?? 0);
    const resolvedImages = formatImages(images, image);

    const product = new Product({
      name: name?.trim(),
      price: Number(price),
      description: description?.trim() || 'No description provided',
      images: resolvedImages,
      category: category?.trim() || 'General',
      stock: stockQty,
      isActive: true,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message, error });
  }
};

// @desc    Update an entire product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, price, description, image, images, category, countInStock, stock, isActive } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name !== undefined) product.name = name.trim();
    if (price !== undefined) product.price = Number(price);
    if (description !== undefined) product.description = description.trim();
    if (category !== undefined) product.category = category.trim();
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    const targetStock = stock !== undefined ? stock : countInStock;
    if (targetStock !== undefined) {
      product.stock = Number(targetStock);
    }

    if (images !== undefined || image !== undefined) {
      product.images = formatImages(images, image);
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: 'Failed to update product', error: error.message });
  }
};

// @desc    Adjust inventory count only
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
const updateProductStock = async (req, res) => {
  try {
    const { countInStock, stock } = req.body;
    const targetStock = stock !== undefined ? stock : countInStock;

    if (targetStock === undefined || isNaN(targetStock) || Number(targetStock) < 0) {
      return res.status(400).json({ message: 'Valid non-negative stock count is required' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { stock: Number(targetStock) } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating stock count:', error);
    res.status(500).json({ message: 'Failed to adjust stock', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product successfully removed' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
};