const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  about_me: {
    type: String
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  languages: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer not to say'],
    trim: true
  },
  profile_picture_url: {
    type: String
  },
  user_type: {
    type: String,
    enum: ['traveler', 'owner', 'admin'],
    default: 'traveler'
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // Using manual created_at/updated_at
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update updated_at on save
userSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ user_type: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
