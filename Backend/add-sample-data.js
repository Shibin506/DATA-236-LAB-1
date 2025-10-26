/**
 * Sample Data Script for Airbnb Backend
 * This script adds comprehensive sample data to test all functionality
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  port: process.env.DB_PORT || 3306
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function addSampleData() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    log('🗄️  Adding Sample Data to Airbnb Database', 'bright');
    log('==========================================', 'bright');
    
    // Clear existing data (in correct order due to foreign keys)
    log('\n🧹 Clearing existing data...', 'yellow');
    await connection.execute('DELETE FROM reviews');
    await connection.execute('DELETE FROM favorites');
    await connection.execute('DELETE FROM bookings');
    await connection.execute('DELETE FROM property_images');
    await connection.execute('DELETE FROM properties');
    await connection.execute('DELETE FROM users');
    
    // Reset auto-increment counters
    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE properties AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE bookings AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE favorites AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE property_images AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE reviews AUTO_INCREMENT = 1');
    
    log('✅ Existing data cleared', 'green');
    
    // 1. Add Users (Travelers and Owners)
    log('\n👥 Adding Users...', 'cyan');
    
    const users = [
      // Travelers
      {
        name: 'John Traveler',
        email: 'john@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QzKz2a', // 'Traveler123!'
        user_type: 'traveler',
        phone: '+1234567890',
        about_me: 'I love traveling and exploring new places!',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        languages: 'English, Spanish',
        gender: 'male'
      },
      {
        name: 'Sarah Explorer',
        email: 'sarah@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QzKz2a',
        user_type: 'traveler',
        phone: '+1234567891',
        about_me: 'Adventure seeker and culture enthusiast',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        languages: 'English, French',
        gender: 'female'
      },
      {
        name: 'Mike Adventurer',
        email: 'mike@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QzKz2a',
        user_type: 'traveler',
        phone: '+1234567892',
        about_me: 'Business traveler who loves comfort',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        languages: 'English',
        gender: 'male'
      },
      
      // Owners
      {
        name: 'Jane Owner',
        email: 'jane@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QzKz2a',
        user_type: 'owner',
        phone: '+1234567893',
        about_me: 'Professional property manager with 5+ years experience',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        languages: 'English, Italian',
        gender: 'female'
      },
      {
        name: 'Robert Host',
        email: 'robert@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QzKz2a',
        user_type: 'owner',
        phone: '+1234567894',
        about_me: 'Luxury property specialist',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        languages: 'English, Spanish',
        gender: 'male'
      },
      {
        name: 'Lisa Property Manager',
        email: 'lisa@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QzKz2a',
        user_type: 'owner',
        phone: '+1234567895',
        about_me: 'Boutique accommodation specialist',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        languages: 'English, Japanese',
        gender: 'female'
      }
    ];
    
    for (const user of users) {
      await connection.execute(
        `INSERT INTO users (name, email, password, user_type, phone, about_me, city, state, country, languages, gender, is_verified) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.name, user.email, user.password, user.user_type, user.phone, user.about_me, 
         user.city, user.state, user.country, user.languages, user.gender, true]
      );
    }
    
    log(`✅ Added ${users.length} users (3 travelers, 3 owners)`, 'green');
    
    // 2. Add Properties
    log('\n🏠 Adding Properties...', 'cyan');
    
    const properties = [
      {
        owner_id: 4, // Jane Owner
        name: 'Beautiful Downtown Apartment',
        description: 'A stunning modern apartment in the heart of downtown with amazing city views. Perfect for business travelers and tourists alike.',
        property_type: 'apartment',
        address: '123 Main Street, New York, NY 10001',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        price_per_night: 150.00,
        bedrooms: 2,
        bathrooms: 1,
        max_guests: 4,
        amenities: 'WiFi, Kitchen, Parking, Pool, Gym, Air Conditioning',
        house_rules: 'No smoking, No pets, Check-in after 3 PM, Check-out before 11 AM',
        availability_start: '2024-01-01',
        availability_end: '2024-12-31',
        is_active: true
      },
      {
        owner_id: 4, // Jane Owner
        name: 'Cozy Brooklyn Loft',
        description: 'Charming loft in trendy Brooklyn with exposed brick walls and modern amenities.',
        property_type: 'loft',
        address: '456 Brooklyn Ave, Brooklyn, NY 11201',
        city: 'Brooklyn',
        state: 'NY',
        country: 'USA',
        price_per_night: 120.00,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi, Kitchen, Washer, Dryer, Air Conditioning',
        house_rules: 'No smoking, No pets, Quiet hours after 10 PM',
        availability_start: '2024-01-01',
        availability_end: '2024-12-31',
        is_active: true
      },
      {
        owner_id: 5, // Robert Host
        name: 'Luxury Miami Beach Villa',
        description: 'Stunning beachfront villa with private pool and direct beach access. Perfect for luxury getaways.',
        property_type: 'villa',
        address: '789 Ocean Drive, Miami Beach, FL 33139',
        city: 'Miami Beach',
        state: 'FL',
        country: 'USA',
        price_per_night: 400.00,
        bedrooms: 4,
        bathrooms: 3,
        max_guests: 8,
        amenities: 'WiFi, Kitchen, Pool, Hot Tub, Gym, Beach Access, Concierge',
        house_rules: 'No smoking, No pets, No parties, Respect neighbors',
        availability_start: '2024-01-01',
        availability_end: '2024-12-31',
        is_active: true
      },
      {
        owner_id: 5, // Robert Host
        name: 'Modern Miami Condo',
        description: 'Sleek modern condo with floor-to-ceiling windows and city views.',
        property_type: 'condo',
        address: '321 Biscayne Blvd, Miami, FL 33132',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        price_per_night: 200.00,
        bedrooms: 2,
        bathrooms: 2,
        max_guests: 4,
        amenities: 'WiFi, Kitchen, Pool, Gym, Parking, Balcony',
        house_rules: 'No smoking, No pets, No loud music',
        availability_start: '2024-01-01',
        availability_end: '2024-12-31',
        is_active: true
      },
      {
        owner_id: 6, // Lisa Property Manager
        name: 'Charming LA Studio',
        description: 'Artistic studio in the heart of Los Angeles, perfect for creative professionals.',
        property_type: 'studio',
        address: '654 Sunset Blvd, Los Angeles, CA 90028',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        price_per_night: 100.00,
        bedrooms: 0,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi, Kitchenette, Air Conditioning, Workspace',
        house_rules: 'No smoking, No pets, Keep noise down',
        availability_start: '2024-01-01',
        availability_end: '2024-12-31',
        is_active: true
      },
      {
        owner_id: 6, // Lisa Property Manager
        name: 'Hollywood Hills House',
        description: 'Beautiful house in Hollywood Hills with panoramic city views and private garden.',
        property_type: 'house',
        address: '987 Mulholland Drive, Los Angeles, CA 90046',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        price_per_night: 300.00,
        bedrooms: 3,
        bathrooms: 2,
        max_guests: 6,
        amenities: 'WiFi, Kitchen, Pool, Garden, Parking, Mountain Views',
        house_rules: 'No smoking, No pets, No parties, Respect the neighborhood',
        availability_start: '2024-01-01',
        availability_end: '2024-12-31',
        is_active: true
      }
    ];
    
    for (const property of properties) {
      await connection.execute(
        `INSERT INTO properties (owner_id, name, description, property_type, address, city, state, country, 
                                price_per_night, bedrooms, bathrooms, max_guests, amenities, house_rules, 
                                availability_start, availability_end, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [property.owner_id, property.name, property.description, property.property_type, property.address,
         property.city, property.state, property.country, property.price_per_night, property.bedrooms,
         property.bathrooms, property.max_guests, property.amenities, property.house_rules,
         property.availability_start, property.availability_end, property.is_active]
      );
    }
    
    log(`✅ Added ${properties.length} properties`, 'green');
    
    // 3. Add Property Images
    log('\n📸 Adding Property Images...', 'cyan');
    
    const propertyImages = [
      { property_id: 1, image_url: '/uploads/properties/property-1-main.jpg', image_type: 'main', display_order: 1 },
      { property_id: 1, image_url: '/uploads/properties/property-1-gallery1.jpg', image_type: 'gallery', display_order: 2 },
      { property_id: 1, image_url: '/uploads/properties/property-1-gallery2.jpg', image_type: 'gallery', display_order: 3 },
      { property_id: 2, image_url: '/uploads/properties/property-2-main.jpg', image_type: 'main', display_order: 1 },
      { property_id: 2, image_url: '/uploads/properties/property-2-gallery1.jpg', image_type: 'gallery', display_order: 2 },
      { property_id: 3, image_url: '/uploads/properties/property-3-main.jpg', image_type: 'main', display_order: 1 },
      { property_id: 3, image_url: '/uploads/properties/property-3-gallery1.jpg', image_type: 'gallery', display_order: 2 },
      { property_id: 4, image_url: '/uploads/properties/property-4-main.jpg', image_type: 'main', display_order: 1 },
      { property_id: 5, image_url: '/uploads/properties/property-5-main.jpg', image_type: 'main', display_order: 1 },
      { property_id: 6, image_url: '/uploads/properties/property-6-main.jpg', image_type: 'main', display_order: 1 }
    ];
    
    for (const image of propertyImages) {
      await connection.execute(
        'INSERT INTO property_images (property_id, image_url, image_type, display_order) VALUES (?, ?, ?, ?)',
        [image.property_id, image.image_url, image.image_type, image.display_order]
      );
    }
    
    log(`✅ Added ${propertyImages.length} property images`, 'green');
    
    // 4. Add Bookings
    log('\n📅 Adding Bookings...', 'cyan');
    
    const bookings = [
      {
        traveler_id: 1, // John Traveler
        property_id: 1, // Beautiful Downtown Apartment
        owner_id: 4, // Jane Owner
        check_in_date: '2024-02-01',
        check_out_date: '2024-02-05',
        number_of_guests: 2,
        total_price: 600.00,
        status: 'accepted',
        special_requests: 'Late check-in if possible'
      },
      {
        traveler_id: 2, // Sarah Explorer
        property_id: 3, // Luxury Miami Beach Villa
        owner_id: 5, // Robert Host
        check_in_date: '2024-02-15',
        check_out_date: '2024-02-20',
        number_of_guests: 4,
        total_price: 2000.00,
        status: 'pending',
        special_requests: 'Anniversary celebration'
      },
      {
        traveler_id: 3, // Mike Adventurer
        property_id: 2, // Cozy Brooklyn Loft
        owner_id: 4, // Jane Owner
        check_in_date: '2024-01-20',
        check_out_date: '2024-01-25',
        number_of_guests: 1,
        total_price: 600.00,
        status: 'completed',
        special_requests: 'Business trip'
      },
      {
        traveler_id: 1, // John Traveler
        property_id: 5, // Charming LA Studio
        owner_id: 6, // Lisa Property Manager
        check_in_date: '2024-03-01',
        check_out_date: '2024-03-07',
        number_of_guests: 1,
        total_price: 600.00,
        status: 'cancelled',
        special_requests: 'Change of plans'
      },
      {
        traveler_id: 2, // Sarah Explorer
        property_id: 6, // Hollywood Hills House
        owner_id: 6, // Lisa Property Manager
        check_in_date: '2024-03-15',
        check_out_date: '2024-03-22',
        number_of_guests: 3,
        total_price: 2100.00,
        status: 'accepted',
        special_requests: 'Family vacation'
      }
    ];
    
    for (const booking of bookings) {
      await connection.execute(
        `INSERT INTO bookings (traveler_id, property_id, owner_id, check_in_date, check_out_date, 
                              number_of_guests, total_price, status, special_requests) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [booking.traveler_id, booking.property_id, booking.owner_id, booking.check_in_date,
         booking.check_out_date, booking.number_of_guests, booking.total_price, booking.status, booking.special_requests]
      );
    }
    
    log(`✅ Added ${bookings.length} bookings`, 'green');
    
    // 5. Add Favorites
    log('\n❤️  Adding Favorites...', 'cyan');
    
    const favorites = [
      { traveler_id: 1, property_id: 1 }, // John likes Downtown Apartment
      { traveler_id: 1, property_id: 3 }, // John likes Miami Villa
      { traveler_id: 2, property_id: 2 }, // Sarah likes Brooklyn Loft
      { traveler_id: 2, property_id: 6 }, // Sarah likes Hollywood Hills House
      { traveler_id: 3, property_id: 4 }, // Mike likes Miami Condo
      { traveler_id: 3, property_id: 5 }  // Mike likes LA Studio
    ];
    
    for (const favorite of favorites) {
      await connection.execute(
        'INSERT INTO favorites (traveler_id, property_id) VALUES (?, ?)',
        [favorite.traveler_id, favorite.property_id]
      );
    }
    
    log(`✅ Added ${favorites.length} favorites`, 'green');
    
    // 6. Add Reviews
    log('\n⭐ Adding Reviews...', 'cyan');
    
    const reviews = [
      {
        booking_id: 1, // John's booking
        reviewer_id: 1, // John Traveler
        property_id: 1, // Downtown Apartment
        rating: 5,
        review_text: 'Amazing apartment with great city views! The location was perfect and the host was very responsive.'
      },
      {
        booking_id: 3, // Mike's booking
        reviewer_id: 3, // Mike Adventurer
        property_id: 2, // Brooklyn Loft
        rating: 4,
        review_text: 'Great loft in a trendy area. The exposed brick walls give it character. Would stay again!'
      },
      {
        booking_id: 5, // Sarah's booking
        reviewer_id: 2, // Sarah Explorer
        property_id: 6, // Hollywood Hills House
        rating: 5,
        review_text: 'Absolutely stunning house with incredible views! Perfect for a family vacation. Highly recommended!'
      }
    ];
    
    for (const review of reviews) {
      await connection.execute(
        'INSERT INTO reviews (booking_id, reviewer_id, property_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
        [review.booking_id, review.reviewer_id, review.property_id, review.rating, review.review_text]
      );
    }
    
    log(`✅ Added ${reviews.length} reviews`, 'green');
    
    // 7. Display Summary
    log('\n📊 Database Summary:', 'bright');
    log('==================', 'bright');
    
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [propertyCount] = await connection.execute('SELECT COUNT(*) as count FROM properties');
    const [bookingCount] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
    const [favoriteCount] = await connection.execute('SELECT COUNT(*) as count FROM favorites');
    const [reviewCount] = await connection.execute('SELECT COUNT(*) as count FROM reviews');
    const [imageCount] = await connection.execute('SELECT COUNT(*) as count FROM property_images');
    
    log(`👥 Users: ${userCount[0].count} (3 travelers, 3 owners)`, 'green');
    log(`🏠 Properties: ${propertyCount[0].count}`, 'green');
    log(`📅 Bookings: ${bookingCount[0].count}`, 'green');
    log(`❤️  Favorites: ${favoriteCount[0].count}`, 'green');
    log(`⭐ Reviews: ${reviewCount[0].count}`, 'green');
    log(`📸 Images: ${imageCount[0].count}`, 'green');
    
    log('\n🎉 Sample data added successfully!', 'bright');
    log('Your Airbnb backend is now ready for comprehensive testing!', 'green');
    
  } catch (error) {
    log(`❌ Error adding sample data: ${error.message}`, 'red');
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
addSampleData().catch((error) => {
  log(`❌ Script failed: ${error.message}`, 'red');
  process.exit(1);
});
