const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_for_development');
        
        // Check if the token has isAdmin flag
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = adminAuth; 