const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../config/database');
const { requireAuth, requireOwner, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Configure multer for property image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/properties');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const propertyId = req.params.id || 'temp';
    cb(null, `property-${propertyId}-${uniqueSuffix}${path.extname(file.originalname)}`);
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  }
});

/**
 * @route   GET /api/properties/search
 * @desc    Search properties with filters
 * @access  Public
 */
router.get('/search', validate(schemas.propertySearch), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const {
      location, city, state, country, check_in_date, check_out_date,
      guests, min_price, max_price, property_type, min_bedrooms,
      amenities, page = 1, limit = 10, sort_by
    } = req.query;
    
    // Build dynamic WHERE clause
    let whereConditions = ['p.is_active = TRUE'];
    let queryParams = [];
    
    // Location search
    if (location) {
      whereConditions.push(`(p.city LIKE ? OR p.state LIKE ? OR p.country LIKE ? OR p.address LIKE ?)`);
      const locationParam = `%${location}%`;
      queryParams.push(locationParam, locationParam, locationParam, locationParam);
    }
    
    // Specific location filters
    if (city) {
      whereConditions.push('p.city LIKE ?');
      queryParams.push(`%${city}%`);
    }
    
    if (state) {
      whereConditions.push('p.state LIKE ?');
      queryParams.push(`%${state}%`);
    }
    
    if (country) {
      whereConditions.push('p.country LIKE ?');
      queryParams.push(`%${country}%`);
    }
    
    // Date availability
    if (check_in_date && check_out_date) {
      whereConditions.push(`NOT EXISTS (
        SELECT 1 FROM bookings b 
        WHERE b.property_id = p.id 
        AND b.status IN ('accepted', 'pending')
        AND (
          (b.check_in_date <= ? AND b.check_out_date > ?) OR
          (b.check_in_date < ? AND b.check_out_date >= ?) OR
          (b.check_in_date >= ? AND b.check_out_date <= ?)
        )
      )`);
      queryParams.push(check_out_date, check_in_date, check_in_date, check_out_date, check_in_date, check_out_date);
    }
    
    // Guest capacity
    if (guests) {
      whereConditions.push('p.max_guests >= ?');
      queryParams.push(guests);
    }
    
    // Price range
    if (min_price) {
      whereConditions.push('p.price_per_night >= ?');
      queryParams.push(min_price);
    }
    
    if (max_price) {
      whereConditions.push('p.price_per_night <= ?');
      queryParams.push(max_price);
    }
    
    // Property type
    if (property_type) {
      whereConditions.push('p.property_type = ?');
      queryParams.push(property_type);
    }
    
    // Minimum bedrooms
    if (min_bedrooms) {
      whereConditions.push('p.bedrooms >= ?');
      queryParams.push(min_bedrooms);
    }
    
    // Amenities search
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      amenityList.forEach(amenity => {
        whereConditions.push('p.amenities LIKE ?');
        queryParams.push(`%${amenity}%`);
      });
    }
    
    // Build ORDER BY clause
    let orderBy = 'p.created_at DESC';
    switch (sort_by) {
      case 'price_low':
        orderBy = 'p.price_per_night ASC';
        break;
      case 'price_high':
        orderBy = 'p.price_per_night DESC';
        break;
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    // Execute search query - simplified version
    const searchQuery = `
      SELECT p.id, p.name, p.description, p.property_type, p.address, p.city, p.state, p.country,
             p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests, p.amenities, p.house_rules,
             p.availability_start, p.availability_end, p.created_at,
             u.name as owner_name, u.profile_picture as owner_avatar
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limitNum, offset);
    
    const [properties] = await connection.execute(searchQuery, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM properties p
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const [countResult] = await connection.execute(countQuery, queryParams.slice(0, -2));
    const totalCount = countResult[0].total;
    
    res.json({
      success: true,
      data: {
        properties: properties,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalCount / limit),
          total_items: totalCount,
          items_per_page: limit
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

/**
 * @route   GET /api/properties/:id
 * @desc    Get property details by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const propertyId = req.params.id;
    
    // Get property details
    const [properties] = await connection.execute(
      `SELECT p.id, p.name, p.description, p.property_type, p.address, p.city, p.state, p.country,
              p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests, p.amenities, p.house_rules,
              p.availability_start, p.availability_end, p.is_active, p.created_at, p.updated_at,
              u.id as owner_id, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
              u.about_me as owner_about, u.profile_picture as owner_avatar,
              AVG(r.rating) as average_rating,
              COUNT(r.id) as review_count
       FROM properties p
       JOIN users u ON p.owner_id = u.id
       LEFT JOIN reviews r ON p.id = r.property_id
       WHERE p.id = ? AND p.is_active = TRUE
       GROUP BY p.id`,
      [propertyId]
    );
    
    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Get property images
    const [images] = await connection.execute(
      'SELECT id, image_url, image_type, display_order FROM property_images WHERE property_id = ? ORDER BY image_type, display_order',
      [propertyId]
    );
    
    // Get recent reviews
    const [reviews] = await connection.execute(
      `SELECT r.id, r.rating, r.review_text, r.created_at,
              u.name as reviewer_name, u.profile_picture as reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.property_id = ?
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [propertyId]
    );
    
    // Check if user has favorited this property
    let isFavorited = false;
    if (req.userId) {
      const [favorites] = await connection.execute(
        'SELECT id FROM favorites WHERE traveler_id = ? AND property_id = ?',
        [req.userId, propertyId]
      );
      isFavorited = favorites.length > 0;
    }
    
    const property = {
      ...properties[0],
      images: images,
      reviews: reviews,
      is_favorited: isFavorited
    };
    
    res.json({
      success: true,
      data: {
        property: property
      }
    });
    
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get property details'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   POST /api/properties
 * @desc    Create new property (Owner only)
 * @access  Private (Owner)
 */
