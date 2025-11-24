const mongoose = require('mongoose');
require('./src/config/database');

const Property = require('./src/models/Property');

async function checkProperties() {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const properties = await Property.find({ _id: { $in: [1, 9] } })
      .select('_id name availability_start availability_end is_active')
      .lean();
    
    console.log('Properties:', JSON.stringify(properties, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProperties();
