# Curl Commands for Airbnb API Testing

## Base URL
```
http://localhost:3001/api
```

## Health Check
```bash
curl -X GET http://localhost:3001/health
```

---

## Authentication Endpoints

### 1. Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "user_type": "traveler",
    "phone": "+1234567890"
  }'
```

### 2. Register Owner
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "user_type": "owner",
    "phone": "+1234567891"
  }'
```

### 3. Login User
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 4. Check Session
```bash
curl -X GET http://localhost:3001/api/auth/session \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 5. Get Current User
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 6. Change Password
```bash
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

### 7. Logout
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

---

## User Management Endpoints

### 8. Get User Profile
```bash
curl -X GET http://localhost:3001/api/users/profile \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 9. Update User Profile
```bash
curl -X PUT http://localhost:3001/api/users/profile \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE" \
  -d '{
    "name": "John Smith",
    "phone": "+1234567890",
    "about_me": "Travel enthusiast and adventure seeker",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "languages": "English, Spanish, French",
    "gender": "male"
  }'
```

### 10. Upload Profile Picture
```bash
curl -X POST http://localhost:3001/api/users/upload-profile-picture \
  -H "Content-Type: multipart/form-data" \
  -b "airbnb.session=YOUR_SESSION_COOKIE" \
  -F "profile_picture=@/path/to/your/image.jpg"
```

### 11. Delete Profile Picture
```bash
curl -X DELETE http://localhost:3001/api/users/profile-picture \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 12. Get User Dashboard
```bash
curl -X GET http://localhost:3001/api/users/dashboard \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 13. Get User History
```bash
curl -X GET "http://localhost:3001/api/users/history?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

---

## Property Endpoints

### 14. Search Properties
```bash
curl -X GET "http://localhost:3001/api/properties/search?location=New York&guests=2&min_price=50&max_price=200&page=1&limit=10" \
  -H "Content-Type: application/json"
```

### 15. Search Properties with Advanced Filters
```bash
curl -X GET "http://localhost:3001/api/properties/search?city=San Francisco&state=CA&check_in_date=2024-02-01&check_out_date=2024-02-05&guests=2&property_type=apartment&min_bedrooms=1&amenities=WiFi,Kitchen&sort_by=price_low" \
  -H "Content-Type: application/json"
```

### 16. Get Property Details
```bash
curl -X GET http://localhost:3001/api/properties/1 \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 17. Create Property (Owner Only)
```bash
curl -X POST http://localhost:3001/api/properties \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE" \
  -d '{
    "name": "Beautiful Downtown Apartment",
    "description": "Spacious apartment in the heart of downtown with amazing city views",
    "property_type": "apartment",
    "address": "123 Main St, New York, NY 10001",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "price_per_night": 150.00,
    "bedrooms": 2,
    "bathrooms": 1,
    "max_guests": 4,
    "amenities": "WiFi, Kitchen, Parking, Pool, Gym",
    "house_rules": "No smoking, No pets, No parties",
    "availability_start": "2024-01-01",
    "availability_end": "2024-12-31"
  }'
```

### 18. Update Property (Owner Only)
```bash
curl -X PUT http://localhost:3001/api/properties/1 \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE" \
  -d '{
    "name": "Updated Beautiful Apartment",
    "price_per_night": 175.00,
    "amenities": "WiFi, Kitchen, Parking, Pool, Gym, Hot Tub"
  }'
```

### 19. Delete Property (Owner Only)
```bash
curl -X DELETE http://localhost:3001/api/properties/1 \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 20. Get Owner's Properties
```bash
curl -X GET "http://localhost:3001/api/properties/owner/my-properties?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 21. Upload Property Images (Owner Only)
```bash
curl -X POST http://localhost:3001/api/properties/1/upload-images \
  -H "Content-Type: multipart/form-data" \
  -b "airbnb.session=YOUR_SESSION_COOKIE" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg"
```

### 22. Delete Property Image (Owner Only)
```bash
curl -X DELETE http://localhost:3001/api/properties/1/images/1 \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

---

## Booking Endpoints

### 23. Create Booking (Traveler Only)
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE" \
  -d '{
    "property_id": 1,
    "check_in_date": "2024-02-01",
    "check_out_date": "2024-02-05",
    "number_of_guests": 2,
    "special_requests": "Late check-in if possible"
  }'
