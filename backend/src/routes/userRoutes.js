const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

// @desc    Get logged in user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, (req, res) => {
  if (req.user) {
    res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

module.exports = router;