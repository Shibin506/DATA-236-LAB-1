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

async function addAllPropertyImages() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get all properties
    const [properties] = await connection.execute('SELECT id, name, property_type, city FROM properties ORDER BY id');
    console.log(`📸 Found ${properties.length} properties to add images for`);

    // Clear existing images first
    console.log('🧹 Clearing existing property images...');
    await connection.execute('DELETE FROM property_images');

    // Property image templates by type
    const imageTemplates = {
      'apartment': [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      'house': [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
      ],
      'studio': [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],
      'loft': [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop'
      ],
      'condo': [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'
      ]
    };

    // Add images for each property
    let totalImages = 0;
    for (const property of properties) {
      const propertyId = property.id;
      const propertyType = property.property_type;
      const images = imageTemplates[propertyType] || imageTemplates['apartment'];
      
      // Randomly select 2-5 images for each property
      const numImages = Math.floor(Math.random() * 4) + 2; // 2-5 images
      const selectedImages = images.slice(0, numImages);
      
      console.log(`📸 Adding ${selectedImages.length} images for: ${property.name} (${propertyType})`);
      
      for (let i = 0; i < selectedImages.length; i++) {
        const imageUrl = selectedImages[i];
        const imageType = i === 0 ? 'main' : 'gallery';
        const displayOrder = i + 1;
        
        await connection.execute(
          `INSERT INTO property_images (property_id, image_url, image_type, display_order, created_at) 
           VALUES (?, ?, ?, ?, NOW())`,
          [propertyId, imageUrl, imageType, displayOrder]
        );
        
        totalImages++;
      }
    }

    console.log('✅ Successfully added property images for all properties');
    console.log(`📊 Summary:`);
    console.log(`   - Total properties: ${properties.length}`);
    console.log(`   - Total images added: ${totalImages}`);
    console.log(`   - Each property has 2-5 images`);
    console.log(`   - First image is marked as 'main', others as 'gallery'`);
    console.log(`   - Images are organized by property type`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

addAllPropertyImages();
