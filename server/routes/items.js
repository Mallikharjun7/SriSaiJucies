const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const jwt = require('jsonwebtoken');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_for_development');
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Input validation middleware
const validateItemInput = (req, res, next) => {
    const { name, imageUrl, price, category, stock } = req.body;
    
    if (!name || !imageUrl || !price || !category || stock === undefined) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (price < 0) {
        return res.status(400).json({ message: 'Price cannot be negative' });
    }

    if (stock < 0) {
        return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    next();
};

// Create new item (Admin only)
router.post('/', verifyAdminToken, validateItemInput, async (req, res) => {
    try {
        const item = new Item(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all items (Public)
router.get('/', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get item by ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update item (Admin only)
router.put('/:id', verifyAdminToken, validateItemInput, async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete item (Admin only)
router.delete('/:id', verifyAdminToken, async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get items by category (Public)
router.get('/category/:category', async (req, res) => {
    try {
        const items = await Item.find({ category: req.params.category }).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Get items by category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get special items (Public)
router.get('/special/items', async (req, res) => {
    try {
        const items = await Item.find({ isSpecial: true }).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Get special items error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 