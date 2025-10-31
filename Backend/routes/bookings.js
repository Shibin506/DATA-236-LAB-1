const express = require('express');
const { pool } = require('../config/database');
const { requireAuth, requireOwner, requireTraveler } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/bookings
 * @desc    Create new booking (Traveler only)
 * @access  Private (Traveler)
 */
router.post('/', requireTraveler, validate(schemas.bookingCreate), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { property_id, check_in_date, check_out_date, number_of_guests, special_requests } = req.body;
    
    // Check if property exists and is active
    const [properties] = await connection.execute(
      'SELECT id, owner_id, price_per_night, max_guests, is_active FROM properties WHERE id = ? AND is_active = TRUE',
      [property_id]
    );
    
    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or not available'
      });
    }
    
    const property = properties[0];
    
    // Check guest capacity
    if (number_of_guests > property.max_guests) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${property.max_guests} guests allowed for this property`
      });
    }
    
    // Check for date conflicts
    const [conflictingBookings] = await connection.execute(
      `SELECT id FROM bookings 
       WHERE property_id = ? 
       AND status IN ('pending', 'accepted') 
       AND (
         (check_in_date <= ? AND check_out_date > ?) OR
         (check_in_date < ? AND check_out_date >= ?) OR
         (check_in_date >= ? AND check_out_date <= ?)
       )`,
      [property_id, check_out_date, check_in_date, check_in_date, check_out_date, check_in_date, check_out_date]
    );
    
    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Property is not available for the selected dates'
      });
    }
    
    // Calculate total price
    const nights = Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      return res.status(400).json({
        success: false,
        message: 'check_out_date must be after check_in_date'
      });
    }
    const totalPrice = nights * property.price_per_night;
    
    // Create booking
    const [result] = await connection.execute(
      `INSERT INTO bookings (
        traveler_id, property_id, owner_id, check_in_date, check_out_date,
        number_of_guests, total_price, status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [req.userId, property_id, property.owner_id, check_in_date, check_out_date, number_of_guests, totalPrice, special_requests || null]
    );
    
    // Get created booking with property and owner details
    const [newBooking] = await connection.execute(
      `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
              b.status, b.special_requests, b.created_at,
              p.name as property_name, p.city, p.state, p.country,
              u.name as owner_name, u.email as owner_email
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users u ON b.owner_id = u.id
       WHERE b.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      data: {
        booking: { ...newBooking[0], nights }
      }
    });
    
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/bookings/traveler/my-bookings
 * @desc    Get traveler's bookings
 * @access  Private (Traveler)
 */
router.get('/traveler/my-bookings', requireTraveler, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Filter by status
    
    let whereClause = 'WHERE b.traveler_id = ?';
    let queryParams = [req.userId];
    
    if (status) {
      whereClause += ' AND b.status = ?';
      queryParams.push(status);
    }
    
    // Get traveler's bookings with progressive fallbacks for schema differences
    let bookings;
    try {
      // Attempt 1: includes property_images and join on b.owner_id
      const [rows] = await connection.execute(
        `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
                b.status, b.special_requests, b.created_at, b.updated_at,
                p.id as property_id, p.name as property_name, p.city, p.state, p.country,
                p.property_type, p.price_per_night,
                u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
                pi.image_url as property_image
         FROM bookings b
         JOIN properties p ON b.property_id = p.id
         JOIN users u ON b.owner_id = u.id
         LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.image_type = 'main'
         ${whereClause}
         ORDER BY b.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        queryParams
      );
      bookings = rows;
    } catch (err1) {
      // Attempt 2: remove property_images join (table/column may not exist)
      if (err1 && (err1.code === 'ER_NO_SUCH_TABLE' || err1.code === 'ER_BAD_FIELD_ERROR')) {
        try {
          const [rows2] = await connection.execute(
            `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
                    b.status, b.special_requests, b.created_at, b.updated_at,
                    p.id as property_id, p.name as property_name, p.city, p.state, p.country,
                    p.property_type, p.price_per_night,
                    u.name as owner_name, u.email as owner_email, u.phone as owner_phone
             FROM bookings b
             JOIN properties p ON b.property_id = p.id
             JOIN users u ON b.owner_id = u.id
             ${whereClause}
             ORDER BY b.created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            queryParams
          );
          bookings = rows2;
        } catch (err2) {
          // Attempt 3: owner_id may not exist on bookings; join owner via property
          if (err2 && err2.code === 'ER_BAD_FIELD_ERROR') {
            try {
              const [rows3] = await connection.execute(
                `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
                        b.status, b.special_requests,
                        p.id as property_id, p.name as property_name, p.city, p.state, p.country,
                        p.property_type, p.price_per_night,
                        u.name as owner_name, u.email as owner_email, u.phone as owner_phone
                 FROM bookings b
                 JOIN properties p ON b.property_id = p.id
                 JOIN users u ON p.owner_id = u.id
                 ${whereClause}
                 ORDER BY b.id DESC
                 LIMIT ${limit} OFFSET ${offset}`,
                queryParams
              );
              bookings = rows3;
            } catch (err3) {
              // Final Attempt: select minimal columns to avoid other schema diffs
              if (err3 && err3.code === 'ER_BAD_FIELD_ERROR') {
                const [rows4] = await connection.execute(
                  `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
                          b.status,
                          p.id as property_id, p.name as property_name
                   FROM bookings b
                   JOIN properties p ON b.property_id = p.id
                   ${whereClause}
                   ORDER BY b.id DESC
                   LIMIT ${limit} OFFSET ${offset}`,
                  queryParams
                );
                bookings = rows4;
              } else {
                throw err3;
              }
            }
          } else {
            throw err2;
          }
        }
      } else {
        throw err1;
      }
    }
    
    // Get total count
    const [totalCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM bookings b ${whereClause}`,
      queryParams
    );
    
    res.json({
      success: true,
      data: {
        bookings: bookings,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalCount[0].count / limit),
          total_items: totalCount[0].count,
          items_per_page: limit
        }
      }
    });
    
  } catch (error) {
    console.error('Get traveler bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/bookings/owner/incoming-requests
 * @desc    Get owner's incoming booking requests
 * @access  Private (Owner)
 */
router.get('/owner/incoming-requests', requireOwner, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Filter by status
    
    let whereClause = 'WHERE b.owner_id = ?';
    let queryParams = [req.userId];
    
    if (status) {
      whereClause += ' AND b.status = ?';
      queryParams.push(status);
    }
    
    // Get owner's booking requests
    const [bookings] = await connection.execute(
      `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
              b.status, b.special_requests, b.created_at, b.updated_at,
              p.id as property_id, p.name as property_name, p.city, p.state, p.country,
              u.id as traveler_id, u.name as traveler_name, u.email as traveler_email, 
              u.phone as traveler_phone, u.profile_picture as traveler_avatar
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users u ON b.traveler_id = u.id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // Get total count
    const [totalCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM bookings b ${whereClause}`,
      queryParams
    );
    
    res.json({
      success: true,
      data: {
        bookings: bookings,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalCount[0].count / limit),
          total_items: totalCount[0].count,
          items_per_page: limit
        }
      }
    });
    
  } catch (error) {
    console.error('Get owner booking requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking requests'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking details by ID
 * @access  Private
 */
router.get('/:id', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const bookingId = req.params.id;
    
    // Get booking details
    const [bookings] = await connection.execute(
      `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
              b.status, b.special_requests, b.created_at, b.updated_at,
              p.id as property_id, p.name as property_name, p.address, p.city, p.state, p.country,
              p.property_type, p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests,
              p.amenities, p.house_rules,
              owner.id as owner_id, owner.name as owner_name, owner.email as owner_email,
              owner.phone as owner_phone, owner.profile_picture as owner_avatar,
              traveler.id as traveler_id, traveler.name as traveler_name, traveler.email as traveler_email,
              traveler.phone as traveler_phone, traveler.profile_picture as traveler_avatar
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users owner ON b.owner_id = owner.id
       JOIN users traveler ON b.traveler_id = traveler.id
       WHERE b.id = ?`,
      [bookingId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = bookings[0];
    
    // Check if user has access to this booking
    if (req.userType === 'traveler' && booking.traveler_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (req.userType === 'owner' && booking.owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: {
        booking: booking
      }
    });
    
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking details'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   PATCH /api/bookings/:id/accept
 * @desc    Accept booking request (Owner only)
 * @access  Private (Owner)
 */
router.patch('/:id/accept', requireOwner, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const bookingId = req.params.id;
    
    // Check if booking exists and belongs to owner
    const [existingBookings] = await connection.execute(
      'SELECT id, status, property_id, check_in_date, check_out_date FROM bookings WHERE id = ? AND owner_id = ?',
      [bookingId, req.userId]
    );
    
    if (existingBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to accept it'
      });
    }
    
    const booking = existingBookings[0];
    
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be accepted'
      });
    }
    
    // Check for conflicting bookings that might have been created after this one
    const [conflictingBookings] = await connection.execute(
      `SELECT id FROM bookings 
       WHERE property_id = ? 
       AND id != ?
       AND status IN ('pending', 'accepted') 
       AND (
         (check_in_date <= ? AND check_out_date > ?) OR
         (check_in_date < ? AND check_out_date >= ?) OR
         (check_in_date >= ? AND check_out_date <= ?)
       )`,
      [booking.property_id, bookingId, booking.check_out_date, booking.check_in_date, 
       booking.check_in_date, booking.check_out_date, booking.check_in_date, booking.check_out_date]
    );
    
    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot accept booking due to date conflicts with other bookings'
      });
    }
    
    // Update booking status to accepted
    await connection.execute(
      'UPDATE bookings SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [bookingId]
    );
    
    // Get updated booking details
    const [updatedBookings] = await connection.execute(
      `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
              b.status, b.special_requests, b.updated_at,
              p.name as property_name, p.city, p.state, p.country,
              u.name as traveler_name, u.email as traveler_email
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users u ON b.traveler_id = u.id
       WHERE b.id = ?`,
      [bookingId]
    );
    
    res.json({
      success: true,
      message: 'Booking accepted successfully',
      data: {
        booking: updatedBookings[0]
      }
    });
    
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   PATCH /api/bookings/:id/reject
 * @desc    Reject booking (Owner only)
 * @access  Private (Owner)
 */
