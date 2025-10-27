const { pool } = require('../config/database');

class BookingService {
  // Create booking
  async createBooking(bookingData, travelerId) {
    const connection = await pool.getConnection();
    
    try {
      const { property_id, check_in_date, check_out_date, number_of_guests, special_requests } = bookingData;
      // Basic date sanity
      if (!property_id || !check_in_date || !check_out_date) {
        throw new Error('Missing booking details')
      }
      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);
      if (!(checkIn instanceof Date) || isNaN(checkIn) || !(checkOut instanceof Date) || isNaN(checkOut) || checkIn >= checkOut) {
        throw new Error('Invalid date range')
      }
      
      // Check if property exists and is active (include owner_id)
      const [properties] = await connection.execute(
        'SELECT id, owner_id, price_per_night, max_guests, availability_start, availability_end FROM properties WHERE id = ? AND is_active = TRUE',
        [property_id]
      );
      
      if (properties.length === 0) {
        throw new Error('Property not found or not available');
      }
      
      const property = properties[0];
      
      // Check guest capacity
      if (number_of_guests > property.max_guests) {
        throw new Error('Guest limit exceeded for this property');
      }

      // Check requested dates fit within property availability window (if set)
      if (property.availability_start && new Date(property.availability_start) > checkIn) {
        throw new Error('This property is not available for your selected dates');
      }
      if (property.availability_end && new Date(property.availability_end) < checkOut) {
        throw new Error('This property is not available for your selected dates');
      }

      // Check overlapping bookings (pending/accepted)
      const [conflicts] = await connection.execute(
        `SELECT COUNT(*) AS cnt
         FROM bookings b
         WHERE b.property_id = ?
           AND (b.status IS NULL OR b.status IN ('pending','accepted'))
           AND NOT (b.check_out_date <= ? OR b.check_in_date >= ?)`,
        [property_id, check_in_date, check_out_date]
      )
      if (conflicts && conflicts[0] && conflicts[0].cnt > 0) {
        throw new Error('This property is not available for your selected dates');
      }
      
      // Calculate total price
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const total_price = nights * property.price_per_night;
      
      // Create booking
      let result;
      try {
        // Preferred schema: include owner_id column
        [result] = await connection.execute(
          `INSERT INTO bookings (
            property_id, traveler_id, owner_id, check_in_date, check_out_date,
            number_of_guests, total_price, status, special_requests, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
          [property_id, travelerId, property.owner_id, check_in_date, check_out_date, number_of_guests, total_price, special_requests]
        );
      } catch (err) {
        // Fallback schema (no owner_id/status column defaults)
        if (err && (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_WRONG_VALUE_COUNT_ON_ROW')) {
          [result] = await connection.execute(
            `INSERT INTO bookings (
              property_id, traveler_id, check_in_date, check_out_date,
              number_of_guests, total_price, special_requests, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [property_id, travelerId, check_in_date, check_out_date, number_of_guests, total_price, special_requests]
          );
        } else {
          throw err;
        }
      }
      
      return {
        id: result.insertId,
        property_id,
        check_in_date,
        check_out_date,
        number_of_guests,
        total_price,
        status: 'pending'
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Get traveler bookings
  async getTravelerBookings(travelerId, filters = {}) {
    const connection = await pool.getConnection();
    
    try {
      const { page = 1, limit = 10, status } = filters;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      let whereConditions = ['b.traveler_id = ?'];
      let queryParams = [travelerId];
      
      if (status) {
        whereConditions.push('b.status = ?');
        queryParams.push(status);
      }
      
      const [bookings] = await connection.execute(`
        SELECT b.*, p.name as property_name, p.address, p.city, p.state, p.price_per_night,
               u.name as owner_name
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u ON p.owner_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY b.id DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `, queryParams);
      
      return {
        bookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: bookings.length
        }
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Get owner bookings
  async getOwnerBookings(ownerId, filters = {}) {
    const connection = await pool.getConnection();
    
    try {
      const { page = 1, limit = 10, status } = filters;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      let whereConditions = ['p.owner_id = ?'];
      let queryParams = [ownerId];
      
      if (status) {
        whereConditions.push('b.status = ?');
        queryParams.push(status);
      }
      
      const [bookings] = await connection.execute(`
        SELECT b.*, p.name as property_name, p.address, p.city, p.state,
               u.name as traveler_name, u.email as traveler_email
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u ON b.traveler_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY b.id DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `, queryParams);
      
      return {
        bookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: bookings.length
        }
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Accept booking
  async acceptBooking(bookingId, ownerId) {
    const connection = await pool.getConnection();
    
    try {
      // Check if booking exists and property belongs to user
      const [bookings] = await connection.execute(`
        SELECT b.id, b.status, p.owner_id 
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        WHERE b.id = ? AND p.owner_id = ?
      `, [bookingId, ownerId]);
      
      if (bookings.length === 0) {
        throw new Error('Booking not found or you do not have permission to accept it');
      }
      
      const booking = bookings[0];
      
      if (booking.status !== 'pending') {
        throw new Error('Only pending bookings can be accepted');
      }
      
      // Update booking status
      await connection.execute(
        'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
        ['accepted', bookingId]
      );
      
      return { success: true };
      
    } finally {
      connection.release();
    }
  }
  
  // Reject booking
  async rejectBooking(bookingId, ownerId, reason) {
    const connection = await pool.getConnection();
    
    try {
      // Check if booking exists and property belongs to user
      const [bookings] = await connection.execute(`
        SELECT b.id, b.status, p.owner_id 
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        WHERE b.id = ? AND p.owner_id = ?
      `, [bookingId, ownerId]);
      
      if (bookings.length === 0) {
        throw new Error('Booking not found or you do not have permission to reject it');
      }
      
      const booking = bookings[0];
      
      if (booking.status !== 'pending') {
        throw new Error('Only pending bookings can be rejected');
      }
      
      // Update booking status with robust fallback for legacy ENUM values
      const reasonVal = (reason === undefined ? null : reason)
      const candidates = ['rejected', 'Rejected', 'declined', 'Declined', 'cancelled', 'Cancelled', 'canceled', 'Canceled']
      let updated = false
      let lastErr
      for (const status of candidates) {
        try {
          await connection.execute(
            'UPDATE bookings SET status = ?, cancellation_reason = ?, updated_at = NOW() WHERE id = ?',[status, reasonVal, bookingId]
          )
          updated = true
          break
        } catch (err) {
          lastErr = err
          // If data truncated or bad enum, try next candidate
          if (err && (err.code === 'WARN_DATA_TRUNCATED' || err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || err.code === 'ER_WRONG_VALUE_FOR_FIELD')) {
            continue
          }
          // Other errors: rethrow
          throw err
        }
      }
      if (!updated) {
        // As last resort, set to current value 'pending' to avoid inconsistent state and throw the last error
        throw lastErr || new Error('Failed to update booking status')
      }
      
      return { success: true };
      
    } finally {
      connection.release();
    }
  }
  
  // Cancel booking
  async cancelBooking(bookingId, travelerId, reason) {
    const connection = await pool.getConnection();
    
    try {
      // Check if booking exists and belongs to user
      const [bookings] = await connection.execute(
        'SELECT id, status FROM bookings WHERE id = ? AND traveler_id = ?',
        [bookingId, travelerId]
      );
      
      if (bookings.length === 0) {
        throw new Error('Booking not found or you do not have permission to cancel it');
      }
      
      const booking = bookings[0];
      
      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }
      
      // Update booking status
      const reasonVal = (reason === undefined ? null : reason)
      await connection.execute(
        'UPDATE bookings SET status = ?, cancellation_reason = ?, updated_at = NOW() WHERE id = ?',
        ['cancelled', reasonVal, bookingId]
      );
      
      return { success: true };
      
    } finally {
      connection.release();
    }
  }
  
  // Get booking by ID
  async getBookingById(bookingId, userId, userType) {
    const connection = await pool.getConnection();
    
    try {
      let whereCondition = 'b.id = ?';
      let queryParams = [bookingId];
      
      if (userType === 'traveler') {
        whereCondition += ' AND b.traveler_id = ?';
        queryParams.push(userId);
      } else if (userType === 'owner') {
        whereCondition += ' AND p.owner_id = ?';
        queryParams.push(userId);
      }
      
      const [bookings] = await connection.execute(`
        SELECT b.*, p.name as property_name, p.address, p.city, p.state,
               u1.name as traveler_name, u1.email as traveler_email,
               u2.name as owner_name, u2.email as owner_email
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u1 ON b.traveler_id = u1.id
        JOIN users u2 ON p.owner_id = u2.id
        WHERE ${whereCondition}
      `, queryParams);
      
      if (bookings.length === 0) {
        throw new Error('Booking not found');
      }
      
      return bookings[0];
      
    } finally {
      connection.release();
    }
  }
}

module.exports = new BookingService();
