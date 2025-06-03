const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const adminAuth = require('../middleware/adminAuth');

// Get all orders (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// Update order status (admin only)
router.put('/:orderId/status', adminAuth, async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order status
        order.orderStatus = orderStatus;
        await order.save();

        // Get Socket.IO instance
        const io = req.app.get('io');

        // Emit to the specific user who placed the order
        const userIdStr = order.userId ? order.userId.toString() : null;
        if (userIdStr) {
            io.to(userIdStr).emit('orderStatusUpdate', {
                orderId: order._id,
                status: orderStatus
            });
        }

        // Also emit to admin room (admin frontend)
        io.to('admin').emit('orderStatusUpdate', {
            orderId: order._id,
            status: orderStatus
        });

        res.json(order);
    } catch (err) {
        console.error('Error updating order:', err);
        res.status(500).json({ message: 'Error updating order' });
    }
});

// Delete order (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.remove();
        res.json({ message: 'Order deleted' });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ message: 'Error deleting order' });
    }
});

module.exports = router;
