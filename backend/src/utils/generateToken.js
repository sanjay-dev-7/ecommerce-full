const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  // Cross-domain cookie configuration for Vercel <-> Render
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,      // Must be true over HTTPS in production
    sameSite: 'none',  // Required for cross-site requests
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return token; // Return token string for the JSON response
};

module.exports = generateToken;