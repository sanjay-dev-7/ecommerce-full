const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware'); // Import the guard

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Apply the 'protect' middleware right before the controller
router.get('/profile', protect, getUserProfile); 

module.exports = router;