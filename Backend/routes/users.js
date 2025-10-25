const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../config/database');
const { requireAuth, requireOwner, requireTraveler } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', requireAuth, async (req, res) => {
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', requireAuth, validate(schemas.profileUpdate), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const allowedFields = ['name', 'phone', 'about_me', 'city', 'state', 'country', 'languages', 'gender'];
    const updateFields = {};
    const updateValues = [];
    
    // Build update query dynamically
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        updateFields[key] = req.body[key];
        updateValues.push(req.body[key]);
      }
    });
    
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Add updated_at to the update
    updateFields.updated_at = 'CURRENT_TIMESTAMP';
    updateValues.push(req.userId);
    
    const setClause = Object.keys(updateFields).map(key => 
      key === 'updated_at' ? `${key} = ${updateFields[key]}` : `${key} = ?`
    ).join(', ');
    
    await connection.execute(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      updateValues
    );
    
    // Get updated user data
    const [updatedUsers] = await connection.execute(
      `SELECT id, name, email, phone, about_me, city, state, country, 
              languages, gender, profile_picture, user_type, is_verified, 
              created_at, updated_at 
       FROM users WHERE id = ?`,
      [req.userId]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUsers[0]
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   POST /api/users/upload-profile-picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/upload-profile-picture', requireAuth, upload.single('profile_picture'), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
    
    // Update user profile picture
    await connection.execute(
      'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [profilePictureUrl, req.userId]
    );
    
    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profile_picture: profilePictureUrl
      }
    });
    
  } catch (error) {
    console.error('Upload profile picture error:', error);
    
    // Clean up uploaded file if database update failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   DELETE /api/users/profile-picture
 * @desc    Delete profile picture
 * @access  Private
 */
router.delete('/profile-picture', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Get current profile picture path
    const [users] = await connection.execute(
      'SELECT profile_picture FROM users WHERE id = ?',
      [req.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const currentPicture = users[0].profile_picture;
    
    // Remove profile picture from database
    await connection.execute(
      'UPDATE users SET profile_picture = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.userId]
    );
    
    // Delete file from filesystem if it exists
    if (currentPicture && currentPicture.startsWith('/uploads/profiles/')) {
      try {
        const filePath = path.join(__dirname, '..', currentPicture);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Failed to delete profile picture file:', fileError);
        // Don't fail the request if file deletion fails
      }
    }
    
    res.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/users/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.userId;
    const userType = req.userType;
    
    let dashboardData = {};
    
    if (userType === 'traveler') {
      // Get traveler's recent bookings
      const [recentBookings] = await connection.execute(
        `SELECT b.id, b.check_in_date, b.check_out_date, b.status, b.total_price,
                p.name as property_name, p.city, p.state, p.country,
                u.name as owner_name
         FROM bookings b
         JOIN properties p ON b.property_id = p.id
         JOIN users u ON b.owner_id = u.id
         WHERE b.traveler_id = ?
         ORDER BY b.created_at DESC
         LIMIT 5`,
        [userId]
      );
      
      // Get traveler's favorite properties count
      const [favoritesCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM favorites WHERE traveler_id = ?',
        [userId]
      );
      
      dashboardData = {
        recent_bookings: recentBookings,
        favorites_count: favoritesCount[0].count,
        user_type: 'traveler'
      };
      
    } else if (userType === 'owner') {
      // Get owner's properties
      const [properties] = await connection.execute(
        'SELECT id, name, city, state, price_per_night, is_active, created_at FROM properties WHERE owner_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId]
      );
      
      // Get recent booking requests
      const [recentRequests] = await connection.execute(
        `SELECT b.id, b.check_in_date, b.check_out_date, b.status, b.total_price,
                p.name as property_name,
                u.name as traveler_name, u.email as traveler_email
         FROM bookings b
         JOIN properties p ON b.property_id = p.id
         JOIN users u ON b.traveler_id = u.id
         WHERE b.owner_id = ?
         ORDER BY b.created_at DESC
         LIMIT 5`,
        [userId]
      );
      
      // Get total earnings (completed bookings only)
      const [earnings] = await connection.execute(
        'SELECT COALESCE(SUM(total_price), 0) as total_earnings FROM bookings WHERE owner_id = ? AND status = "completed"',
        [userId]
      );
      
      dashboardData = {
        properties: properties,
        recent_requests: recentRequests,
        total_earnings: earnings[0].total_earnings,
        user_type: 'owner'
      };
    }
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/users/history
 * @desc    Get user booking/rental history
 * @access  Private
 */
router.get('/history', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.userId;
    const userType = req.userType;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    let history = [];
    
    if (userType === 'traveler') {
      // Get traveler's booking history
      const [bookings] = await connection.execute(
        `SELECT b.id, b.check_in_date, b.check_out_date, b.status, b.total_price, b.number_of_guests,
                b.special_requests, b.created_at,
                p.name as property_name, p.city, p.state, p.country, p.property_type,
                u.name as owner_name, u.email as owner_email
         FROM bookings b
         JOIN properties p ON b.property_id = p.id
         JOIN users u ON b.owner_id = u.id
         WHERE b.traveler_id = ?
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      const [totalCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM bookings WHERE traveler_id = ?',
        [userId]
      );
      
      history = {
        bookings: bookings,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalCount[0].count / limit),
          total_items: totalCount[0].count,
          items_per_page: limit
        }
      };
      
    } else if (userType === 'owner') {
      // Get owner's booking history (bookings for their properties)
      const [bookings] = await connection.execute(
        `SELECT b.id, b.check_in_date, b.check_out_date, b.status, b.total_price, b.number_of_guests,
                b.special_requests, b.created_at,
                p.name as property_name, p.city, p.state, p.country,
                u.name as traveler_name, u.email as traveler_email
         FROM bookings b
         JOIN properties p ON b.property_id = p.id
         JOIN users u ON b.traveler_id = u.id
         WHERE b.owner_id = ?
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      const [totalCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM bookings WHERE owner_id = ?',
        [userId]
      );
      
      history = {
        bookings: bookings,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalCount[0].count / limit),
          total_items: totalCount[0].count,
          items_per_page: limit
        }
      };
    }
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
