const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  property_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  booking_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  reviewer_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String
  },
  cleanliness_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  accuracy_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  check_in_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  communication_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  location_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  value_rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ property_id: 1 });
reviewSchema.index({ booking_id: 1 });
reviewSchema.index({ reviewer_id: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
