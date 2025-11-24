const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  user_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  property_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate favorites
favoriteSchema.index({ user_id: 1, property_id: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
