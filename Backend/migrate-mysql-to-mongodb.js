// MySQL to MongoDB Data Migration Script
// This script exports all data from MySQL and imports it into MongoDB

const mysql = require('mysql2/promise')
const mongoose = require('mongoose')
require('dotenv').config()

// ============================================
// STEP 1: Configure Your MongoDB Connection
// ============================================
// Replace this with your MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/airbnb?retryWrites=true&w=majority'

// MySQL Connection (from your current .env)
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'abcd@1234',
  database: process.env.DB_NAME || 'air_bnb'
}

// ============================================
// MongoDB Schemas (Mongoose Models)
// ============================================

// User Schema
const userSchema = new mongoose.Schema({
  _id: Number, // Use MySQL ID as MongoDB _id
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: String,
  phone: String,
  user_type: { type: String, enum: ['traveler', 'owner'], default: 'traveler' },
  profile_image: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'users', timestamps: false })

// Property Schema
const propertySchema = new mongoose.Schema({
  _id: Number,
  owner_id: { type: Number, ref: 'User' },
  name: { type: String, required: true },
  description: String,
  address: String,
  city: String,
  state: String,
  country: String,
  zip_code: String,
  latitude: Number,
  longitude: Number,
  property_type: String,
  bedrooms: Number,
  bathrooms: Number,
  max_guests: Number,
  price_per_night: Number,
  cleaning_fee: Number,
  service_fee: Number,
  amenities: [String], // Will parse JSON
  house_rules: String,
  cancellation_policy: String,
  check_in_time: String,
  check_out_time: String,
  minimum_nights: Number,
  maximum_nights: Number,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'properties', timestamps: false })

