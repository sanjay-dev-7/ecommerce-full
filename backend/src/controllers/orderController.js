const mongoose = require('mongoose');
const Order = require('../models/Order');

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
      totalPrice: calculatedTotal,
      razorpayOrderId: razorpayOrderId || null,
      orderStatus: 'pending',
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message || 'Failed to create order' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const reqUserId = req.user._id ? req.user._id.toString() : req.user.id.toString();
    const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';

    if (orderUserId !== reqUserId && !isAdmin) {
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

// @desc    Delete/Cancel an unpaid pending order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const reqUserId = req.user?._id ? req.user._id.toString() : req.user?.id?.toString();
    const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
    const isAdmin = req.user?.role && req.user.role.toLowerCase() === 'admin';

    if (orderUserId !== reqUserId && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to remove this order' });
    }

    const currentStatus = (order.orderStatus || order.status || '').toLowerCase();
    if (currentStatus === 'paid') {
      return res.status(400).json({ message: 'Cannot remove an already paid order' });
    }

    await Order.findByIdAndDelete(id);
    res.status(200).json({ message: 'Order removed successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: error.message || 'Failed to remove order' });
  }
};
// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!status || !allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.orderStatus = status.toLowerCase();

    // Mark delivery timestamp if transitioned to delivered
    if (status.toLowerCase() === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message || 'Server error updating status' });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  getMyOrders,
  updateOrderStatus,
  getAllOrders,
  deleteOrder,
};