router.post('/', requireOwner, validate(schemas.propertyCreate), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const {
      name, description, property_type, address, city, state, country,
      price_per_night, bedrooms, bathrooms, max_guests, amenities,
      house_rules, availability_start, availability_end
    } = req.body;
    
    // Insert property
    const [result] = await connection.execute(
      `INSERT INTO properties (
        owner_id, name, description, property_type, address, city, state, country,
        price_per_night, bedrooms, bathrooms, max_guests, amenities, house_rules,
        availability_start, availability_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId, name, description, property_type, address, city, state, country,
        price_per_night, bedrooms, bathrooms, max_guests, amenities, house_rules,
        availability_start, availability_end
      ]
    );
    
    // Get created property
    const [newProperty] = await connection.execute(
      `SELECT p.id, p.name, p.description, p.property_type, p.address, p.city, p.state, p.country,
              p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests, p.amenities, p.house_rules,
              p.availability_start, p.availability_end, p.is_active, p.created_at
       FROM properties p WHERE p.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: {
        property: newProperty[0]
      }
    });
    
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   PUT /api/properties/:id
 * @desc    Update property (Owner only)
 * @access  Private (Owner)
 */
router.put('/:id', requireOwner, validate(schemas.propertyUpdate), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const propertyId = req.params.id;
    
    // Check if property exists and belongs to user
    const [existingProperties] = await connection.execute(
      'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
      [propertyId, req.userId]
    );
    
    if (existingProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have permission to update it'
      });
    }
    
    // Build update query dynamically
    const allowedFields = [
      'name', 'description', 'property_type', 'address', 'city', 'state', 'country',
      'price_per_night', 'bedrooms', 'bathrooms', 'max_guests', 'amenities',
      'house_rules', 'availability_start', 'availability_end', 'is_active'
    ];
    
    const updateFields = {};
    const updateValues = [];
    
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
    
    // Add updated_at
    updateFields.updated_at = 'CURRENT_TIMESTAMP';
    updateValues.push(propertyId);
    
    const setClause = Object.keys(updateFields).map(key => 
      key === 'updated_at' ? `${key} = ${updateFields[key]}` : `${key} = ?`
    ).join(', ');
    
    await connection.execute(
      `UPDATE properties SET ${setClause} WHERE id = ?`,
      updateValues
    );
    
    // Get updated property
    const [updatedProperty] = await connection.execute(
      `SELECT p.id, p.name, p.description, p.property_type, p.address, p.city, p.state, p.country,
              p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests, p.amenities, p.house_rules,
              p.availability_start, p.availability_end, p.is_active, p.created_at, p.updated_at
       FROM properties p WHERE p.id = ?`,
      [propertyId]
    );
    
    res.json({
      success: true,
      message: 'Property updated successfully',
      data: {
        property: updatedProperty[0]
      }
    });
    
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property (Owner only)
 * @access  Private (Owner)
 */
