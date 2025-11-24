const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/airbnb';

let isConnected = false;

// Connect to MongoDB
async function connectDB() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    await connectDB();
    return true;
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Initialize database (not needed for MongoDB - Mongoose handles schema)
async function initializeDatabase() {
  try {
    await connectDB();
    console.log('✅ MongoDB initialized - schemas managed by Mongoose');
    return true;
  } catch (error) {
    throw new Error(`Database initialization failed: ${error.message}`);
  }
}

module.exports = {
  connectDB,
  testConnection,
  initializeDatabase,
  mongoose
};
