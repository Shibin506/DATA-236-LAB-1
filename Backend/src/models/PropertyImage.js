const mongoose = require('mongoose');

const propertyImageSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  property_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  image_url: {
    type: String,
    required: true
  },
  is_primary: {
    type: Boolean,
    default: false
  },
  display_order: {
    type: Number,
    default: 0
  },
  image_type: {
    type: String,
    default: 'other'
  }
}, {
  timestamps: true,
  collection: 'propertyimages'
});

// Indexes
propertyImageSchema.index({ property_id: 1, display_order: 1 });
propertyImageSchema.index({ property_id: 1, is_primary: 1 });

const PropertyImage = mongoose.model('PropertyImage', propertyImageSchema);

module.exports = PropertyImage;
