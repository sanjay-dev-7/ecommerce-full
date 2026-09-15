const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
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
// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, price, description, image, category, countInStock, stock } = req.body;

    const quantity = Number(countInStock ?? stock ?? 0);

    const product = new Product({
      user: req.user?._id, // Required if your schema references the admin who created it
      name,
      price: Number(price),
      description: description || 'No description provided',
      image: image || 'https://via.placeholder.com/150',
      category: category || 'Electronics',
      stock: quantity,
      countInStock: quantity,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ message: error.message, error });
  }
};
// @desc    Update an entire product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, price, description, image, category, countInStock, stock } = req.body;
    const targetStock = countInStock !== undefined ? countInStock : stock;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name || product.name;
    product.price = price !== undefined ? price : product.price;
    product.description = description || product.description;
    product.image = image || product.image;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock;

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// @desc    Adjust inventory count only
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
const updateProductStock = async (req, res) => {
  try {
    const { countInStock, stock } = req.body;
    const targetStock = countInStock !== undefined ? countInStock : stock;

    if (targetStock === undefined || isNaN(targetStock)) {
      return res.status(400).json({ message: 'Valid stock count is required' });
    }

    // Support schema variations (countInStock vs stock)
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { countInStock: Number(targetStock), stock: Number(targetStock) } },
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
  deleteProduct
};