router.patch('/:id/reject', requireOwner, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const bookingId = req.params.id;
    
    // Check if booking exists and belongs to owner
    const [existingBookings] = await connection.execute(
      'SELECT id, status, property_id, check_in_date, check_out_date FROM bookings WHERE id = ? AND owner_id = ?',
      [bookingId, req.userId]
    );
    
    if (existingBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to reject it'
      });
    }
    
    const booking = existingBookings[0];
    
    // Check if booking can be rejected
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject booking with status: ${booking.status}`
      });
    }
    
    // Update booking status to cancelled
    await connection.execute(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', bookingId]
    );
    
    res.json({
      success: true,
      message: 'Booking rejected successfully',
      data: {
        booking_id: bookingId,
        status: 'cancelled'
      }
    });
    
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   PATCH /api/bookings/:id/cancel
 * @desc    Cancel booking (Owner or Traveler)
 * @access  Private
 */
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;
    
    // Check if booking exists and user has permission to cancel
    let whereClause = 'WHERE id = ? AND (traveler_id = ? OR owner_id = ?)';
    let queryParams = [bookingId, req.userId, req.userId];
    
    const [existingBookings] = await connection.execute(
      'SELECT id, status, check_in_date FROM bookings ' + whereClause,
      queryParams
    );
    
    if (existingBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to cancel it'
      });
    }
    
    const booking = existingBookings[0];
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }
    
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }
    
    // Check if cancellation is too close to check-in date (within 24 hours)
    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
    
    if (hoursUntilCheckIn < 24 && booking.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking within 24 hours of check-in date'
      });
    }
    
    // Update booking status to cancelled
    await connection.execute(
      'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [bookingId]
    );
    
    // Get updated booking details
    const [updatedBookings] = await connection.execute(
      `SELECT b.id, b.check_in_date, b.check_out_date, b.number_of_guests, b.total_price,
              b.status, b.special_requests, b.updated_at,
              p.name as property_name, p.city, p.state, p.country
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       WHERE b.id = ?`,
      [bookingId]
    );
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: updatedBookings[0]
      }
    });
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/bookings/owner/statistics
 * @desc    Get booking statistics for owner
 * @access  Private (Owner)
 */
router.get('/owner/statistics', requireOwner, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const ownerId = req.userId;
    
    // Get booking statistics
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as total_earnings,
        AVG(CASE WHEN status = 'completed' THEN total_price ELSE NULL END) as average_booking_value
       FROM bookings 
       WHERE owner_id = ?`,
      [ownerId]
    );
    
    // Get monthly earnings for the last 12 months
    const [monthlyEarnings] = await connection.execute(
      `SELECT 
        DATE_FORMAT(check_in_date, '%Y-%m') as month,
        SUM(total_price) as earnings
       FROM bookings 
       WHERE owner_id = ? AND status = 'completed' 
       AND check_in_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(check_in_date, '%Y-%m')
       ORDER BY month DESC`,
      [ownerId]
    );
    
    res.json({
      success: true,
      data: {
        statistics: stats[0],
        monthly_earnings: monthlyEarnings
      }
    });
    
  } catch (error) {
    console.error('Get booking statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking statistics'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
