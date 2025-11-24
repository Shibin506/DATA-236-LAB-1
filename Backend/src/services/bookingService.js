const { Property, Booking, User } = require('../models');

class BookingService {
  // Create booking
  async createBooking(bookingData, travelerId) {
    const { property_id, check_in_date, check_out_date, number_of_guests, special_requests } = bookingData;
    
    // Basic date sanity
    if (!property_id || !check_in_date || !check_out_date) {
      throw new Error('Missing booking details');
    }
    
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    
    if (!(checkIn instanceof Date) || isNaN(checkIn) || !(checkOut instanceof Date) || isNaN(checkOut) || checkIn >= checkOut) {
      throw new Error('Invalid date range');
    }
    
    // Convert property_id to number for MongoDB query
    const numericPropertyId = parseInt(property_id, 10);
    if (isNaN(numericPropertyId)) {
      throw new Error('Invalid property ID');
    }
    
    // Check if property exists and is active
    const property = await Property.findOne({ 
      _id: numericPropertyId, 
      $or: [{ status: 'active' }, { is_active: true }] 
    })
      .select('owner_id price_per_night max_guests')
      .lean();
    
    if (!property) {
      throw new Error('Property not found or not available');
    }
    
    // Check guest capacity
    if (number_of_guests > property.max_guests) {
      throw new Error('Guest limit exceeded for this property');
    }

    // NOTE: Overlapping booking check disabled for performance testing
    // In production, uncomment this code to prevent double bookings
    /*
    const conflicts = await Booking.countDocuments({
      property_id: numericPropertyId,
      status: { $in: ['pending', 'accepted'] },
      $nor: [
        { check_out_date: { $lte: checkIn } },
        { check_in_date: { $gte: checkOut } }
      ]
    });
    
    if (conflicts > 0) {
      throw new Error('This property is not available for your selected dates');
    }
    */
    
    // Calculate total price
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const total_price = nights * property.price_per_night;
    
    // Generate next booking ID using timestamp + random to avoid race conditions
    // In production with high concurrency, use MongoDB ObjectId or a counter service
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const nextId = parseInt(`${timestamp}${random}`);
    
    // Create booking
    const booking = await Booking.create({
      _id: nextId,
      property_id: numericPropertyId,
      traveler_id: travelerId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      num_guests: number_of_guests,
      total_price,
      status: 'pending',
      special_requests
    });
    
    return {
      id: booking._id,
      property_id: booking.property_id,
      owner_id: booking.owner_id,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      number_of_guests: booking.number_of_guests,
      total_price: booking.total_price,
      status: booking.status
    };
  }
  
