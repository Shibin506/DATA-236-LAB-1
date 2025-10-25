# Airbnb Backend API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
The API uses session-based authentication. Users must register/login to access protected endpoints.

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user (traveler or owner).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "user_type": "traveler", // "traveler" or "owner"
  "phone": "+1234567890" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "user_type": "traveler",
      "phone": "+1234567890",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Login User
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "user_type": "traveler",
      "is_verified": false,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Logout User
**POST** `/auth/logout`

Logout the current user.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get Current User
**GET** `/auth/me`

Get current user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "about_me": "Travel enthusiast",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "languages": "English, Spanish",
      "gender": "male",
      "profile_picture": "/uploads/profiles/profile-1-1234567890.jpg",
      "user_type": "traveler",
      "is_verified": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## User Management Endpoints

### Get User Profile
**GET** `/users/profile`

Get current user's profile information.

### Update User Profile
**PUT** `/users/profile`

Update user profile information.

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "about_me": "Updated bio",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "languages": "English, Spanish, French",
  "gender": "male"
}
```

### Upload Profile Picture
**POST** `/users/upload-profile-picture`

Upload a profile picture.

**Request:** Multipart form data with `profile_picture` file

**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profile_picture": "/uploads/profiles/profile-1-1234567890.jpg"
  }
}
```

### Get User Dashboard
**GET** `/users/dashboard`

Get dashboard data based on user type.

**For Travelers:**
```json
{
  "success": true,
  "data": {
    "recent_bookings": [...],
    "favorites_count": 5,
    "user_type": "traveler"
  }
}
```

**For Owners:**
```json
{
  "success": true,
  "data": {
    "properties": [...],
    "recent_requests": [...],
    "total_earnings": 2500.00,
    "user_type": "owner"
  }
}
```

---

## Property Endpoints

### Search Properties
**GET** `/properties/search`

Search properties with various filters.

**Query Parameters:**
- `location` - General location search
- `city` - Specific city
- `state` - State abbreviation
- `country` - Country name
- `check_in_date` - Check-in date (YYYY-MM-DD)
- `check_out_date` - Check-out date (YYYY-MM-DD)
- `guests` - Number of guests
- `min_price` - Minimum price per night
- `max_price` - Maximum price per night
- `property_type` - Property type filter
- `min_bedrooms` - Minimum bedrooms
- `amenities` - Comma-separated amenities
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort_by` - Sort option (price_low, price_high, newest, oldest, rating)

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": 1,
        "name": "Beautiful Apartment",
        "description": "Spacious apartment in downtown",
        "property_type": "apartment",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "price_per_night": 150.00,
        "bedrooms": 2,
        "bathrooms": 1,
        "max_guests": 4,
        "amenities": "WiFi, Kitchen, Parking",
        "main_image": "/uploads/properties/property-1-1234567890.jpg",
        "average_rating": 4.5,
        "review_count": 25,
        "owner_name": "Jane Smith"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10
    }
  }
}
```

### Get Property Details
**GET** `/properties/:id`

Get detailed information about a specific property.

**Response:**
```json
{
  "success": true,
  "data": {
    "property": {
      "id": 1,
      "name": "Beautiful Apartment",
      "description": "Detailed description...",
      "property_type": "apartment",
      "address": "123 Main St, New York, NY 10001",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "price_per_night": 150.00,
      "bedrooms": 2,
      "bathrooms": 1,
      "max_guests": 4,
      "amenities": "WiFi, Kitchen, Parking, Pool",
      "house_rules": "No smoking, No pets",
      "is_active": true,
      "owner_id": 2,
      "owner_name": "Jane Smith",
      "owner_email": "jane@example.com",
      "owner_phone": "+1234567890",
      "average_rating": 4.5,
      "review_count": 25,
      "images": [
        {
          "id": 1,
          "image_url": "/uploads/properties/property-1-1234567890.jpg",
          "image_type": "main",
          "display_order": 1
        }
      ],
      "reviews": [
        {
          "id": 1,
          "rating": 5,
          "review_text": "Great place to stay!",
          "reviewer_name": "John Doe",
          "created_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "is_favorited": false
    }
  }
}
```

### Create Property (Owner Only)
**POST** `/properties`

Create a new property listing.

**Request Body:**
```json
{
  "name": "Beautiful Apartment",
  "description": "Spacious apartment in downtown area",
  "property_type": "apartment",
  "address": "123 Main St, New York, NY 10001",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "price_per_night": 150.00,
  "bedrooms": 2,
  "bathrooms": 1,
  "max_guests": 4,
  "amenities": "WiFi, Kitchen, Parking, Pool",
  "house_rules": "No smoking, No pets",
  "availability_start": "2024-01-01",
  "availability_end": "2024-12-31"
}
```

### Update Property (Owner Only)
**PUT** `/properties/:id`

Update property information.

### Delete Property (Owner Only)
**DELETE** `/properties/:id`

Delete a property listing.

### Get Owner's Properties
**GET** `/properties/owner/my-properties`

Get all properties owned by the current user.

### Upload Property Images (Owner Only)
**POST** `/properties/:id/upload-images`

Upload multiple images for a property.

**Request:** Multipart form data with `images` files (max 10 files)

---

## Booking Endpoints

### Create Booking (Traveler Only)
**POST** `/bookings`

Create a new booking request.

**Request Body:**
```json
{
  "property_id": 1,
  "check_in_date": "2024-02-01",
  "check_out_date": "2024-02-05",
  "number_of_guests": 2,
  "special_requests": "Late check-in if possible"
}
```

### Get Traveler's Bookings
**GET** `/bookings/traveler/my-bookings`

Get all bookings for the current traveler.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status (pending, accepted, cancelled, completed)

### Get Owner's Booking Requests
**GET** `/bookings/owner/incoming-requests`

Get all booking requests for owner's properties.

### Get Booking Details
**GET** `/bookings/:id`

Get detailed information about a specific booking.

### Accept Booking (Owner Only)
**PATCH** `/bookings/:id/accept`

Accept a pending booking request.

### Cancel Booking
**PATCH** `/bookings/:id/cancel`

Cancel a booking (can be done by owner or traveler).

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

### Get Booking Statistics (Owner Only)
**GET** `/bookings/owner/statistics`

Get booking statistics for the owner.

---

## Favorites Endpoints

### Get Favorite Properties (Traveler Only)
**GET** `/favorites`

Get all favorite properties for the current traveler.

### Add to Favorites (Traveler Only)
**POST** `/favorites/:propertyId`

Add a property to favorites.

### Remove from Favorites (Traveler Only)
**DELETE** `/favorites/:propertyId`

Remove a property from favorites.

### Check Favorite Status (Traveler Only)
**GET** `/favorites/check/:propertyId`

Check if a property is in favorites.

### Get Favorites Count (Traveler Only)
**GET** `/favorites/count`

Get the total number of favorite properties.

### Clear All Favorites (Traveler Only)
**DELETE** `/favorites/clear`

Remove all properties from favorites.

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Specific validation error"
    }
  ]
}
```

## Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address
- Returns 429 status code when limit exceeded

## File Upload Limits

- Profile pictures: 5MB max
- Property images: 10MB max per file, 10 files max
- Allowed formats: JPG, PNG, GIF, WebP
