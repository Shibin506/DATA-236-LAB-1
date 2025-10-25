const express = require('express');
const { pool } = require('../config/database');
const { requireTraveler } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/favorites
 * @desc    Get traveler's favorite properties
 * @access  Private (Traveler)
 */
router.get('/', requireTraveler, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get favorite properties
    const [favorites] = await connection.execute(
      `SELECT f.id as favorite_id, f.created_at as favorited_at,
              p.id as property_id, p.name, p.description, p.property_type, 
              p.city, p.state, p.country, p.price_per_night, p.bedrooms, 
              p.bathrooms, p.max_guests, p.amenities, p.is_active,
              pi.image_url as main_image,
              u.name as owner_name, u.profile_picture as owner_avatar,
              AVG(r.rating) as average_rating,
              COUNT(r.id) as review_count
       FROM favorites f
       JOIN properties p ON f.property_id = p.id
       JOIN users u ON p.owner_id = u.id
       LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.image_type = 'main'
       LEFT JOIN reviews r ON p.id = r.property_id
       WHERE f.traveler_id = ?
       GROUP BY f.id, f.created_at, p.id, p.name, p.description, p.property_type, 
                p.city, p.state, p.country, p.price_per_night, p.bedrooms, 
                p.bathrooms, p.max_guests, p.amenities, p.is_active,
                pi.image_url, u.name, u.profile_picture
       ORDER BY f.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [req.userId]
    );
    
    // Get total count
    const [totalCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM favorites WHERE traveler_id = ?',
      [req.userId]
    );
    
    res.json({
      success: true,
      data: {
        favorites: favorites,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalCount[0].count / limit),
          total_items: totalCount[0].count,
          items_per_page: limit
        }
      }
    });
    
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favorite properties'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   POST /api/favorites
 * @desc    Add property to favorites
 * @access  Private (Traveler)
 */
router.post('/', requireTraveler, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { property_id } = req.body;
    
    if (!property_id) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }
    
    const propertyId = property_id;
    
    // Check if property exists and is active
    const [properties] = await connection.execute(
      'SELECT id FROM properties WHERE id = ? AND is_active = TRUE',
      [propertyId]
    );
    
    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or not available'
      });
    }
    
    // Check if already favorited
    const [existingFavorites] = await connection.execute(
      'SELECT id FROM favorites WHERE traveler_id = ? AND property_id = ?',
      [req.userId, propertyId]
    );
    
    if (existingFavorites.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Property is already in your favorites'
      });
    }
    
    // Add to favorites
    const [result] = await connection.execute(
      'INSERT INTO favorites (traveler_id, property_id) VALUES (?, ?)',
      [req.userId, propertyId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Property added to favorites',
      data: {
        favorite_id: result.insertId,
        property_id: propertyId
      }
    });
    
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add property to favorites'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   DELETE /api/favorites/:propertyId
 * @desc    Remove property from favorites
 * @access  Private (Traveler)
 */
router.delete('/:propertyId', requireTraveler, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const propertyId = req.params.propertyId;
    
    // Check if favorite exists
    const [existingFavorites] = await connection.execute(
      'SELECT id FROM favorites WHERE traveler_id = ? AND property_id = ?',
      [req.userId, propertyId]
    );
    
    if (existingFavorites.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property is not in your favorites'
      });
    }
    
    // Remove from favorites
    await connection.execute(
      'DELETE FROM favorites WHERE traveler_id = ? AND property_id = ?',
      [req.userId, propertyId]
    );
    
    res.json({
      success: true,
      message: 'Property removed from favorites',
      data: {
        property_id: propertyId
      }
    });
    
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove property from favorites'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/favorites/check/:propertyId
 * @desc    Check if property is favorited by user
 * @access  Private (Traveler)
 */
router.get('/check/:propertyId', requireTraveler, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const propertyId = req.params.propertyId;
    
    // Check if property is favorited
    const [favorites] = await connection.execute(
      'SELECT id, created_at FROM favorites WHERE traveler_id = ? AND property_id = ?',
      [req.userId, propertyId]
    );
    
    const isFavorited = favorites.length > 0;
    
    res.json({
      success: true,
      data: {
        is_favorited: isFavorited,
        favorite_id: isFavorited ? favorites[0].id : null,
        favorited_at: isFavorited ? favorites[0].created_at : null
      }
    });
    
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/favorites/count
 * @desc    Get count of favorite properties
 * @access  Private (Traveler)
 */
router.get('/count', requireTraveler, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [count] = await connection.execute(
      'SELECT COUNT(*) as count FROM favorites WHERE traveler_id = ?',
      [req.userId]
    );
    
    res.json({
      success: true,
      data: {
        favorites_count: count[0].count
      }
    });
    
  } catch (error) {
    console.error('Get favorites count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favorites count'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   DELETE /api/favorites/clear
 * @desc    Clear all favorites
 * @access  Private (Traveler)
 */
router.delete('/clear', requireTraveler, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Get count before deletion
    const [count] = await connection.execute(
      'SELECT COUNT(*) as count FROM favorites WHERE traveler_id = ?',
      [req.userId]
    );
    
    // Clear all favorites
    await connection.execute(
      'DELETE FROM favorites WHERE traveler_id = ?',
      [req.userId]
    );
    
    res.json({
      success: true,
      message: 'All favorites cleared successfully',
      data: {
        removed_count: count[0].count
      }
    });
    
  } catch (error) {
    console.error('Clear favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear favorites'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
