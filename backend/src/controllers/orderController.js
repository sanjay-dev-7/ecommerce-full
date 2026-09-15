const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod = 'Razorpay',
      totalAmount,
      totalPrice,
      razorpayOrderId
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    // Calculate total if not explicitly provided
    const calculatedTotal = totalAmount ?? totalPrice ?? orderItems.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount: calculatedTotal,
      totalPrice: calculatedTotal, // handles schemas that name it totalPrice
      razorpayOrderId: razorpayOrderId || null,
      orderStatus: 'pending',
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('❌ Error creating order in DB:', error);
    res.status(500).json({ message: error.message || 'Failed to create order' });
  }
};
// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Allow access only to the order owner or an Admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ message: 'Failed to retrieve order', error: error.message });
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch your orders', error: error.message });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/all
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch all orders', error: error.message });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getAllOrders
};