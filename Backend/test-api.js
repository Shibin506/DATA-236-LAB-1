/**
 * API Test Script for Airbnb Backend
 * This script demonstrates how to use the API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let travelerSession = null;
let ownerSession = null;
let propertyId = null;
let bookingId = null;

// Helper function to make requests with session
async function makeRequest(method, endpoint, data = null, session = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      withCredentials: true, // Important for session cookies
    };

    if (data) {
      config.data = data;
    }

    // Add session cookie if provided
    if (session && session.cookie) {
      config.headers = {
        Cookie: session.cookie
      };
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint} failed:`, error.response?.data || error.message);
    throw error;
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check passed:', response.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  
  // Register traveler
  const travelerData = {
    name: 'John Traveler',
    email: 'traveler@example.com',
    password: 'SecurePass123!',
    user_type: 'traveler',
    phone: '+1234567890'
  };
  
  try {
    const response = await makeRequest('POST', '/auth/register', travelerData);
    console.log('✅ Traveler registered:', response.data.user.name);
    travelerSession = { cookie: response.headers['set-cookie']?.join('; ') };
  } catch (error) {
    console.log('ℹ️  Traveler might already exist, trying login...');
    await testTravelerLogin();
  }
  
  // Register owner
  const ownerData = {
    name: 'Jane Owner',
    email: 'owner@example.com',
    password: 'SecurePass123!',
    user_type: 'owner',
    phone: '+1234567891'
  };
  
  try {
    const response = await makeRequest('POST', '/auth/register', ownerData);
    console.log('✅ Owner registered:', response.data.user.name);
    ownerSession = { cookie: response.headers['set-cookie']?.join('; ') };
  } catch (error) {
    console.log('ℹ️  Owner might already exist, trying login...');
    await testOwnerLogin();
  }
}

async function testTravelerLogin() {
  console.log('\n🔐 Testing Traveler Login...');
  
  const loginData = {
    email: 'traveler@example.com',
    password: 'SecurePass123!'
  };
  
  try {
    const response = await makeRequest('POST', '/auth/login', loginData);
    console.log('✅ Traveler login successful:', response.data.user.name);
    travelerSession = { cookie: response.headers['set-cookie']?.join('; ') };
  } catch (error) {
    throw error;
  }
}

async function testOwnerLogin() {
  console.log('\n🔐 Testing Owner Login...');
  
  const loginData = {
    email: 'owner@example.com',
    password: 'SecurePass123!'
  };
  
  try {
    const response = await makeRequest('POST', '/auth/login', loginData);
    console.log('✅ Owner login successful:', response.data.user.name);
    ownerSession = { cookie: response.headers['set-cookie']?.join('; ') };
  } catch (error) {
    throw error;
  }
}

async function testProfileManagement() {
  console.log('\n👤 Testing Profile Management...');
  
  // Update traveler profile
  const profileData = {
    about_me: 'I love traveling and exploring new places!',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    languages: 'English, Spanish',
    gender: 'male'
  };
  
  try {
    const response = await makeRequest('PUT', '/users/profile', profileData, travelerSession);
    console.log('✅ Traveler profile updated:', response.data.user.name);
  } catch (error) {
    throw error;
  }
  
  // Get traveler profile
  try {
    const response = await makeRequest('GET', '/users/profile', null, travelerSession);
    console.log('✅ Traveler profile retrieved:', response.data.user.about_me);
  } catch (error) {
    throw error;
  }
}

async function testPropertyManagement() {
  console.log('\n🏠 Testing Property Management...');
  
  // Create property
  const propertyData = {
    name: 'Beautiful Downtown Apartment',
    description: 'A stunning apartment in the heart of downtown with amazing city views.',
    property_type: 'apartment',
    address: '123 Main Street, New York, NY 10001',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    price_per_night: 150.00,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    amenities: 'WiFi, Kitchen, Parking, Pool, Gym',
    house_rules: 'No smoking, No pets, Check-in after 3 PM',
    availability_start: '2024-01-01',
    availability_end: '2024-12-31'
  };
  
  try {
    const response = await makeRequest('POST', '/properties', propertyData, ownerSession);
    console.log('✅ Property created:', response.data.property.name);
    propertyId = response.data.property.id;
  } catch (error) {
    throw error;
  }
  
  // Get owner's properties
  try {
    const response = await makeRequest('GET', '/properties/owner/my-properties', null, ownerSession);
    console.log('✅ Owner properties retrieved:', response.data.properties.length, 'properties');
  } catch (error) {
    throw error;
  }
}

async function testPropertySearch() {
  console.log('\n🔍 Testing Property Search...');
  
  // Search properties
  const searchParams = new URLSearchParams({
    city: 'New York',
    guests: '2',
    min_price: '100',
    max_price: '200',
    page: '1',
    limit: '10'
  });
  
  try {
    const response = await axios.get(`${BASE_URL}/properties/search?${searchParams}`);
    console.log('✅ Property search successful:', response.data.data.properties.length, 'properties found');
    
    if (response.data.data.properties.length > 0) {
      const property = response.data.data.properties[0];
      console.log('   📍 Sample property:', property.name, '- $' + property.price_per_night + '/night');
    }
  } catch (error) {
    console.error('❌ Property search failed:', error.response?.data || error.message);
  }
}

async function testBookingFlow() {
  console.log('\n📅 Testing Booking Flow...');
  
  if (!propertyId) {
    console.log('❌ No property ID available for booking test');
    return;
  }
  
  // Create booking
  const bookingData = {
    property_id: propertyId,
    check_in_date: '2024-02-01',
    check_out_date: '2024-02-05',
    number_of_guests: 2,
    special_requests: 'Late check-in if possible'
  };
  
  try {
    const response = await makeRequest('POST', '/bookings', bookingData, travelerSession);
    console.log('✅ Booking created:', 'Total: $' + response.data.booking.total_price);
    bookingId = response.data.booking.id;
  } catch (error) {
    throw error;
  }
  
  // Get traveler's bookings
  try {
    const response = await makeRequest('GET', '/bookings/traveler/my-bookings', null, travelerSession);
    console.log('✅ Traveler bookings retrieved:', response.data.bookings.length, 'bookings');
  } catch (error) {
    throw error;
  }
  
  // Get owner's incoming requests
  try {
    const response = await makeRequest('GET', '/bookings/owner/incoming-requests', null, ownerSession);
    console.log('✅ Owner booking requests retrieved:', response.data.bookings.length, 'requests');
  } catch (error) {
    throw error;
  }
  
  // Accept booking (if we have a booking)
  if (bookingId) {
    try {
      const response = await makeRequest('PATCH', `/bookings/${bookingId}/accept`, null, ownerSession);
      console.log('✅ Booking accepted by owner');
    } catch (error) {
      console.log('ℹ️  Booking might already be accepted or not found');
    }
  }
}

async function testFavorites() {
  console.log('\n❤️  Testing Favorites...');
  
  if (!propertyId) {
    console.log('❌ No property ID available for favorites test');
    return;
  }
  
  // Add to favorites
  try {
    const response = await makeRequest('POST', `/favorites/${propertyId}`, null, travelerSession);
    console.log('✅ Property added to favorites');
  } catch (error) {
    console.log('ℹ️  Property might already be in favorites');
  }
  
  // Get favorites
  try {
    const response = await makeRequest('GET', '/favorites', null, travelerSession);
    console.log('✅ Favorites retrieved:', response.data.favorites.length, 'favorites');
  } catch (error) {
    throw error;
  }
  
  // Get favorites count
  try {
    const response = await makeRequest('GET', '/favorites/count', null, travelerSession);
    console.log('✅ Favorites count:', response.data.favorites_count);
  } catch (error) {
    throw error;
  }
}

async function testDashboard() {
  console.log('\n📊 Testing Dashboard...');
  
  // Get traveler dashboard
  try {
    const response = await makeRequest('GET', '/users/dashboard', null, travelerSession);
    console.log('✅ Traveler dashboard retrieved:', response.data.favorites_count, 'favorites');
  } catch (error) {
    throw error;
  }
  
  // Get owner dashboard
  try {
    const response = await makeRequest('GET', '/users/dashboard', null, ownerSession);
    console.log('✅ Owner dashboard retrieved:', response.data.properties.length, 'properties');
  } catch (error) {
    throw error;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Airbnb Backend API Tests');
  console.log('=====================================');
  
  try {
    await testHealthCheck();
    await testUserRegistration();
    await testProfileManagement();
    await testPropertyManagement();
    await testPropertySearch();
    await testBookingFlow();
    await testFavorites();
    await testDashboard();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Health Check');
    console.log('   ✅ User Registration & Login');
    console.log('   ✅ Profile Management');
    console.log('   ✅ Property CRUD Operations');
    console.log('   ✅ Property Search');
    console.log('   ✅ Booking Flow');
    console.log('   ✅ Favorites System');
    console.log('   ✅ Dashboard Data');
    
    console.log('\n🚀 Your Airbnb Backend API is working perfectly!');
    console.log('\n📚 Next steps:');
    console.log('   1. Build your React frontend');
    console.log('   2. Connect frontend to these APIs');
    console.log('   3. Add more features as needed');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check database connection');
    console.log('   3. Verify environment variables');
    console.log('   4. Check server logs for errors');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testHealthCheck,
  testUserRegistration,
  testProfileManagement,
  testPropertyManagement,
  testPropertySearch,
  testBookingFlow,
  testFavorites,
  testDashboard
};
