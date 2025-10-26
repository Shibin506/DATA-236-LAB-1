# 🧪 Complete API Testing Guide for Postman

## 🚀 **Server Status Check**
First, ensure your server is running:
```bash
cd "C:\Users\shibi\OneDrive\Documents\AIRBNB LAB 1"
node server.js
```

## 📋 **API Endpoints Testing Checklist**

### **1. Health Check**
```bash
GET http://localhost:3001/health
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-24T22:04:49.000Z"
}
```

---

## 🔐 **Authentication APIs**

### **2. User Registration**
```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "name": "Test Traveler",
  "email": "test@example.com",
  "password": "password123",
  "user_type": "traveler"
}
```

### **3. User Login**
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### **4. Get Current User (with session)**
```bash
GET http://localhost:3001/api/auth/me
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

### **5. Logout**
```bash
POST http://localhost:3001/api/auth/logout
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

---

## 🏠 **Property APIs**

### **6. Get All Properties**
```bash
GET http://localhost:3001/api/properties
```

### **7. Search Properties**
```bash
GET http://localhost:3001/api/properties/search?city=San%20Francisco&guests=2&min_price=100&max_price=300
```

### **8. Get Property by ID**
```bash
GET http://localhost:3001/api/properties/22
```

### **9. Create Property (Owner only)**
```bash
POST http://localhost:3001/api/properties
Content-Type: application/json
Cookie: airbnb.session=YOUR_SESSION_COOKIE

{
  "name": "Test Property",
  "description": "A beautiful test property",
  "property_type": "apartment",
  "address": "123 Test Street, San Francisco, CA",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "price_per_night": 150.00,
  "bedrooms": 2,
  "bathrooms": 1,
  "max_guests": 4,
  "amenities": "WiFi,Kitchen,TV"
}
```

---

## 📅 **Booking APIs**

### **10. Create Booking (Traveler only)**
```bash
POST http://localhost:3001/api/bookings
Content-Type: application/json
Cookie: airbnb.session=YOUR_SESSION_COOKIE

{
  "property_id": 22,
  "check_in_date": "2024-12-01",
  "check_out_date": "2024-12-05",
  "number_of_guests": 2,
  "special_requests": "Late check-in please"
}
```

### **11. Get Traveler Bookings**
```bash
GET http://localhost:3001/api/bookings/traveler/my-bookings
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

### **12. Get Owner Bookings**
```bash
GET http://localhost:3001/api/bookings/owner/my-bookings
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

### **13. Accept Booking (Owner only)**
```bash
PUT http://localhost:3001/api/bookings/1/accept
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

### **14. Reject Booking (Owner only)**
```bash
PUT http://localhost:3001/api/bookings/1/reject
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

### **15. Cancel Booking (Traveler only)**
```bash
PUT http://localhost:3001/api/bookings/1/cancel
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

---

## ❤️ **Favorites APIs**

### **16. Add to Favorites (Traveler only)**
```bash
POST http://localhost:3001/api/favorites
Content-Type: application/json
Cookie: airbnb.session=YOUR_SESSION_COOKIE

{
  "property_id": 22
}
```

### **17. Get User Favorites**
```bash
GET http://localhost:3001/api/favorites/traveler/my-favorites
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

### **18. Remove from Favorites**
```bash
DELETE http://localhost:3001/api/favorites/1
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

### **19. Check Favorite Status**
```bash
GET http://localhost:3001/api/favorites/check/22
Cookie: airbnb.session=YOUR_SESSION_COOKIE
```

---

## 👤 **User Management APIs**

### **20. Update User Profile**
```bash
PUT http://localhost:3001/api/auth/1/profile
Content-Type: application/json
Cookie: airbnb.session=YOUR_SESSION_COOKIE

{
  "name": "Updated Name",
  "phone": "+1234567890",
  "about_me": "Updated bio",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA"
}
```

### **21. Change Password**
```bash
PUT http://localhost:3001/api/auth/1/change-password
Content-Type: application/json
Cookie: airbnb.session=YOUR_SESSION_COOKIE

