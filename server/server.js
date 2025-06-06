const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const itemRoutes = require('./routes/items');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminOrderRoutes = require('./routes/adminOrders');
const paymentRoutes = require('./routes/paymentRoutes');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://srisaijucies-admin.onrender.com',
    'https://srisaijucies-client.onrender.com'
];

// --- FIXED CORS MIDDLEWARE ---
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Socket.IO setup
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    if (socket.user.isAdmin) {
        socket.join('admin');
        console.log('Admin joined admin room');
    } else {
        socket.join(socket.user.id);
        console.log(`User ${socket.user.id} joined their room`);
    }

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make io accessible to routes
app.set('io', io);

// Stripe webhook must use raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Connect to DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/payments', paymentRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
});
