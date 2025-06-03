const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hardcoded admin credentials
const ADMIN_PHONE = '6302677481';
const ADMIN_PASSWORD = 'admin123';

// Input validation middleware
const validateAdminInput = (req, res, next) => {
    const { phoneNumber, password } = req.body;
    
    if (!phoneNumber || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Phone number validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Password validation (minimum 6 characters)
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    next();
};

// Admin Login
router.post('/login', validateAdminInput, async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        // Check if credentials match hardcoded admin
        if (phoneNumber !== ADMIN_PHONE || password !== ADMIN_PASSWORD) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                isAdmin: true,
                phoneNumber: ADMIN_PHONE
            },
            process.env.JWT_SECRET || 'default_secret_key_for_development',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            admin: {
                phoneNumber: ADMIN_PHONE
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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

// Protected admin route example
router.get('/profile', verifyAdminToken, (req, res) => {
    res.json({
        phoneNumber: ADMIN_PHONE,
        isAdmin: true
    });
});

module.exports = router; 