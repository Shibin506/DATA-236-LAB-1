const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Lionel@2',
  database: process.env.DB_NAME || 'airbnb_db',
  port: process.env.DB_PORT || 3306
};

let connection;

async function checkTableStructure() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check bookings table structure
    console.log('📋 Bookings table structure:');
    const [bookingsColumns] = await connection.execute('DESCRIBE bookings');
    console.table(bookingsColumns);

    console.log('\n📋 Reviews table structure:');
    const [reviewsColumns] = await connection.execute('DESCRIBE reviews');
    console.table(reviewsColumns);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

checkTableStructure();
