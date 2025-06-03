const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      shippingDetails,
      paymentMethod
    } = req.body;

    // Create new order
    const order = new Order({
      userId: req.user.userId,
      items,
      totalAmount,
      shippingDetails,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
      orderStatus: 'processing'
    });

    // Save order
    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], totalAmount: 0 }
    );

    // Emit new order event to admin room
    const io = req.app.get('io');
    io.to('admin').emit('newOrder', {
      orderId: order._id,
      userId: req.user.userId,
      totalAmount,
      orderStatus: 'processing'
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get single order
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Cancel order (user only)
router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation if order is still processing
    if (order.orderStatus !== 'processing') {
      return res.status(400).json({
        message: 'Cannot cancel order that is already shipped or delivered'
      });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    // Emit order cancellation event to admin room
    const io = req.app.get('io');
    io.to('admin').emit('orderCancelled', {
      orderId: order._id,
      userId: req.user.userId
    });

    // ALSO emit order status update event to the user room
    io.to(req.user.userId.toString()).emit('orderStatusUpdate', {
      orderId: order._id,
      status: 'cancelled'
    });

    res.json(order);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Error cancelling order' });
  }
});

module.exports = router;
