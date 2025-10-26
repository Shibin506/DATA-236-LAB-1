const { pool } = require('../config/database');

class PropertyService {
  // Get all properties
  async getAllProperties(filters = {}) {
    const connection = await pool.getConnection();
    
    try {
      let whereConditions = ['p.is_active = TRUE'];
      let queryParams = [];
      
      // Apply filters
      if (filters.location) {
        whereConditions.push('(p.city LIKE ? OR p.state LIKE ? OR p.country LIKE ? OR p.address LIKE ?)');
        const locationParam = `%${filters.location}%`;
        queryParams.push(locationParam, locationParam, locationParam, locationParam);
      }
      
      if (filters.city) {
        whereConditions.push('p.city LIKE ?');
        queryParams.push(`%${filters.city}%`);
      }
      
      if (filters.state) {
        whereConditions.push('p.state LIKE ?');
        queryParams.push(`%${filters.state}%`);
      }
      
      if (filters.guests) {
        whereConditions.push('p.max_guests >= ?');
        queryParams.push(parseInt(filters.guests));
      }
      
      if (filters.min_price) {
        whereConditions.push('p.price_per_night >= ?');
        queryParams.push(parseInt(filters.min_price));
      }
      
      if (filters.max_price) {
        whereConditions.push('p.price_per_night <= ?');
        queryParams.push(parseInt(filters.max_price));
      }
      
      if (filters.property_type) {
        whereConditions.push('p.property_type = ?');
        queryParams.push(filters.property_type);
      }
      
      const query = `
        SELECT p.id, p.name, p.description, p.property_type, p.address, p.city, p.state, p.country,
               p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests, p.amenities,
               p.created_at, u.name as owner_name
        FROM properties p
        JOIN users u ON p.owner_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY p.created_at DESC
      `;
      
      const [properties] = await connection.execute(query, queryParams);
      
      // Add images for each property
      for (const property of properties) {
        const [images] = await connection.execute(
          'SELECT id, image_url, image_type, created_at FROM property_images WHERE property_id = ? ORDER BY created_at',
          [property.id]
        );
        property.images = images;
      }
      
      return properties;
      
    } finally {
      connection.release();
    }
  }
  
