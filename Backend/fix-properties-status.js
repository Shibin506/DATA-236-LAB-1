const mongoose = require('mongoose');
require('./src/config/database');

const Property = require('./src/models/Property');

async function fixProperties() {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Updating all properties to active status...');
    
    const result = await Property.updateMany(
      {},
      { 
        $set: { 
          status: 'active',
          is_active: true 
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} properties`);
    
    const properties = await Property.find().select('_id status is_active').lean();
    console.log('Sample properties:', JSON.stringify(properties.slice(0, 5), null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixProperties();