```

### 24. Get Traveler's Bookings
```bash
curl -X GET "http://localhost:3001/api/bookings/traveler/my-bookings?page=1&limit=10&status=pending" \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 25. Get Owner's Booking Requests
```bash
curl -X GET "http://localhost:3001/api/bookings/owner/incoming-requests?page=1&limit=10&status=pending" \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 26. Get Booking Details
```bash
curl -X GET http://localhost:3001/api/bookings/1 \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 27. Accept Booking (Owner Only)
```bash
curl -X PATCH http://localhost:3001/api/bookings/1/accept \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 28. Cancel Booking
```bash
curl -X PATCH http://localhost:3001/api/bookings/1/cancel \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE" \
  -d '{
    "reason": "Change of plans"
  }'
```

### 29. Get Booking Statistics (Owner Only)
```bash
curl -X GET http://localhost:3001/api/bookings/owner/statistics \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

---

## Favorites Endpoints

### 30. Get Favorite Properties (Traveler Only)
```bash
curl -X GET "http://localhost:3001/api/favorites?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 31. Add to Favorites (Traveler Only)
```bash
curl -X POST http://localhost:3001/api/favorites/1 \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 32. Remove from Favorites (Traveler Only)
```bash
curl -X DELETE http://localhost:3001/api/favorites/1 \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 33. Check Favorite Status (Traveler Only)
```bash
curl -X GET http://localhost:3001/api/favorites/check/1 \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 34. Get Favorites Count (Traveler Only)
```bash
curl -X GET http://localhost:3001/api/favorites/count \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

### 35. Clear All Favorites (Traveler Only)
```bash
curl -X DELETE http://localhost:3001/api/favorites/clear \
  -H "Content-Type: application/json" \
  -b "airbnb.session=YOUR_SESSION_COOKIE"
```

---

## Testing Workflow

### Step 1: Start the Server
```bash
npm start
# or
node server.js
```

### Step 2: Test Authentication Flow
1. Register a traveler user
2. Register an owner user
3. Login with traveler
4. Test protected endpoints
5. Logout

### Step 3: Test Property Management
1. Login as owner
2. Create a property
3. Upload property images
4. Search properties (as public user)
5. Get property details

### Step 4: Test Booking Flow
1. Login as traveler
2. Search and view properties
3. Create a booking
4. Login as owner
5. View incoming requests
6. Accept/cancel booking

### Step 5: Test Favorites
1. Login as traveler
2. Add properties to favorites
3. View favorites list
4. Remove from favorites

---

## Important Notes

1. **Session Management**: The API uses session-based authentication. You need to include the session cookie in requests after login.

2. **File Uploads**: For image uploads, use `multipart/form-data` content type and include the file path.

3. **User Types**: 
   - `traveler`: Can book properties, add favorites
   - `owner`: Can create/manage properties, handle bookings

4. **Error Handling**: All endpoints return JSON with `success` boolean and appropriate messages.

5. **Rate Limiting**: API has rate limiting (100 requests per 15 minutes per IP).

6. **CORS**: API supports CORS for frontend integration.

---

## Sample Test Data

### Traveler User
```json
{
  "name": "John Traveler",
  "email": "traveler@example.com",
  "password": "TravelerPass123!",
  "user_type": "traveler",
  "phone": "+1234567890"
}
```

### Owner User
```json
{
  "name": "Jane Owner",
  "email": "owner@example.com",
  "password": "OwnerPass123!",
  "user_type": "owner",
  "phone": "+1234567891"
}
```

### Sample Property
```json
{
  "name": "Cozy Downtown Loft",
  "description": "Modern loft in the heart of the city",
  "property_type": "apartment",
  "address": "456 City St, San Francisco, CA 94102",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "price_per_night": 200.00,
  "bedrooms": 1,
  "bathrooms": 1,
  "max_guests": 2,
  "amenities": "WiFi, Kitchen, Parking",
  "house_rules": "No smoking, No pets",
  "availability_start": "2024-01-01",
  "availability_end": "2024-12-31"
}
```

Use these curl commands in Postman by:
1. Copy the curl command
2. In Postman, click "Import" 
3. Select "Raw text" and paste the curl command
4. Postman will automatically parse the request
5. Update the session cookie as needed
