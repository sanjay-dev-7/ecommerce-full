const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
    // 1. Create the JWT payload
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });

    // 2. Set the token in an HTTP-Only Cookie
    res.cookie('jwt', token, {
        httpOnly: true, // Crucial: Prevents XSS attacks (JS cannot read the cookie)
        secure: process.env.NODE_ENV !== 'development', // Uses HTTPS in production
        sameSite: 'strict', // Prevents Cross-Site Request Forgery (CSRF) attacks
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    });
};

module.exports = generateToken;