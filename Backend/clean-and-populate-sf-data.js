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

async function cleanAndPopulateSFData() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Cleaning existing data...');
    await connection.execute('DELETE FROM favorites');
    await connection.execute('DELETE FROM bookings');
    await connection.execute('DELETE FROM property_images');
    await connection.execute('DELETE FROM reviews');
    await connection.execute('DELETE FROM properties');
    await connection.execute('DELETE FROM users WHERE user_type = "owner"');
    await connection.execute('DELETE FROM users WHERE user_type = "traveler"');

    // Create San Francisco property owners
    console.log('👥 Creating San Francisco property owners...');
    const owners = [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@sfhost.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QYzK2a', // 'password123'
        user_type: 'owner',
        phone: '+1-415-555-0101',
        about_me: 'Local SF resident and property manager with 10+ years experience',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        languages: 'English, Mandarin',
        gender: 'Female',
        is_verified: true
      },
      {
        name: 'Michael Rodriguez',
        email: 'mike.rodriguez@sfhost.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QYzK2a',
        user_type: 'owner',
        phone: '+1-415-555-0102',
        about_me: 'Tech professional turned property investor in SF',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        languages: 'English, Spanish',
        gender: 'Male',
        is_verified: true
      },
      {
        name: 'Jennifer Kim',
        email: 'jennifer.kim@sfhost.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QYzK2a',
        user_type: 'owner',
        phone: '+1-415-555-0103',
        about_me: 'Architect and interior designer specializing in SF homes',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        languages: 'English, Korean',
        gender: 'Female',
        is_verified: true
      },
      {
        name: 'David Thompson',
        email: 'david.thompson@sfhost.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QYzK2a',
        user_type: 'owner',
        phone: '+1-415-555-0104',
        about_me: 'Long-time SF resident and hospitality expert',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        languages: 'English',
        gender: 'Male',
        is_verified: true
      },
      {
        name: 'Lisa Wang',
        email: 'lisa.wang@sfhost.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QYzK2a',
        user_type: 'owner',
        phone: '+1-415-555-0105',
        about_me: 'Real estate professional with luxury SF properties',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        languages: 'English, Mandarin, Cantonese',
        gender: 'Female',
        is_verified: true
      }
    ];

    const ownerIds = [];
    for (const owner of owners) {
      const [result] = await connection.execute(
        `INSERT INTO users (name, email, password, user_type, phone, about_me, city, state, country, languages, gender, is_verified, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [owner.name, owner.email, owner.password, owner.user_type, owner.phone, owner.about_me, owner.city, owner.state, owner.country, owner.languages, owner.gender, owner.is_verified]
      );
      ownerIds.push(result.insertId);
    }

    // Create sample travelers
    console.log('🧳 Creating sample travelers...');
    const travelers = [
      {
        name: 'Alex Johnson',
        email: 'alex.johnson@email.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QYzK2a',
        user_type: 'traveler',
        phone: '+1-555-555-0201',
        about_me: 'Travel enthusiast exploring SF',
        city: 'Seattle',
        state: 'WA',
        country: 'USA',
        languages: 'English',
        gender: 'Male',
        is_verified: true
      },
      {
        name: 'Emma Davis',
        email: 'emma.davis@email.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J.8QYzK2a',
        user_type: 'traveler',
        phone: '+1-555-555-0202',
        about_me: 'Business traveler visiting SF regularly',
        city: 'Portland',
        state: 'OR',
        country: 'USA',
        languages: 'English, French',
        gender: 'Female',
        is_verified: true
      }
    ];

    for (const traveler of travelers) {
      await connection.execute(
        `INSERT INTO users (name, email, password, user_type, phone, about_me, city, state, country, languages, gender, is_verified, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [traveler.name, traveler.email, traveler.password, traveler.user_type, traveler.phone, traveler.about_me, traveler.city, traveler.state, traveler.country, traveler.languages, traveler.gender, traveler.is_verified]
      );
    }

    // Create 30 San Francisco properties
    console.log('🏠 Creating 30 San Francisco properties...');
    const sfProperties = [
      // Mission District Properties
      {
        name: 'Modern Mission Loft with City Views',
        description: 'Stunning loft in the heart of Mission District with panoramic city views. Recently renovated with high-end finishes.',
        property_type: 'loft',
        address: '2847 Mission Street, San Francisco, CA 94110',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 185,
        bedrooms: 2,
        bathrooms: 1,
        max_guests: 4,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Workspace',
        house_rules: 'No smoking, No pets, No parties',
        owner_id: ownerIds[0]
      },
      {
        name: 'Charming Victorian in Mission',
        description: 'Beautiful Victorian home with original details and modern amenities. Perfect for families.',
        property_type: 'house',
        address: '1234 Valencia Street, San Francisco, CA 94110',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 220,
        bedrooms: 3,
        bathrooms: 2,
        max_guests: 6,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Heating,TV,Garden,Free Parking',
        house_rules: 'No smoking, No pets, Quiet hours after 10pm',
        owner_id: ownerIds[0]
      },
      {
        name: 'Trendy Mission Apartment',
        description: 'Stylish apartment in the vibrant Mission District. Walking distance to restaurants and bars.',
        property_type: 'apartment',
        address: '4567 24th Street, San Francisco, CA 94110',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 165,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV,Workspace',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[1]
      },

      // Castro District Properties
      {
        name: 'Elegant Castro Victorian',
        description: 'Magnificent Victorian home in Castro District with stunning architecture and modern comforts.',
        property_type: 'house',
        address: '789 Castro Street, San Francisco, CA 94114',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 275,
        bedrooms: 4,
        bathrooms: 3,
        max_guests: 8,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Garden,Free Parking',
        house_rules: 'No smoking, No pets, No parties',
        owner_id: ownerIds[1]
      },
      {
        name: 'Castro Studio with Garden',
        description: 'Cozy studio apartment with private garden access. Perfect for solo travelers or couples.',
        property_type: 'studio',
        address: '2345 18th Street, San Francisco, CA 94114',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 145,
        bedrooms: 0,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV,Garden',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[2]
      },

      // SOMA Properties
      {
        name: 'Luxury SOMA Penthouse',
        description: 'Stunning penthouse with panoramic city and bay views. Modern luxury at its finest.',
        property_type: 'apartment',
        address: '100 Folsom Street, San Francisco, CA 94105',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 450,
        bedrooms: 3,
        bathrooms: 2,
        max_guests: 6,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Workspace,Gym,Pool',
        house_rules: 'No smoking, No pets, No parties',
        owner_id: ownerIds[2]
      },
      {
        name: 'Modern SOMA Loft',
        description: 'Contemporary loft with exposed brick and high ceilings. Walking distance to tech companies.',
        property_type: 'loft',
        address: '567 Brannan Street, San Francisco, CA 94107',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 195,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 3,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Workspace',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[3]
      },
      {
        name: 'SOMA Tech Apartment',
        description: 'Perfect for business travelers. High-speed internet and workspace included.',
        property_type: 'apartment',
        address: '890 Harrison Street, San Francisco, CA 94107',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 175,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV,Workspace,High-speed Internet',
        house_rules: 'No smoking, No pets, Quiet hours',
        owner_id: ownerIds[3]
      },

      // North Beach Properties
      {
        name: 'Charming North Beach Apartment',
        description: 'Cozy apartment in the heart of North Beach. Steps away from Italian restaurants and cafes.',
        property_type: 'apartment',
        address: '123 Columbus Avenue, San Francisco, CA 94133',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 155,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[4]
      },
      {
        name: 'Historic North Beach Studio',
        description: 'Charming studio in historic North Beach building. Perfect for exploring the neighborhood.',
        property_type: 'studio',
        address: '456 Grant Avenue, San Francisco, CA 94133',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 135,
        bedrooms: 0,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[4]
      },

      // Haight-Ashbury Properties
      {
        name: 'Colorful Haight Victorian',
        description: 'Vibrant Victorian home in the famous Haight-Ashbury district. Full of character and charm.',
        property_type: 'house',
        address: '789 Haight Street, San Francisco, CA 94117',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 200,
        bedrooms: 2,
        bathrooms: 1,
        max_guests: 4,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Heating,TV,Garden',
        house_rules: 'No smoking, No pets, Respectful of neighbors',
        owner_id: ownerIds[0]
      },
      {
        name: 'Bohemian Haight Apartment',
        description: 'Eclectic apartment in the heart of Haight-Ashbury. Walking distance to Golden Gate Park.',
        property_type: 'apartment',
        address: '2345 Ashbury Street, San Francisco, CA 94117',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 170,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 3,
        amenities: 'WiFi,Kitchen,TV,Garden',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[1]
      },

      // Marina District Properties
      {
        name: 'Marina Bay View Apartment',
        description: 'Beautiful apartment with stunning bay views. Close to the waterfront and parks.',
        property_type: 'apartment',
        address: '3456 Marina Boulevard, San Francisco, CA 94123',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 250,
        bedrooms: 2,
        bathrooms: 2,
        max_guests: 4,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Free Parking',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[2]
      },
      {
        name: 'Luxury Marina Condo',
        description: 'High-end condo with premium amenities. Perfect for business or leisure travelers.',
        property_type: 'condo',
        address: '4567 Chestnut Street, San Francisco, CA 94123',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 320,
        bedrooms: 2,
        bathrooms: 2,
        max_guests: 4,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Gym,Pool,Free Parking',
        house_rules: 'No smoking, No pets, No parties',
        owner_id: ownerIds[2]
      },

      // Pacific Heights Properties
      {
        name: 'Elegant Pacific Heights Mansion',
        description: 'Stunning mansion in prestigious Pacific Heights. Luxury living at its finest.',
        property_type: 'house',
        address: '1234 Pacific Avenue, San Francisco, CA 94115',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 500,
        bedrooms: 5,
        bathrooms: 4,
        max_guests: 10,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Garden,Free Parking,Pool',
        house_rules: 'No smoking, No pets, No parties',
        owner_id: ownerIds[3]
      },
      {
        name: 'Chic Pacific Heights Apartment',
        description: 'Sophisticated apartment with city views. Walking distance to Fillmore Street shopping.',
        property_type: 'apartment',
        address: '5678 Fillmore Street, San Francisco, CA 94115',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 280,
        bedrooms: 2,
        bathrooms: 2,
        max_guests: 4,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Free Parking',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[3]
      },

      // Russian Hill Properties
      {
        name: 'Historic Russian Hill Apartment',
        description: 'Charming apartment in historic Russian Hill. Close to Lombard Street and cable cars.',
        property_type: 'apartment',
        address: '2345 Hyde Street, San Francisco, CA 94109',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 195,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[4]
      },
      {
        name: 'Russian Hill Studio with Views',
        description: 'Cozy studio with partial bay views. Perfect for solo travelers.',
        property_type: 'studio',
        address: '3456 Leavenworth Street, San Francisco, CA 94109',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 165,
        bedrooms: 0,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[4]
      },

      // Sunset District Properties
      {
        name: 'Sunset Family Home',
        description: 'Spacious family home in the Sunset District. Close to Golden Gate Park and the beach.',
        property_type: 'house',
        address: '4567 Irving Street, San Francisco, CA 94122',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 180,
        bedrooms: 3,
        bathrooms: 2,
        max_guests: 6,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Heating,TV,Garden,Free Parking',
        house_rules: 'No smoking, No pets, Family-friendly',
        owner_id: ownerIds[0]
      },
      {
        name: 'Sunset Apartment Near Beach',
        description: 'Comfortable apartment in the Sunset District. Walking distance to Ocean Beach.',
        property_type: 'apartment',
        address: '1234 Judah Street, San Francisco, CA 94122',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 150,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 3,
        amenities: 'WiFi,Kitchen,TV,Free Parking',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[1]
      },

      // Richmond District Properties
      {
        name: 'Richmond District Victorian',
        description: 'Beautiful Victorian home in the Richmond District. Close to Golden Gate Park.',
        property_type: 'house',
        address: '2345 Clement Street, San Francisco, CA 94121',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 200,
        bedrooms: 3,
        bathrooms: 2,
        max_guests: 6,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Heating,TV,Garden,Free Parking',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[2]
      },
      {
        name: 'Richmond Apartment with Garden',
        description: 'Charming apartment with shared garden. Perfect for nature lovers.',
        property_type: 'apartment',
        address: '3456 Balboa Street, San Francisco, CA 94121',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 160,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV,Garden',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[2]
      },

      // Financial District Properties
      {
        name: 'Luxury Financial District Condo',
        description: 'High-end condo in the heart of the Financial District. Perfect for business travelers.',
        property_type: 'condo',
        address: '100 California Street, San Francisco, CA 94111',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 400,
        bedrooms: 2,
        bathrooms: 2,
        max_guests: 4,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Workspace,Gym,Pool,Free Parking',
        house_rules: 'No smoking, No pets, No parties',
        owner_id: ownerIds[3]
      },
      {
        name: 'Financial District Studio',
        description: 'Modern studio in the Financial District. Walking distance to all major offices.',
        property_type: 'studio',
        address: '456 Montgomery Street, San Francisco, CA 94104',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 180,
        bedrooms: 0,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV,Workspace',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[3]
      },

      // Chinatown Properties
      {
        name: 'Historic Chinatown Apartment',
        description: 'Charming apartment in historic Chinatown. Experience authentic San Francisco culture.',
        property_type: 'apartment',
        address: '123 Grant Avenue, San Francisco, CA 94108',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 140,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[4]
      },
      {
        name: 'Chinatown Cultural Studio',
        description: 'Unique studio in the heart of Chinatown. Perfect for cultural exploration.',
        property_type: 'studio',
        address: '456 Stockton Street, San Francisco, CA 94108',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 125,
        bedrooms: 0,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[4]
      },

      // Nob Hill Properties
      {
        name: 'Luxury Nob Hill Apartment',
        description: 'Elegant apartment in prestigious Nob Hill. Stunning city and bay views.',
        property_type: 'apartment',
        address: '789 California Street, San Francisco, CA 94108',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 350,
        bedrooms: 2,
        bathrooms: 2,
        max_guests: 4,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Free Parking',
        house_rules: 'No smoking, No pets, No parties',
        owner_id: ownerIds[0]
      },
      {
        name: 'Nob Hill Historic Studio',
        description: 'Charming studio in historic Nob Hill building. Close to cable cars and shopping.',
        property_type: 'studio',
        address: '2345 Mason Street, San Francisco, CA 94133',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 200,
        bedrooms: 0,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[0]
      },

      // Potrero Hill Properties
      {
        name: 'Modern Potrero Hill Loft',
        description: 'Contemporary loft with city views. Popular with tech professionals.',
        property_type: 'loft',
        address: '1234 18th Street, San Francisco, CA 94107',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 190,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 3,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Workspace',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[1]
      },
      {
        name: 'Potrero Hill Family Home',
        description: 'Spacious family home with garden. Perfect for families visiting SF.',
        property_type: 'house',
        address: '2345 20th Street, San Francisco, CA 94107',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 220,
        bedrooms: 3,
        bathrooms: 2,
        max_guests: 6,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Heating,TV,Garden,Free Parking',
        house_rules: 'No smoking, No pets, Family-friendly',
        owner_id: ownerIds[1]
      },

      // Bernal Heights Properties
      {
        name: 'Bernal Heights Garden Apartment',
        description: 'Charming apartment with shared garden. Quiet neighborhood with great views.',
        property_type: 'apartment',
        address: '3456 Mission Street, San Francisco, CA 94110',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 170,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: 'WiFi,Kitchen,TV,Garden',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[2]
      },
      {
        name: 'Bernal Heights Victorian',
        description: 'Beautiful Victorian home with garden. Perfect for families or groups.',
        property_type: 'house',
        address: '4567 Cortland Avenue, San Francisco, CA 94110',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        price_per_night: 210,
        bedrooms: 3,
        bathrooms: 2,
        max_guests: 6,
        amenities: 'WiFi,Kitchen,Washer,Dryer,Heating,TV,Garden,Free Parking',
        house_rules: 'No smoking, No pets',
        owner_id: ownerIds[2]
      }
    ];

    // Insert properties
    for (const property of sfProperties) {
      await connection.execute(
        `INSERT INTO properties (owner_id, name, description, property_type, address, city, state, country,
                                price_per_night, bedrooms, bathrooms, max_guests, amenities, house_rules,
                                is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [property.owner_id, property.name, property.description, property.property_type, property.address,
         property.city, property.state, property.country, property.price_per_night, property.bedrooms,
         property.bathrooms, property.max_guests, property.amenities, property.house_rules]
      );
    }

    console.log('✅ Successfully created 30 San Francisco properties');
    console.log('✅ Database cleaned and populated with SF-only data');
    console.log('📊 Summary:');
    console.log(`   - 5 Property Owners`);
    console.log(`   - 2 Sample Travelers`);
    console.log(`   - 30 San Francisco Properties`);
    console.log(`   - All properties are in San Francisco, CA`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

cleanAndPopulateSFData();
