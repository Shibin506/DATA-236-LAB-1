const app = require('./app');
const { testConnection, initializeDatabase } = require('./config/database');
const kafkaService = require('./services/kafka')

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Database connected successfully');
    
    // Initialize database tables
    await initializeDatabase();
    console.log('✅ Database tables initialized successfully');
    
    // Initialize Kafka (best-effort)
    try {
      await kafkaService.init()
    } catch (err) {
      console.warn('Kafka init error (continuing without kafka):', err.message)
    }

    // Start server
    app.listen(PORT, () => {
      console.log('\n🚀 Airbnb Backend Server Started Successfully!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
