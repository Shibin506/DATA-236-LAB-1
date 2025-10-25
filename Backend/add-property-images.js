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

async function addPropertyImages() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get all properties
    const [properties] = await connection.execute('SELECT id, name, property_type, city FROM properties ORDER BY id');
    console.log(`📸 Found ${properties.length} properties to add images for`);

    // Property images data - organized by property type and neighborhood
    const propertyImages = {
      // Mission District Properties
      1: [ // Modern Mission Loft with City Views
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      2: [ // Charming Victorian in Mission
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      3: [ // Trendy Mission Apartment
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],

      // Castro District Properties
      4: [ // Elegant Castro Victorian
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
      ],
      5: [ // Castro Studio with Garden
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],

      // SOMA Properties
      6: [ // Luxury SOMA Penthouse
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop'
      ],
      7: [ // Modern SOMA Loft
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      8: [ // SOMA Tech Apartment
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],

      // North Beach Properties
      9: [ // Charming North Beach Apartment
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop'
      ],
      10: [ // Historic North Beach Studio
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
      ],

      // Haight-Ashbury Properties
      11: [ // Colorful Haight Victorian
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      12: [ // Bohemian Haight Apartment
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],

      // Marina District Properties
      13: [ // Marina Bay View Apartment
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
      ],
      14: [ // Luxury Marina Condo
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'
      ],

      // Pacific Heights Properties
      15: [ // Elegant Pacific Heights Mansion
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],
      16: [ // Chic Pacific Heights Apartment
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
      ],

      // Russian Hill Properties
      17: [ // Historic Russian Hill Apartment
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop'
      ],
      18: [ // Russian Hill Studio with Views
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
      ],

      // Sunset District Properties
      19: [ // Sunset Family Home
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      20: [ // Sunset Apartment Near Beach
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],

      // Richmond District Properties
      21: [ // Richmond District Victorian
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      22: [ // Richmond Apartment with Garden
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],

      // Financial District Properties
      23: [ // Luxury Financial District Condo
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'
      ],
      24: [ // Financial District Studio
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],

      // Chinatown Properties
      25: [ // Historic Chinatown Apartment
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop'
      ],
      26: [ // Chinatown Cultural Studio
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
      ],

      // Nob Hill Properties
      27: [ // Luxury Nob Hill Apartment
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
      ],
      28: [ // Nob Hill Historic Studio
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
      ],

      // Potrero Hill Properties
      29: [ // Modern Potrero Hill Loft
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      30: [ // Potrero Hill Family Home
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ]
    };

    // Add images for each property
    let totalImages = 0;
    for (const property of properties) {
      const propertyId = property.id;
      const images = propertyImages[propertyId] || [];
      
      if (images.length > 0) {
        console.log(`📸 Adding ${images.length} images for: ${property.name}`);
        
        for (let i = 0; i < images.length; i++) {
          const imageUrl = images[i];
          const imageType = i === 0 ? 'main' : 'gallery';
          const displayOrder = i + 1;
          
          await connection.execute(
            `INSERT INTO property_images (property_id, image_url, image_type, display_order, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [propertyId, imageUrl, imageType, displayOrder]
          );
          
          totalImages++;
        }
      } else {
        console.log(`⚠️  No images found for property ID ${propertyId}: ${property.name}`);
      }
    }

    console.log('✅ Successfully added property images');
    console.log(`📊 Summary:`);
    console.log(`   - Total properties: ${properties.length}`);
    console.log(`   - Total images added: ${totalImages}`);
    console.log(`   - Each property has 2-6 images`);
    console.log(`   - First image is marked as 'main', others as 'gallery'`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

addPropertyImages();
