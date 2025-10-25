const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/requireAuth');
const router = express.Router();

// Get user profile
router.get('/:id', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    
    // Users can only view their own profile or public profiles
    if (parseInt(id) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own profile'
      });
    }
    
    const [users] = await connection.execute(
      `SELECT id, name, email, phone, about_me, city, state, country, 
              languages, gender, profile_picture, user_type, is_verified, 
              created_at, updated_at 
       FROM users WHERE id = ?`,
      [id]
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
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  } finally {
    connection.release();
  }
});

// Update user profile
router.put('/:id', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Users can only update their own profile
    if (parseInt(id) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }
    
    // Remove sensitive fields that shouldn't be updated through this endpoint
    delete updateData.password;
    delete updateData.user_type;
    delete updateData.is_verified;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await connection.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateValues]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  } finally {
    connection.release();
  }
});

// Change password
router.put('/:id/change-password', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;
    
    // Users can only change their own password
    if (parseInt(id) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only change your own password'
      });
    }
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Get current password hash
    const [users] = await connection.execute(
      'SELECT password FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);
    
    // Update password
    await connection.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, id]
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

// Upload profile picture
router.post('/:id/profile-picture', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { profile_picture } = req.body;
    
    // Users can only update their own profile picture
    if (parseInt(id) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile picture'
      });
    }
    
    if (!profile_picture) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture URL is required'
      });
    }
    
    // Update profile picture
    await connection.execute(
      'UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE id = ?',
      [profile_picture, id]
    );
    
    res.json({
      success: true,
      message: 'Profile picture updated successfully'
    });
    
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
