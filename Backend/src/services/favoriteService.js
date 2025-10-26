const { pool } = require('../config/database');

// Detect favorites user column once (supports schemas using `user_id` or `traveler_id`)
let FAVORITES_USER_COL = 'user_id'
let favoritesUserColChecked = false
async function ensureFavoritesUserCol(connection) {
  if (favoritesUserColChecked) return FAVORITES_USER_COL
  try {
    const [rows] = await connection.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'favorites' 
         AND COLUMN_NAME IN ('user_id','traveler_id')`
    )
    const names = rows.map(r => r.COLUMN_NAME)
    if (names.includes('user_id')) FAVORITES_USER_COL = 'user_id'
    else if (names.includes('traveler_id')) FAVORITES_USER_COL = 'traveler_id'
    favoritesUserColChecked = true
  } catch (_) {
    // default remains 'user_id' if information_schema unavailable
    favoritesUserColChecked = true
  }
  return FAVORITES_USER_COL
}

class FavoriteService {
  // Add property to favorites
  async addToFavorites(propertyId, userId) {
    const connection = await pool.getConnection();
    
    try {
      const userCol = await ensureFavoritesUserCol(connection)
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
        `SELECT id FROM favorites WHERE ${userCol} = ? AND property_id = ?`,
        [userId, propertyId]
      );
      
      if (existingFavorites.length > 0) {
        throw new Error('Property is already in your favorites');
      }
      
      // Add to favorites
      const [result] = await connection.execute(
        `INSERT INTO favorites (${userCol}, property_id, created_at) VALUES (?, ?, NOW())`,
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
      const userCol = await ensureFavoritesUserCol(connection)
      const { page = 1, limit = 10 } = filters;
      // Sanitize pagination to safe integers and clamp ranges
      const pageNum = Math.max(1, Number.parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(50, Number.parseInt(limit) || 10));
      const offset = Math.max(0, (pageNum - 1) * limitNum);

      // Note: Some MySQL setups error on binding LIMIT/OFFSET as parameters in prepared statements.
      // Embed sanitized numbers directly to avoid HY000 ER_WRONG_ARGUMENTS.
      const [favorites] = await connection.execute(`
        SELECT f.id, f.created_at, p.id as property_id, p.name, p.description, p.property_type,
               p.address, p.city, p.state, p.country, p.price_per_night, p.bedrooms, p.bathrooms,
               p.max_guests, p.amenities, u.name as owner_name
        FROM favorites f
        JOIN properties p ON f.property_id = p.id
        JOIN users u ON p.owner_id = u.id
        WHERE f.${userCol} = ? AND p.is_active = TRUE
        ORDER BY f.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `, [userId]);
      
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
      const userCol = await ensureFavoritesUserCol(connection)
      // First try: treat favoriteId as the favorites.id
      let [favorites] = await connection.execute(
        `SELECT id FROM favorites WHERE id = ? AND ${userCol} = ?`,
        [favoriteId, userId]
      )
      if (favorites.length > 0) {
        await connection.execute('DELETE FROM favorites WHERE id = ?', [favoriteId])
        return { success: true }
      }
      // Second try: treat provided id as property_id (frontend variant)
      ;[favorites] = await connection.execute(
        `SELECT id FROM favorites WHERE ${userCol} = ? AND property_id = ?`,
        [userId, favoriteId]
      )
      if (favorites.length === 0) {
        throw new Error('Favorite not found or you do not have permission to remove it')
      }
      const favId = favorites[0].id
      await connection.execute('DELETE FROM favorites WHERE id = ?', [favId])
      
      return { success: true };
      
    } finally {
      connection.release();
    }
  }
  
  // Check if property is in favorites
  async checkFavoriteStatus(propertyId, userId) {
    const connection = await pool.getConnection();
    
    try {
      const userCol = await ensureFavoritesUserCol(connection)
      const [favorites] = await connection.execute(
        `SELECT id FROM favorites WHERE ${userCol} = ? AND property_id = ?`,
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
      const userCol = await ensureFavoritesUserCol(connection)
      const [result] = await connection.execute(
        `SELECT COUNT(*) as count FROM favorites WHERE ${userCol} = ?`,
        [userId]
      );
      
      return result[0].count;
      
    } finally {
      connection.release();
    }
  }
}

module.exports = new FavoriteService();
