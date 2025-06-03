const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Verified token payload:', verified); // Debug log

    // Fix here: check for userId, not id
    if (!verified.userId) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    req.user = verified;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error); // Debug log
    res.status(401).json({
      message: 'Token verification failed, authorization denied',
      error: error.message
    });
  }
};

module.exports = auth;
