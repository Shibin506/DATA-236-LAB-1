const express = require('express');
const { pool } = require('../config/database');
const { hashPassword, comparePassword, requireAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (traveler or owner)
 * @access  Public
 */
router.post('/register', validate(schemas.userRegistration), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { name, email, password, user_type, phone } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert new user
    const [result] = await connection.execute(
      `INSERT INTO users (name, email, password, user_type, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, user_type || 'traveler', phone || null]
    );
    
    // Create session
    req.session.userId = result.insertId;
    req.session.userType = user_type || 'traveler';
    
    // Return user data (without password)
    const [newUser] = await connection.execute(
      'SELECT id, name, email, user_type, phone, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser[0]
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(schemas.userLogin), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const [users] = await connection.execute(
      'SELECT id, name, email, password, user_type, is_verified, created_at FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = users[0];
    
    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Create session
    req.session.userId = user.id;
    req.session.userType = user.user_type;
    
    // Remove password from response
    delete user.password;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    res.clearCookie('airbnb.session');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [users] = await connection.execute(
      `SELECT id, name, email, phone, about_me, city, state, country, 
              languages, gender, profile_picture, user_type, is_verified, 
              created_at, updated_at 
       FROM users WHERE id = ?`,
      [req.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/auth/session
 * @desc    Check if user is authenticated
 * @access  Public
 */
router.get('/session', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      success: true,
      authenticated: true,
      data: {
        userId: req.session.userId,
        userType: req.session.userType
      }
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }
    
    // Get current user password
    const [users] = await connection.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, users[0].password);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);
    
    // Update password
    await connection.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.userId]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
