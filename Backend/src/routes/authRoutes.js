const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/requireAuth');
const router = express.Router();

// Register
router.post('/register', authController.register.bind(authController));

// Login
router.post('/login', authController.login.bind(authController));

// Logout
router.post('/logout', requireAuth, authController.logout.bind(authController));

// Get current user
router.get('/me', requireAuth, authController.getCurrentUser.bind(authController));

// Update user profile
router.put('/:id/profile', requireAuth, authController.updateProfile.bind(authController));

// Change password
router.put('/:id/change-password', requireAuth, authController.changePassword.bind(authController));

module.exports = router;
