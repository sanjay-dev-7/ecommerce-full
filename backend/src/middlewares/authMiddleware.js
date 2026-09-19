const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes (Must be logged in)
const protect = async (req, res, next) => {
  let token;

  // 1. Check Bearer token in the Authorization header (Cross-domain safe)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to HTTP-only cookie if header is not present
  else if (req.cookies && (req.cookies.jwt || req.cookies.token)) {
    token = req.cookies.jwt || req.cookies.token;
  }

  if (token) {
    try {
      // Verify token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Support both decoded.userId and decoded.id
      const userId = decoded.userId || decoded.id;
      req.user = await User.findById(userId).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Security passed!
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware to protect Admin-only routes
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

module.exports = { protect, admin };