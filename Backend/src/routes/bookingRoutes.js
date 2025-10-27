const express = require('express');
const bookingController = require('../controllers/bookingController');
const { requireAuth, requireTraveler, requireOwner } = require('../middleware/requireAuth');
const router = express.Router();

// Create booking (Traveler only)
router.post('/', requireAuth, requireTraveler, bookingController.createBooking.bind(bookingController));

// Get traveler bookings
router.get('/traveler/my-bookings', requireAuth, requireTraveler, bookingController.getTravelerBookings.bind(bookingController));

// Get owner bookings
router.get('/owner/my-bookings', requireAuth, requireOwner, bookingController.getOwnerBookings.bind(bookingController));

// Accept booking (Owner only)
router.put('/:id/accept', requireAuth, requireOwner, bookingController.acceptBooking.bind(bookingController));

// Reject booking (Owner only)
router.put('/:id/reject', requireAuth, requireOwner, bookingController.rejectBooking.bind(bookingController));

// Cancel booking (Traveler only)
router.put('/:id/cancel', requireAuth, requireTraveler, bookingController.cancelBooking.bind(bookingController));

// Get booking by ID
router.get('/:id', requireAuth, bookingController.getBookingById.bind(bookingController));

module.exports = router;
