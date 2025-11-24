const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');

// Import configuration
const config = require('./config/env');

// Import routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS configuration
app.use(cors(config.cors));
// Explicitly handle preflight for all routes
app.options('*', cors(config.cors));

// Security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration with MongoDB store
const MongoStore = require('connect-mongo');
const sessionOptions = { 
  ...config.session,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/airbnb',
    touchAfter: 24 * 3600 // Lazy session update (seconds)
  })
};
console.log('✅ Using MongoDB session store');
app.use(session(sessionOptions));

// Serve images from MongoDB
const { ImageBinary } = require('./models');
app.get('/uploads/properties/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const image = await ImageBinary.findOne({ filename }).select('image_data content_type');
    
    if (!image) {
      return res.status(404).send('Image not found');
    }
    
    res.set({
      'Content-Type': image.content_type || 'image/jpeg',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Force fresh load
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(image.image_data);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Error loading image');
  }
});

// Static uploads for other files (users, etc)
const uploadsDir = path.join(__dirname, '..', 'uploads')
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Airbnb Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
