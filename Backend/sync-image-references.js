const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sarveshwaghmare101_db_user:Z3WNwIKBCUVw390a@airbnb-main.d4apnix.mongodb.net/airbnb?retryWrites=true&w=majority&appName=airbnb-main';

async function syncImageReferences() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get all binary images
    const binaryImages = await db.collection('property_images_binary').find({}).sort({ property_id: 1, display_order: 1 }).toArray();
    console.log(`📸 Found ${binaryImages.length} binary images`);

    // Clear existing propertyimages collection
    await db.collection('propertyimages').deleteMany({});
    console.log('🗑️  Cleared propertyimages collection');

    // Create references in propertyimages collection
    const imageReferences = binaryImages.map(img => ({
      property_id: img.property_id,
      image_url: `/uploads/properties/${img.filename}`,
      image_type: img.image_type || 'gallery',
      display_order: img.display_order || 1,
      created_at: new Date()
    }));

    if (imageReferences.length > 0) {
      await db.collection('propertyimages').insertMany(imageReferences);
      console.log(`✅ Created ${imageReferences.length} image references`);
    }

    // Verify
    const count = await db.collection('propertyimages').countDocuments();
    console.log(`📊 Total documents in propertyimages: ${count}`);

    // Show sample
    const sample = await db.collection('propertyimages').find({ property_id: 1 }).toArray();
    console.log('\n📷 Sample for property 1:');
    console.log(JSON.stringify(sample, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

syncImageReferences();
