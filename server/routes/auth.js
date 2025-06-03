const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Input validation middleware
const validateInput = (req, res, next) => {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Phone number validation (basic format)
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

// Register User
router.post('/register', validateInput, async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ phoneNumber });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            phoneNumber,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login User
router.post('/login', validateInput, async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'default_secret_key_for_development',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 