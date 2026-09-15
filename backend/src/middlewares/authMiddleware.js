const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes (Must be logged in)
const protect = async (req, res, next) => {
    let token = req.cookies.jwt; // Grab the token from the HTTP-Only cookie

    if (token) {
        try {
            // Verify token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database (exclude the password)
            // Attach the user object to the 'req' object so the controller can use it
            req.user = await User.findById(decoded.id).select('-password');

            next(); // Security passed! Move to the next function
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed or expired' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Middleware to protect Admin-only routes
const admin = (req, res, next) => {
    // protect() must run before admin() so req.user exists
    if (req.user && req.user.role === 'Admin') {
        next(); // User is an admin, let them through
    } else {
        res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
};

module.exports = { protect, admin };