  // Search properties with pagination
  async searchProperties(searchParams) {
    const connection = await pool.getConnection();
    
    try {
      const {
        location, city, state, guests, min_price, max_price, property_type,
        page = 1, limit = 10
      } = searchParams;
      
      let whereConditions = ['p.is_active = TRUE'];
      let queryParams = [];
      
      if (location) {
        whereConditions.push('(p.city LIKE ? OR p.state LIKE ? OR p.country LIKE ? OR p.address LIKE ?)');
        const locationParam = `%${location}%`;
        queryParams.push(locationParam, locationParam, locationParam, locationParam);
      }
      
      if (city) {
        whereConditions.push('p.city LIKE ?');
        queryParams.push(`%${city}%`);
      }
      
      if (state) {
        whereConditions.push('p.state LIKE ?');
        queryParams.push(`%${state}%`);
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
      
      if (property_type) {
        whereConditions.push('p.property_type = ?');
        queryParams.push(property_type);
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
      
      // Add images for each property
      for (const property of properties) {
        const [images] = await connection.execute(
          'SELECT id, image_url, image_type, created_at FROM property_images WHERE property_id = ? ORDER BY created_at',
          [property.id]
        );
        property.images = images;
      }
      
      return {
        properties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: properties.length
        }
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Get property by ID
  async getPropertyById(propertyId) {
    const connection = await pool.getConnection();
    
    try {
      const [properties] = await connection.execute(`
        SELECT p.*, u.name as owner_name, u.profile_picture as owner_avatar
        FROM properties p
        JOIN users u ON p.owner_id = u.id
        WHERE p.id = ? AND p.is_active = TRUE
      `, [propertyId]);
      
      if (properties.length === 0) {
        throw new Error('Property not found');
      }
      
      const property = properties[0];
      
      // Add images for the property
      const [images] = await connection.execute(
        'SELECT id, image_url, image_type, created_at FROM property_images WHERE property_id = ? ORDER BY created_at',
        [propertyId]
      );
      property.images = images;
      
      return property;
      
    } finally {
      connection.release();
    }
  }

  // Add property images (expects array of { image_url, image_type })
  async addPropertyImages(propertyId, images) {
    const connection = await pool.getConnection();
    try {
      const insertValues = images.map(img => [propertyId, img.image_url, img.image_type || 'gallery'])
      if (insertValues.length === 0) return []
      const [result] = await connection.query(
        'INSERT INTO property_images (property_id, image_url, image_type) VALUES ?',[insertValues]
      )
      return result
    } finally {
      connection.release()
    }
  }

  async getPropertyImageById(imageId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM property_images WHERE id = ?', [imageId])
      return rows[0]
    } finally {
      connection.release()
    }
  }

  async deletePropertyImage(propertyId, imageId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute('DELETE FROM property_images WHERE id = ? AND property_id = ?', [imageId, propertyId])
      return { success: true }
    } finally {
      connection.release()
    }
  }
  
  // Create property
  async createProperty(propertyData, ownerId) {
    const connection = await pool.getConnection();
    
    try {
      const {
        name, description, property_type, address, city, state, country,
        price_per_night, bedrooms, bathrooms, max_guests, amenities, house_rules
      } = propertyData;
      
      const [result] = await connection.execute(
        `INSERT INTO properties (owner_id, name, description, property_type, address, city, state, country,
                                price_per_night, bedrooms, bathrooms, max_guests, amenities, house_rules,
                                created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [ownerId, name, description, property_type, address, city, state, country,
         price_per_night, bedrooms, bathrooms, max_guests, amenities, house_rules]
      );
      
      return {
        id: result.insertId,
        name,
        property_type,
        city,
        state
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Update property
  async updateProperty(propertyId, updateData, ownerId) {
    const connection = await pool.getConnection();
    
    try {
      // Check if property exists and belongs to user
      const [properties] = await connection.execute(
        'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
        [propertyId, ownerId]
      );
      
      if (properties.length === 0) {
        throw new Error('Property not found or you do not have permission to update it');
      }
      
      // Build update query
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(propertyId);
      
      await connection.execute(
        `UPDATE properties SET ${updateFields.join(', ')} WHERE id = ?`,
        [...updateValues]
      );
      
      return { success: true };
      
    } finally {
      connection.release();
    }
  }
  
  // Delete property
  async deleteProperty(propertyId, ownerId, hardDelete = false) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction()
      // Check if property exists and belongs to user
      const [properties] = await connection.execute(
        'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
        [propertyId, ownerId]
      );
      
      if (properties.length === 0) {
        throw new Error('Property not found or you do not have permission to delete it');
      }
      
      if (hardDelete) {
        // Hard delete: remove dependents then the property
        await connection.execute('DELETE FROM property_images WHERE property_id = ?', [propertyId])
        await connection.execute('DELETE FROM favorites WHERE property_id = ?', [propertyId])
        await connection.execute('DELETE FROM reviews WHERE property_id = ?', [propertyId])
        await connection.execute('DELETE FROM bookings WHERE property_id = ?', [propertyId])
        await connection.execute('DELETE FROM properties WHERE id = ?', [propertyId])
      } else {
        // Soft delete
        await connection.execute(
          'UPDATE properties SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
          [propertyId]
        );
      }
      await connection.commit()
      return { success: true };
      
    } finally {
      try { await connection.rollback() } catch (_) {}
      connection.release();
    }
  }
  
  // Get properties by owner
  async getPropertiesByOwner(ownerId, filters = {}) {
    const connection = await pool.getConnection();
    
    try {
      let whereConditions = ['p.owner_id = ?'];
      let queryParams = [ownerId];
      
      if (filters.is_active !== undefined) {
        whereConditions.push('p.is_active = ?');
        queryParams.push(filters.is_active);
      }
      
      const [properties] = await connection.execute(`
        SELECT p.*, u.name as owner_name
        FROM properties p
        JOIN users u ON p.owner_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY p.created_at DESC
      `, queryParams);
      
      return properties;
      
    } finally {
      connection.release();
    }
  }
}

module.exports = new PropertyService();
