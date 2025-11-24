const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  owner_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  property_type: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  zip_code: {
    type: String
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  price_per_night: {
    type: Number,
    required: true,
    min: 0
  },
  bedrooms: {
    type: Number,
    default: 0,
    min: 0
  },
  bathrooms: {
    type: Number,
    default: 0,
    min: 0
  },
  max_guests: {
    type: Number,
    default: 1,
    min: 1
  },
  amenities: {
    type: String
  },
  house_rules: {
    type: String
  },
  cancellation_policy: {
    type: String
  },
  check_in_time: {
    type: String
  },
  check_out_time: {
    type: String
  },
  minimum_stay: {
    type: Number,
    default: 1,
    min: 1
  },
  maximum_stay: {
    type: Number
  },
  instant_book: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
propertySchema.index({ owner_id: 1 });
propertySchema.index({ city: 1, status: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ price_per_night: 1 });
propertySchema.index({ latitude: 1, longitude: 1 });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