router.delete('/:id', requireOwner, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const propertyId = req.params.id;
    
    // Check if property exists and belongs to user
    const [existingProperties] = await connection.execute(
      'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
      [propertyId, req.userId]
    );
    
    if (existingProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have permission to delete it'
      });
    }
    
    // Check for existing bookings
    const [bookings] = await connection.execute(
      'SELECT id FROM bookings WHERE property_id = ? AND status IN ("pending", "accepted")',
      [propertyId]
    );
    
    if (bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete property with active bookings. Please cancel all bookings first.'
      });
    }
    
    // Delete property (cascade will handle related records)
    await connection.execute('DELETE FROM properties WHERE id = ?', [propertyId]);
    
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/properties/owner/my-properties
 * @desc    Get owner's properties
 * @access  Private (Owner)
 */
router.get('/owner/my-properties', requireOwner, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get owner's properties
    const [properties] = await connection.execute(
      `SELECT p.id, p.name, p.description, p.property_type, p.city, p.state, p.country,
              p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests, p.is_active,
              p.created_at, p.updated_at,
              pi.image_url as main_image,
              COUNT(b.id) as total_bookings,
              AVG(r.rating) as average_rating
       FROM properties p
       LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.image_type = 'main'
       LEFT JOIN bookings b ON p.id = b.property_id
       LEFT JOIN reviews r ON p.id = r.property_id
       WHERE p.owner_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.userId, limit, offset]
    );
    
    // Get total count
    const [totalCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM properties WHERE owner_id = ?',
      [req.userId]
    );
    
    res.json({
      success: true,
      data: {
        properties: properties,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalCount[0].count / limit),
          total_items: totalCount[0].count,
          items_per_page: limit
        }
      }
    });
    
  } catch (error) {
    console.error('Get owner properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   POST /api/properties/:id/upload-images
 * @desc    Upload property images
 * @access  Private (Owner)
 */
router.post('/:id/upload-images', requireOwner, upload.array('images', 10), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const propertyId = req.params.id;
    
    // Check if property belongs to user
    const [existingProperties] = await connection.execute(
      'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
      [propertyId, req.userId]
    );
    
    if (existingProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have permission to upload images'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const uploadedImages = [];
    
    // Save image records to database
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageUrl = `/uploads/properties/${file.filename}`;
      const imageType = i === 0 ? 'main' : 'gallery'; // First image is main
      
      const [result] = await connection.execute(
        'INSERT INTO property_images (property_id, image_url, image_type, display_order) VALUES (?, ?, ?, ?)',
        [propertyId, imageUrl, imageType, i + 1]
      );
      
      uploadedImages.push({
        id: result.insertId,
        image_url: imageUrl,
        image_type: imageType,
        display_order: i + 1
      });
    }
    
    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: uploadedImages
      }
    });
    
  } catch (error) {
    console.error('Upload images error:', error);
    
    // Clean up uploaded files if database update failed
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   DELETE /api/properties/:id/images/:imageId
 * @desc    Delete property image
 * @access  Private (Owner)
 */
router.delete('/:id/images/:imageId', requireOwner, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id: propertyId, imageId } = req.params;
    
    // Check if property belongs to user
    const [existingProperties] = await connection.execute(
      'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
      [propertyId, req.userId]
    );
    
    if (existingProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have permission to delete images'
      });
    }
    
    // Get image details
    const [images] = await connection.execute(
      'SELECT image_url FROM property_images WHERE id = ? AND property_id = ?',
      [imageId, propertyId]
    );
    
    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Delete from database
    await connection.execute(
      'DELETE FROM property_images WHERE id = ? AND property_id = ?',
      [imageId, propertyId]
    );
    
    // Delete file from filesystem
    const imageUrl = images[0].image_url;
    if (imageUrl && imageUrl.startsWith('/uploads/properties/')) {
      try {
        const filePath = path.join(__dirname, '..', imageUrl);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Failed to delete image file:', fileError);
        // Don't fail the request if file deletion fails
      }
    }
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
