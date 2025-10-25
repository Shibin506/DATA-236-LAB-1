const { pool } = require('../config/database');

class FavoriteService {
  // Add property to favorites
  async addToFavorites(propertyId, userId) {
    const connection = await pool.getConnection();
    
    try {
      // Check if property exists and is active
      const [properties] = await connection.execute(
        'SELECT id FROM properties WHERE id = ? AND is_active = TRUE',
        [propertyId]
      );
      
      if (properties.length === 0) {
        throw new Error('Property not found or not available');
      }
      
      // Check if already in favorites
      const [existingFavorites] = await connection.execute(
        'SELECT id FROM favorites WHERE user_id = ? AND property_id = ?',
        [userId, propertyId]
      );
      
      if (existingFavorites.length > 0) {
        throw new Error('Property is already in your favorites');
      }
      
      // Add to favorites
      const [result] = await connection.execute(
        'INSERT INTO favorites (user_id, property_id, created_at) VALUES (?, ?, NOW())',
        [userId, propertyId]
      );
      
      return {
        id: result.insertId,
        property_id: propertyId,
        user_id: userId
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Get user favorites
  async getUserFavorites(userId, filters = {}) {
    const connection = await pool.getConnection();
    
    try {
      const { page = 1, limit = 10 } = filters;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      const [favorites] = await connection.execute(`
        SELECT f.id, f.created_at, p.id as property_id, p.name, p.description, p.property_type,
               p.address, p.city, p.state, p.country, p.price_per_night, p.bedrooms, p.bathrooms,
               p.max_guests, p.amenities, u.name as owner_name
        FROM favorites f
        JOIN properties p ON f.property_id = p.id
        JOIN users u ON p.owner_id = u.id
        WHERE f.user_id = ? AND p.is_active = TRUE
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limitNum, offset]);
      
      return {
        favorites,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: favorites.length
        }
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Remove from favorites
  async removeFromFavorites(favoriteId, userId) {
    const connection = await pool.getConnection();
    
    try {
      // Check if favorite exists and belongs to user
      const [favorites] = await connection.execute(
        'SELECT id FROM favorites WHERE id = ? AND user_id = ?',
        [favoriteId, userId]
      );
      
      if (favorites.length === 0) {
        throw new Error('Favorite not found or you do not have permission to remove it');
      }
      
      // Remove from favorites
      await connection.execute(
        'DELETE FROM favorites WHERE id = ?',
        [favoriteId]
      );
      
      return { success: true };
      
    } finally {
      connection.release();
    }
  }
  
  // Check if property is in favorites
  async checkFavoriteStatus(propertyId, userId) {
    const connection = await pool.getConnection();
    
    try {
      const [favorites] = await connection.execute(
        'SELECT id FROM favorites WHERE user_id = ? AND property_id = ?',
        [userId, propertyId]
      );
      
      return {
        is_favorite: favorites.length > 0,
        favorite_id: favorites.length > 0 ? favorites[0].id : null
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Get favorite count for property
  async getPropertyFavoriteCount(propertyId) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        'SELECT COUNT(*) as count FROM favorites WHERE property_id = ?',
        [propertyId]
      );
      
      return result[0].count;
      
    } finally {
      connection.release();
    }
  }
  
  // Get user's favorite count
  async getUserFavoriteCount(userId) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
        [userId]
      );
      
      return result[0].count;
      
    } finally {
      connection.release();
    }
  }
}

module.exports = new FavoriteService();