{
  "current_password": "password123",
  "new_password": "newpassword123"
}
```

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Complete User Journey**
1. **Register** as a traveler
2. **Login** and save session cookie
3. **Search properties** in San Francisco
4. **View property details** by ID
5. **Add property to favorites**
6. **Create a booking**
7. **View your bookings**
8. **Logout**

### **Scenario 2: Owner Journey**
1. **Register** as an owner
2. **Login** and save session cookie
3. **Create a new property**
4. **View your properties**
5. **View booking requests**
6. **Accept/Reject bookings**

### **Scenario 3: Property Search Testing**
1. **Search by city**: `?city=San%20Francisco`
2. **Search by price range**: `?min_price=100&max_price=300`
3. **Search by guests**: `?guests=2`
4. **Search by property type**: `?property_type=apartment`
5. **Combined search**: `?city=San%20Francisco&guests=2&min_price=100&max_price=300&property_type=apartment`

---

## 📊 **Expected Response Formats**

### **Property Response (with images and reviews)**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": 22,
        "name": "Modern Mission Loft with City Views",
        "description": "Stunning loft in the heart of Mission District...",
        "property_type": "loft",
        "address": "2847 Mission Street, San Francisco, CA 94110",
        "city": "San Francisco",
        "state": "CA",
        "country": "USA",
        "price_per_night": "185.00",
        "bedrooms": 2,
        "bathrooms": 1,
        "max_guests": 4,
        "amenities": "WiFi,Kitchen,Washer,Dryer,Air Conditioning,Heating,TV,Workspace",
        "created_at": "2025-10-24T22:04:48.000Z",
        "owner_name": "Sarah Chen",
        "images": [
          {
            "image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
            "image_type": "main",
            "display_order": 1
          }
        ],
        "reviews": [
          {
            "rating": 5,
            "review_text": "Absolutely stunning loft with incredible city views!...",
            "reviewer_name": "Test Traveler",
            "created_at": "2025-10-24T22:04:49.000Z"
          }
        ]
      }
    ]
  }
}
```

### **Booking Response**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": 1,
      "property_id": 22,
      "traveler_id": 1,
      "check_in_date": "2024-12-01",
      "check_out_date": "2024-12-05",
      "number_of_guests": 2,
      "total_price": "740.00",
      "status": "pending",
      "special_requests": "Late check-in please",
      "created_at": "2025-10-24T22:04:49.000Z"
    }
  }
}
```

---

## 🔍 **Error Testing**

### **Test Authentication Errors**
1. **Access protected endpoint without login**: Should return 401
2. **Access owner endpoint as traveler**: Should return 403
3. **Access traveler endpoint as owner**: Should return 403

### **Test Validation Errors**
1. **Register with invalid email**: Should return 400
2. **Create booking with invalid dates**: Should return 400
3. **Create property with missing required fields**: Should return 400

### **Test Not Found Errors**
1. **Get non-existent property**: Should return 404
2. **Get non-existent booking**: Should return 404
3. **Access non-existent user**: Should return 404

---

## 📝 **Postman Collection Setup**

### **Environment Variables**
Create a Postman environment with:
- `base_url`: `http://localhost:3001`
- `session_cookie`: (will be set after login)

### **Pre-request Scripts**
For authenticated endpoints, add this to Pre-request Scripts:
```javascript
pm.request.headers.add({
    key: 'Cookie',
    value: 'airbnb.session=' + pm.environment.get('session_cookie')
});
```

### **Test Scripts**
Add this to Tests tab for login endpoint:
```javascript
if (pm.response.code === 200) {
    const cookies = pm.response.headers.get('Set-Cookie');
    if (cookies) {
        const sessionMatch = cookies.match(/airbnb\.session=([^;]+)/);
        if (sessionMatch) {
            pm.environment.set('session_cookie', sessionMatch[1]);
        }
    }
}
```

---

## ✅ **Success Criteria**

### **All APIs should return:**
- ✅ **200** for successful GET requests
- ✅ **201** for successful POST requests
- ✅ **200** for successful PUT requests
- ✅ **204** for successful DELETE requests
- ✅ **401** for unauthenticated requests
- ✅ **403** for unauthorized role access
- ✅ **404** for non-existent resources
- ✅ **400** for validation errors

### **Database should contain:**
- ✅ **32 properties** (all San Francisco)
- ✅ **100 property images** (2-5 per property)
- ✅ **52 completed bookings**
- ✅ **52 property reviews**
- ✅ **5 property owners**
- ✅ **2 sample travelers**

**Your Airbnb backend is now fully populated and ready for comprehensive testing!** 🚀✨
