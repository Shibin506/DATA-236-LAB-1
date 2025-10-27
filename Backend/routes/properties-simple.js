const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Simple property search
router.get('/search', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { location, guests, min_price, max_price, page = 1, limit = 10 } = req.query;
    
    let whereConditions = ['p.is_active = TRUE'];
    let queryParams = [];
    
    if (location) {
      whereConditions.push('(p.city LIKE ? OR p.state LIKE ? OR p.country LIKE ?)');
      const locationParam = `%${location}%`;
      queryParams.push(locationParam, locationParam, locationParam);
    }
    
    if (guests) {
      whereConditions.push('p.max_guests >= ?');
      queryParams.push(parseInt(guests));
    }
    
    if (min_price) {
      whereConditions.push('p.price_per_night >= ?');
      queryParams.push(parseInt(min_price));
    }
    
    if (max_price) {
      whereConditions.push('p.price_per_night <= ?');
      queryParams.push(parseInt(max_price));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    const searchQuery = `
      SELECT p.id, p.name, p.description, p.property_type, p.address, p.city, p.state, p.country,
             p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests, p.amenities,
             p.created_at, u.name as owner_name
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const [properties] = await connection.execute(searchQuery, queryParams);
    
    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: properties.length
        }
      }
    });
    
  } catch (error) {
    console.error('Property search error:', error);
    res.status(500).json({
      success: false,
      message: 'Property search failed'
    });
  } finally {
    connection.release();
  }
});

// Get all properties
router.get('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [properties] = await connection.execute(`
      SELECT p.id, p.name, p.description, p.property_type, p.address, p.city, p.state, p.country,
             p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests, p.amenities,
             p.created_at, u.name as owner_name
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      WHERE p.is_active = TRUE
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      data: { properties }
    });
    
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
