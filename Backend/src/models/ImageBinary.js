const mongoose = require('mongoose');

const imageBinarySchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  property_id: {
    type: Number,
    required: true,
    index: true
  },
  image_data: {
    type: Buffer,
    required: true
  },
  content_type: {
    type: String,
    default: 'image/jpeg'
  },
  filename: {
    type: String,
    required: true
  }
}, {
  collection: 'property_images_binary'
});

// Index for fast lookups
imageBinarySchema.index({ property_id: 1, filename: 1 });

const ImageBinary = mongoose.model('ImageBinary', imageBinarySchema);

module.exports = ImageBinary;
