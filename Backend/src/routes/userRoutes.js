const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const { requireAuth } = require('../middleware/requireAuth');
const router = express.Router();

// Multer storage for user profile pictures
const userUploadDir = path.join(__dirname, '..', 'uploads', 'users')
fs.mkdirSync(userUploadDir, { recursive: true })
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, userUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `user-${req.userId}-${Date.now()}${ext}`)
  }
})
const upload = multer({ storage })

// Convenience: current user's profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.userId }).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    console.log('PUT /profile - userId:', req.userId, 'body:', JSON.stringify(req.body));
    const updateData = { ...req.body }
    // Map frontend field to DB column
    if (updateData.about !== undefined && updateData.about_me === undefined) {
      updateData.about_me = updateData.about
      delete updateData.about
    }
    delete updateData.password
    delete updateData.user_type
    delete updateData.is_verified
    delete updateData.created_at
    delete updateData.updated_at
    delete updateData.email  // Don't allow email updates via this route
    
    console.log('Update data after cleaning:', JSON.stringify(updateData));
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success:false, message:'No valid fields to update' })
    }
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log('Updated user:', user ? 'found' : 'not found');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success:true, message:'Profile updated successfully', data: { user } })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success:false, message:'Failed to update profile', error: error.message })
  }
})

// Upload actual file for profile picture; updates users.profile_picture with URL
router.post('/upload-profile-picture', requireAuth, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:'No file uploaded' })
    const urlPath = `/uploads/users/${req.file.filename}`
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profile_picture: urlPath } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success:true, message:'Profile picture updated', data:{ profile_picture: urlPath } })
  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({ success:false, message:'Failed to upload profile picture' })
  }
})

// Delete profile picture
router.delete('/profile-picture', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('profile_picture');
    const current = user?.profile_picture
    
    await User.findByIdAndUpdate(
      req.userId,
      { $set: { profile_picture: null } }
    );
    
    if (current) {
      // current like '/uploads/users/filename.ext' -> extract filename and delete from disk
      const filename = path.basename(current)
      const fp = path.join(userUploadDir, filename)
      fs.unlink(fp, () => {})
    }
    res.json({ success:true, message:'Profile picture removed' })
  } catch (error) {
    console.error('Delete avatar error:', error)
    res.status(500).json({ success:false, message:'Failed to delete profile picture' })
  }
})

// Get user profile
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Convert to number if it's a numeric string
    const userId = isNaN(id) ? id : parseInt(id);
    
    // Users can only view their own profile or public profiles
    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own profile'
      });
    }
    
    const user = await User.findOne({ _id: userId }).select('-password').lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user
      }
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert to number if it's a numeric string
    const userId = isNaN(id) ? id : parseInt(id);
    
    // Users can only update their own profile
    if (userId !== req.userId) {
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
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
    
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/:id/change-password', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;
    
    // Convert to number if it's a numeric string
    const userId = isNaN(id) ? id : parseInt(id);
    
    // Users can only change their own password
    if (userId !== req.userId) {
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
    
    // Get user with password
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
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
  }
});

// Upload profile picture
router.post('/:id/profile-picture', requireAuth, async (req, res) => {
  // Keep legacy endpoint that sets a URL directly
  try {
    const { id } = req.params;
    const { profile_picture } = req.body;
    
    // Convert to number if it's a numeric string
    const userId = isNaN(id) ? id : parseInt(id);
    
    if (userId !== req.userId) {
      return res.status(403).json({ success:false, message:'You can only update your own profile picture' })
    }
    if (!profile_picture) {
      return res.status(400).json({ success:false, message:'Profile picture URL is required' })
    }
    
    await User.findByIdAndUpdate(
      userId,
      { $set: { profile_picture } }
    );
    
    res.json({ success:true, message: 'Profile picture updated successfully' })
  } catch (error) {
    console.error('Upload profile picture error:', error)
    res.status(500).json({ success:false, message:'Failed to update profile picture' })
  }
})

module.exports = router;