// Property Images Schema
const propertyImageSchema = new mongoose.Schema({
  _id: Number,
  property_id: { type: Number, ref: 'Property' },
  image_url: String,
  image_type: { type: String, enum: ['main', 'gallery'], default: 'gallery' },
  display_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, { collection: 'property_images', timestamps: false })

// Booking Schema
const bookingSchema = new mongoose.Schema({
  _id: Number,
  property_id: { type: Number, ref: 'Property' },
  traveler_id: { type: Number, ref: 'User' },
  owner_id: { type: Number, ref: 'User' },
  check_in_date: Date,
  check_out_date: Date,
  number_of_guests: Number,
  total_price: Number,
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'], default: 'Pending' },
  special_requests: String,
  cancellation_reason: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'bookings', timestamps: false })

// Review Schema
const reviewSchema = new mongoose.Schema({
  _id: Number,
  property_id: { type: Number, ref: 'Property' },
  traveler_id: { type: Number, ref: 'User' },
  booking_id: { type: Number, ref: 'Booking' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  cleanliness_rating: Number,
  accuracy_rating: Number,
  communication_rating: Number,
  location_rating: Number,
  value_rating: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'reviews', timestamps: false })

// Favorite Schema
const favoriteSchema = new mongoose.Schema({
  _id: Number,
  user_id: { type: Number, ref: 'User' },
  property_id: { type: Number, ref: 'Property' },
  created_at: { type: Date, default: Date.now }
}, { collection: 'favorites', timestamps: false })

// Session Schema
const sessionSchema = new mongoose.Schema({
  _id: String,
  expires: Date,
  session: String
}, { collection: 'sessions', timestamps: false })

// Create Models
const User = mongoose.model('User', userSchema)
const Property = mongoose.model('Property', propertySchema)
const PropertyImage = mongoose.model('PropertyImage', propertyImageSchema)
const Booking = mongoose.model('Booking', bookingSchema)
const Review = mongoose.model('Review', reviewSchema)
const Favorite = mongoose.model('Favorite', favoriteSchema)
const Session = mongoose.model('Session', sessionSchema)

// ============================================
// Migration Functions
// ============================================

async function migrateUsers(mysqlConn) {
  console.log('\n📦 Migrating Users...')
  const [rows] = await mysqlConn.query('SELECT * FROM users')
  
  if (rows.length === 0) {
    console.log('  ⚠️  No users found')
    return
  }

  for (const row of rows) {
    await User.findOneAndUpdate(
      { _id: row.id },
      {
        _id: row.id,
        email: row.email,
        password: row.password, // Already encrypted with bcrypt
        full_name: row.full_name,
        phone: row.phone,
        user_type: row.user_type,
        profile_image: row.profile_image,
        created_at: row.created_at,
        updated_at: row.updated_at
      },
      { upsert: true, new: true }
    )
  }
  
  console.log(`  ✅ Migrated ${rows.length} users`)
}

async function migrateProperties(mysqlConn) {
  console.log('\n📦 Migrating Properties...')
  const [rows] = await mysqlConn.query('SELECT * FROM properties')
  
  if (rows.length === 0) {
    console.log('  ⚠️  No properties found')
    return
  }

  for (const row of rows) {
    // Parse JSON amenities if stored as string
    let amenities = []
    if (row.amenities) {
      try {
        amenities = JSON.parse(row.amenities)
      } catch (e) {
        amenities = typeof row.amenities === 'string' ? row.amenities.split(',') : []
      }
    }

    await Property.findOneAndUpdate(
      { _id: row.id },
      {
        _id: row.id,
        owner_id: row.owner_id,
        name: row.name,
        description: row.description,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country,
        zip_code: row.zip_code,
        latitude: row.latitude,
        longitude: row.longitude,
        property_type: row.property_type,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        max_guests: row.max_guests,
        price_per_night: row.price_per_night,
        cleaning_fee: row.cleaning_fee,
        service_fee: row.service_fee,
        amenities: amenities,
        house_rules: row.house_rules,
        cancellation_policy: row.cancellation_policy,
        check_in_time: row.check_in_time,
        check_out_time: row.check_out_time,
        minimum_nights: row.minimum_nights,
        maximum_nights: row.maximum_nights,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at
      },
      { upsert: true, new: true }
    )
  }
  
  console.log(`  ✅ Migrated ${rows.length} properties`)
}

async function migratePropertyImages(mysqlConn) {
  console.log('\n📦 Migrating Property Images...')
  const [rows] = await mysqlConn.query('SELECT * FROM property_images')
  
  if (rows.length === 0) {
    console.log('  ⚠️  No property images found')
    return
  }

  for (const row of rows) {
    await PropertyImage.findOneAndUpdate(
      { _id: row.id },
      {
        _id: row.id,
        property_id: row.property_id,
        image_url: row.image_url,
        image_type: row.image_type,
        display_order: row.display_order,
        created_at: row.created_at
      },
      { upsert: true, new: true }
    )
  }
  
  console.log(`  ✅ Migrated ${rows.length} property images`)
}

async function migrateBookings(mysqlConn) {
  console.log('\n📦 Migrating Bookings...')
  const [rows] = await mysqlConn.query('SELECT * FROM bookings')
  
  if (rows.length === 0) {
    console.log('  ⚠️  No bookings found')
    return
  }

  for (const row of rows) {
    await Booking.findOneAndUpdate(
      { _id: row.id },
      {
        _id: row.id,
        property_id: row.property_id,
        traveler_id: row.traveler_id,
        owner_id: row.owner_id,
        check_in_date: row.check_in_date,
        check_out_date: row.check_out_date,
        number_of_guests: row.number_of_guests,
        total_price: row.total_price,
        status: row.status,
        special_requests: row.special_requests,
        cancellation_reason: row.cancellation_reason,
        created_at: row.created_at,
        updated_at: row.updated_at
      },
      { upsert: true, new: true }
    )
  }
  
  console.log(`  ✅ Migrated ${rows.length} bookings`)
}

async function migrateReviews(mysqlConn) {
  console.log('\n📦 Migrating Reviews...')
  const [rows] = await mysqlConn.query('SELECT * FROM reviews')
  
  if (rows.length === 0) {
    console.log('  ⚠️  No reviews found')
    return
  }

  for (const row of rows) {
    await Review.findOneAndUpdate(
      { _id: row.id },
      {
        _id: row.id,
        property_id: row.property_id,
        traveler_id: row.traveler_id,
        booking_id: row.booking_id,
        rating: row.rating,
        comment: row.comment,
        cleanliness_rating: row.cleanliness_rating,
        accuracy_rating: row.accuracy_rating,
        communication_rating: row.communication_rating,
        location_rating: row.location_rating,
        value_rating: row.value_rating,
        created_at: row.created_at,
        updated_at: row.updated_at
      },
      { upsert: true, new: true }
    )
  }
  
  console.log(`  ✅ Migrated ${rows.length} reviews`)
}

async function migrateFavorites(mysqlConn) {
  console.log('\n📦 Migrating Favorites...')
  const [rows] = await mysqlConn.query('SELECT * FROM favorites')
  
  if (rows.length === 0) {
    console.log('  ⚠️  No favorites found')
    return
  }

  for (const row of rows) {
    await Favorite.findOneAndUpdate(
      { _id: row.id },
      {
        _id: row.id,
        user_id: row.user_id,
        property_id: row.property_id,
        created_at: row.created_at
      },
      { upsert: true, new: true }
    )
  }
  
  console.log(`  ✅ Migrated ${rows.length} favorites`)
}

async function migrateSessions(mysqlConn) {
  console.log('\n📦 Migrating Sessions...')
  const [rows] = await mysqlConn.query('SELECT * FROM sessions')
  
  if (rows.length === 0) {
    console.log('  ⚠️  No sessions found')
    return
  }

  for (const row of rows) {
    await Session.findOneAndUpdate(
      { _id: row.session_id },
      {
        _id: row.session_id,
        expires: row.expires,
        session: row.data
      },
      { upsert: true, new: true }
    )
  }
  
  console.log(`  ✅ Migrated ${rows.length} sessions`)
}

// ============================================
// Main Migration Function
// ============================================

async function runMigration() {
  let mysqlConn
  
  try {
    console.log('🚀 Starting MySQL to MongoDB Migration...\n')
    
    // Connect to MySQL
    console.log('📡 Connecting to MySQL...')
    mysqlConn = await mysql.createConnection(mysqlConfig)
    console.log('  ✅ MySQL connected')
    
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('  ✅ MongoDB connected')
    
    // Run migrations in order (respect foreign keys)
    await migrateUsers(mysqlConn)
    await migrateProperties(mysqlConn)
    await migratePropertyImages(mysqlConn)
    await migrateBookings(mysqlConn)
    await migrateReviews(mysqlConn)
    await migrateFavorites(mysqlConn)
    await migrateSessions(mysqlConn)
    
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`  Users: ${await User.countDocuments()}`)
    console.log(`  Properties: ${await Property.countDocuments()}`)
    console.log(`  Property Images: ${await PropertyImage.countDocuments()}`)
    console.log(`  Bookings: ${await Booking.countDocuments()}`)
    console.log(`  Reviews: ${await Review.countDocuments()}`)
    console.log(`  Favorites: ${await Favorite.countDocuments()}`)
    console.log(`  Sessions: ${await Session.countDocuments()}`)
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    // Close connections
    if (mysqlConn) await mysqlConn.end()
    await mongoose.disconnect()
    console.log('\n🔌 Connections closed')
  }
}

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ All done! You can now update your backend to use MongoDB.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Migration error:', error)
      process.exit(1)
    })
}

module.exports = { runMigration }