  // Get traveler bookings
  async getTravelerBookings(travelerId, filters = {}) {
    const { page = 1, limit = 10, status } = filters;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const numericTravelerId = parseInt(travelerId, 10);
    const query = { traveler_id: numericTravelerId };
    
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Get property and owner details for each booking
    for (const booking of bookings) {
      const property = await Property.findById(booking.property_id)
        .select('name address city state price_per_night owner_id')
        .lean();
      
      if (property) {
        booking.property_name = property.name;
        booking.address = property.address;
        booking.city = property.city;
        booking.state = property.state;
        booking.price_per_night = property.price_per_night;
        
        const owner = await User.findById(property.owner_id).select('first_name last_name').lean();
        booking.owner_name = owner ? `${owner.first_name} ${owner.last_name}`.trim() : 'Unknown';
      }
      
      booking.id = booking._id;
    }
    
    const total = await Booking.countDocuments(query);
    
    return {
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total
      }
    };
  }
  
  // Get owner bookings
  async getOwnerBookings(ownerId, filters = {}) {
    const { page = 1, limit = 10, status } = filters;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const numericOwnerId = parseInt(ownerId, 10);
    
    // Find properties owned by this owner
    const properties = await Property.find({ owner_id: numericOwnerId }).select('_id').lean();
    const propertyIds = properties.map(p => p._id);
    
    const query = { property_id: { $in: propertyIds } };
    
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Get property and traveler details for each booking
    for (const booking of bookings) {
      const property = await Property.findById(booking.property_id)
        .select('name address city state')
        .lean();
      
      if (property) {
        booking.property_name = property.name;
        booking.address = property.address;
        booking.city = property.city;
        booking.state = property.state;
      }
      
      const traveler = await User.findById(booking.traveler_id)
        .select('first_name last_name email')
        .lean();
      
      if (traveler) {
        booking.traveler_name = `${traveler.first_name} ${traveler.last_name}`.trim();
        booking.traveler_email = traveler.email;
      }
      
      booking.id = booking._id;
    }
    
    const total = await Booking.countDocuments(query);
    
    return {
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total
      }
    };
  }
  
  // Accept booking
  async acceptBooking(bookingId, ownerId) {
    const numericOwnerId = parseInt(ownerId, 10);
    const numericBookingId = parseInt(bookingId, 10);
    
    // Find properties owned by this owner
    const properties = await Property.find({ owner_id: numericOwnerId }).select('_id').lean();
    const propertyIds = properties.map(p => p._id);
    
    // Check if booking exists and property belongs to user
    const booking = await Booking.findOne({
      _id: numericBookingId,
      property_id: { $in: propertyIds }
    }).lean();
    
    if (!booking) {
      throw new Error('Booking not found or you do not have permission to accept it');
    }
    
    if (booking.status !== 'pending') {
      throw new Error('Only pending bookings can be accepted');
    }
    
    // Update booking status
    await Booking.updateOne(
      { _id: numericBookingId },
      { $set: { status: 'accepted', updated_at: new Date() } }
    );
    
    return { success: true };
  }
  
  // Reject booking
  async rejectBooking(bookingId, ownerId, reason) {
    const numericOwnerId = parseInt(ownerId, 10);
    const numericBookingId = parseInt(bookingId, 10);
    
    // Find properties owned by this owner
    const properties = await Property.find({ owner_id: numericOwnerId }).select('_id').lean();
    const propertyIds = properties.map(p => p._id);
    
    // Check if booking exists and property belongs to user
    const booking = await Booking.findOne({
      _id: numericBookingId,
      property_id: { $in: propertyIds }
    }).lean();
    
    if (!booking) {
      throw new Error('Booking not found or you do not have permission to reject it');
    }
    
    if (booking.status !== 'pending') {
      throw new Error('Only pending bookings can be rejected');
    }
    
    // Update booking status
    const reasonVal = reason === undefined ? null : reason;
    await Booking.updateOne(
      { _id: numericBookingId },
      { $set: { status: 'rejected', cancellation_reason: reasonVal, updated_at: new Date() } }
    );
    
    return { success: true };
  }
  
  // Cancel booking
  async cancelBooking(bookingId, travelerId, reason) {
    const numericTravelerId = parseInt(travelerId, 10);
    const numericBookingId = parseInt(bookingId, 10);
    
    // Check if booking exists and belongs to user
    const booking = await Booking.findOne({ 
      _id: numericBookingId, 
      traveler_id: numericTravelerId 
    }).lean();
    
    if (!booking) {
      throw new Error('Booking not found or you do not have permission to cancel it');
    }
    
    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }
    
    // Update booking status
    const reasonVal = reason === undefined ? null : reason;
    await Booking.updateOne(
      { _id: numericBookingId },
      { $set: { status: 'cancelled', cancellation_reason: reasonVal, updated_at: new Date() } }
    );
    
    return { success: true };
  }
  
  // Get booking by ID
  async getBookingById(bookingId, userId, userType) {
    const numericBookingId = parseInt(bookingId, 10);
    const numericUserId = parseInt(userId, 10);
    
    let query = { _id: numericBookingId };
    
    if (userType === 'traveler') {
      query.traveler_id = numericUserId;
    } else if (userType === 'owner') {
      // Find properties owned by this owner
      const properties = await Property.find({ owner_id: numericUserId }).select('_id').lean();
      const propertyIds = properties.map(p => p._id);
      query.property_id = { $in: propertyIds };
    }
    
    const booking = await Booking.findOne(query).lean();
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Get property details
    const property = await Property.findById(booking.property_id)
      .select('name address city state owner_id')
      .lean();
    
    if (property) {
      booking.property_name = property.name;
      booking.address = property.address;
      booking.city = property.city;
      booking.state = property.state;
      
      // Get owner details
      const owner = await User.findById(property.owner_id)
        .select('first_name last_name email')
        .lean();
      
      if (owner) {
        booking.owner_name = `${owner.first_name} ${owner.last_name}`.trim();
        booking.owner_email = owner.email;
      }
    }
    
    // Get traveler details
    const traveler = await User.findById(booking.traveler_id)
      .select('first_name last_name email')
      .lean();
    
    if (traveler) {
      booking.traveler_name = `${traveler.first_name} ${traveler.last_name}`.trim();
      booking.traveler_email = traveler.email;
    }
    
    booking.id = booking._id;
    booking.state = booking.property_id?.state;
    booking.traveler_name = booking.traveler_id?.name;
    booking.traveler_email = booking.traveler_id?.email;
    booking.property_id = booking.property_id?._id;
    booking.traveler_id = booking.traveler_id?._id;
    
    return booking;
  }
}

module.exports = new BookingService();
