const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Security middleware
app.use(helmet());

// Rate limiting (skip CORS preflight and health checks to prevent accidental blocking)
app.use(rateLimit({
  ...config.rateLimit,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health'
}));

// CORS configuration
app.use(cors(config.cors));
// Explicitly handle preflight for all routes
app.options('*', cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration (prefer persistent MySQL store if available)
const sessionOptions = { ...config.session }
try {
  const MySQLStoreFactory = require('express-mysql-session')
  const MySQLStore = MySQLStoreFactory(session)
  const store = new MySQLStore({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000, // ms
    expiration: config.session.cookie.maxAge
  })
  sessionOptions.store = store
  console.log('✅ Using MySQL session store')
} catch (e) {
  console.warn('ℹ️  express-mysql-session not installed; using in-memory session store (sessions reset on restart).')
}
app.use(session(sessionOptions));

// Static uploads (serve uploaded property images)
const uploadsDir = path.join(__dirname, '..', 'uploads')
app.use('/uploads', express.static(uploadsDir))

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
