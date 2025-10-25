const bookingService = require('../services/bookingService');

class BookingController {
  // Create booking
  async createBooking(req, res) {
    try {
      const { property_id, check_in_date, check_out_date, number_of_guests, special_requests } = req.body;
      
      // Validate required fields
      if (!property_id || !check_in_date || !check_out_date || !number_of_guests) {
        return res.status(400).json({
          success: false,
          message: 'Property ID, check-in date, check-out date, and number of guests are required'
        });
      }
      
      const booking = await bookingService.createBooking(req.body, req.userId);
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: { booking }
      });
      
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get traveler bookings
  async getTravelerBookings(req, res) {
    try {
      const result = await bookingService.getTravelerBookings(req.userId, req.query);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Get traveler bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bookings'
      });
    }
  }
  
  // Get owner bookings
  async getOwnerBookings(req, res) {
    try {
      const result = await bookingService.getOwnerBookings(req.userId, req.query);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Get owner bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bookings'
      });
    }
  }
  
  // Accept booking
  async acceptBooking(req, res) {
    try {
      const { id } = req.params;
      await bookingService.acceptBooking(id, req.userId);
      
      res.json({
        success: true,
        message: 'Booking accepted successfully'
      });
      
    } catch (error) {
      console.error('Accept booking error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Reject booking
  async rejectBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      await bookingService.rejectBooking(id, req.userId, reason);
      
      res.json({
        success: true,
        message: 'Booking rejected successfully'
      });
      
    } catch (error) {
      console.error('Reject booking error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Cancel booking
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      await bookingService.cancelBooking(id, req.userId, reason);
      
      res.json({
        success: true,
        message: 'Booking cancelled successfully'
      });
      
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get booking by ID
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingById(id, req.userId, req.userType);
      
      res.json({
        success: true,
        data: { booking }
      });
      
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new BookingController();
