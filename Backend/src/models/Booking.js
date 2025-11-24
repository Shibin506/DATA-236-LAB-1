const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  property_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  traveler_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  check_in_date: {
    type: Date,
    required: true
  },
  check_out_date: {
    type: Date,
    required: true
  },
  num_guests: {
    type: Number,
    required: true,
    min: 1
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
    default: 'pending'
  },
  special_requests: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
bookingSchema.index({ property_id: 1, status: 1 });
bookingSchema.index({ traveler_id: 1, status: 1 });
bookingSchema.index({ check_in_date: 1, check_out_date: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
