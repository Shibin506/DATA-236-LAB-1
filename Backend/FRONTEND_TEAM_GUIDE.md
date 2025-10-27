# 🚀 Airbnb Backend API - Frontend Team Guide

## 📋 **Complete Backend Implementation Summary**

This document provides a comprehensive overview of the Airbnb clone backend API that has been fully implemented and is ready for frontend integration.

---

## 🎯 **What's Been Built**

### **Complete Airbnb Clone Backend**
- **Technology Stack**: Node.js + Express.js + MySQL
- **Architecture**: Modular, service-oriented design
- **Security**: Production-ready with authentication, validation, and rate limiting
- **Features**: All core Airbnb functionality implemented

---

## 🏗️ **System Architecture**

### **Project Structure**
```
Backend/
├── src/                          # Main application code
│   ├── server.js                 # Server entry point
│   ├── app.js                    # Express app configuration
│   ├── config/
│   │   ├── database.js           # Database configuration
│   │   └── env.js               # Environment variables
│   ├── controllers/              # Business logic controllers
│   │   ├── authController.js     # Authentication logic
│   │   ├── propertyController.js # Property management
│   │   ├── bookingController.js  # Booking operations
│   │   └── favoriteController.js # Favorites management
│   ├── services/                 # Business logic services
│   │   ├── authService.js        # Authentication services
│   │   ├── propertyService.js    # Property services
│   │   ├── bookingService.js     # Booking services
│   │   └── favoriteService.js    # Favorites services
│   ├── middleware/               # Custom middleware
│   │   ├── requireAuth.js        # Authentication middleware
│   │   ├── validateRequest.js    # Request validation
│   │   └── errorHandler.js       # Error handling
│   └── routes/                   # API routes
│       ├── authRoutes.js         # Authentication endpoints
│       ├── propertyRoutes.js     # Property endpoints
│       ├── bookingRoutes.js      # Booking endpoints
│       ├── userRoutes.js         # User management
│       └── favoriteRoutes.js     # Favorites endpoints
├── config/                       # Configuration files
├── middleware/                   # Additional middleware
├── routes/                       # Alternative route structure
├── uploads/                      # File uploads directory
├── package.json                  # Dependencies and scripts
├── .env.example                  # Environment template
└── README.md                     # Setup instructions
```

---

## 🔐 **Authentication System**

### **User Types**
- **Traveler**: Can search, book, and favorite properties
- **Owner**: Can create, manage properties and handle bookings

### **Authentication Flow**
1. **Registration**: Users register with name, email, password, user_type
2. **Login**: Session-based authentication with secure cookies
3. **Authorization**: Role-based access control for different endpoints
4. **Session Management**: 24-hour session with automatic cleanup

### **Security Features**
- ✅ **Password Hashing**: bcryptjs with 12 salt rounds
- ✅ **Session Security**: HttpOnly cookies, secure session management
- ✅ **Input Validation**: Comprehensive validation for all inputs
- ✅ **Rate Limiting**: 100 requests per 15 minutes per IP
- ✅ **CORS Protection**: Configured for frontend integration
- ✅ **Security Headers**: Helmet.js protection

---

## 📚 **Complete API Endpoints**

### **Base URL**: `http://localhost:3001/api`

### **🔐 Authentication Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/auth/me` | Get current user | Yes |

### **🏠 Property Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/properties` | Get all properties | No |
| GET | `/properties/search` | Search properties with filters | No |
| GET | `/properties/:id` | Get property by ID | No |
| POST | `/properties` | Create property | Owner |
| PUT | `/properties/:id` | Update property | Owner |
| DELETE | `/properties/:id` | Delete property | Owner |
| GET | `/properties/owner/my-properties` | Get owner's properties | Owner |

### **📅 Booking Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings` | Create booking | Traveler |
| GET | `/bookings/traveler/my-bookings` | Get traveler bookings | Traveler |
| GET | `/bookings/owner/my-bookings` | Get owner bookings | Owner |
| GET | `/bookings/owner/incoming-requests` | Get pending requests | Owner |
| PATCH | `/bookings/:id/accept` | Accept booking | Owner |
| PATCH | `/bookings/:id/reject` | Reject booking | Owner |
| PATCH | `/bookings/:id/cancel` | Cancel booking | Traveler |

### **👤 User Management Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update user profile | Yes |
| PUT | `/users/change-password` | Change password | Yes |
| POST | `/users/profile-picture` | Upload profile picture | Yes |
| GET | `/users/dashboard` | Get user dashboard | Yes |

### **❤️ Favorites Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/favorites/:property_id` | Add to favorites | Traveler |
| GET | `/favorites` | Get user favorites | Traveler |
| DELETE | `/favorites/:property_id` | Remove from favorites | Traveler |
| GET | `/favorites/check/:property_id` | Check favorite status | Traveler |
| GET | `/favorites/count` | Get favorites count | Traveler |

---

## 🗄️ **Database Schema**

### **Core Tables**
- **`users`**: User accounts (travelers and owners)
- **`properties`**: Property listings with full details
- **`bookings`**: Booking records with status management
- **`favorites`**: User favorite properties
- **`property_images`**: Property image management
- **`reviews`**: Property reviews and ratings

### **Key Features**
- ✅ **Foreign Key Relationships**: Proper database relationships
- ✅ **Auto-increment IDs**: Unique identifiers for all records
- ✅ **Timestamps**: Created/updated timestamps on all tables
- ✅ **Data Validation**: Database-level constraints
- ✅ **Indexing**: Optimized for search performance

---

## 🚀 **Quick Setup Guide**

### **Option 1: Docker Setup (Recommended) ⭐**

**No MySQL installation required!**

#### **1. Prerequisites**
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Git

#### **2. Installation**
```bash
# Clone the repository
git clone <repository-url>
cd Backend

# Start everything with Docker (database + backend)
docker-compose up
```

That's it! Docker will handle everything automatically.

#### **3. Populate Sample Data**
In a new terminal window:
```bash
# Add sample data
docker-compose exec backend node add-sample-data.js
docker-compose exec backend node add-all-property-images.js
docker-compose exec backend node add-property-reviews.js
docker-compose exec backend node add-bookings-and-reviews.js
```

#### **4. Verify**
Open: `http://localhost:3001/health`

📖 **See `DOCKER_SETUP.md` for detailed Docker instructions**

---

### **Option 2: Manual Setup (If You Have MySQL)**

#### **1. Prerequisites**
- Node.js (v16 or higher)
- MySQL database
- Git

#### **2. Installation**
```bash
# Clone the repository
git clone <repository-url>
cd Backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials
```

#### **3. Environment Configuration**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=airbnb_db
DB_PORT=3306
SESSION_SECRET=your_session_secret
NODE_ENV=development
PORT=3001
```

#### **4. Database Setup**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE airbnb_db;

# The application will auto-create tables on startup
```

#### **5. Start the Server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

#### **6. Populate Sample Data**
```bash
# Add sample users and properties
node add-sample-data.js

# Add property images
node add-all-property-images.js

# Add reviews and bookings
node add-property-reviews.js
node add-bookings-and-reviews.js
```

---

## 📊 **Sample Data Available**

### **Pre-loaded Content**
- ✅ **50+ Properties**: Realistic San Francisco properties
- ✅ **Sample Users**: Travelers and owners for testing
- ✅ **Property Images**: High-quality property photos
- ✅ **Reviews**: Sample property reviews
- ✅ **Bookings**: Sample booking history
- ✅ **Favorites**: Sample favorite properties

### **Test Users**
- **Traveler**: `traveler@example.com` / `password123`
- **Owner**: `owner@example.com` / `password123`

---

## 🔧 **Frontend Integration**

### **API Response Format**
All API responses follow a consistent format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### **Error Handling**
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    // Detailed error information
  }
}
```

### **Authentication**
- Use session-based authentication
- Include cookies in requests for authenticated endpoints
- Check session status with `/auth/me` endpoint

### **File Uploads**
- Profile pictures: `POST /users/profile-picture`
- Property images: `POST /properties/:id/images`
- Supported formats: JPG, PNG, WebP
- Max file size: 5MB

---

## 🧪 **Testing the API**

### **Health Check**
```bash
curl http://localhost:3001/health
```

### **Test Authentication**
```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "user_type": "traveler"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### **Test Property Search**
```bash
curl "http://localhost:3001/api/properties/search?city=San%20Francisco&guests=2&min_price=100&max_price=300"
```

---

## 📱 **Frontend Development Tips**

### **State Management**
- Store user session in context/state
- Cache property data for better performance
- Implement optimistic updates for favorites

### **UI Components Needed**
- **Authentication**: Login/Register forms
- **Property Search**: Filters, map integration
- **Property Cards**: Image gallery, pricing, amenities
- **Booking Flow**: Date picker, guest selector
- **User Dashboard**: Profile, bookings, favorites
- **Owner Dashboard**: Property management, booking requests

### **Key Features to Implement**
1. **Property Search & Filtering**
2. **User Authentication Flow**
3. **Property Detail Pages**
4. **Booking Management**
5. **Favorites System**
6. **User Profiles**
7. **Owner Dashboard**

---

## 🎯 **What's Ready for Frontend**

### **✅ Fully Implemented**
- Complete authentication system
- Property CRUD operations
- Advanced search and filtering
- Booking workflow (pending → accepted/rejected)
- Favorites management
- User profile management
- File upload system
- Error handling and validation
- Rate limiting and security

### **✅ Production Ready**
- Comprehensive error handling
- Input validation and sanitization
- Security headers and CORS
- Database optimization
- Session management
- File upload security

### **✅ Well Documented**
- Complete API documentation
- Setup instructions
- Sample data and test users
- Architecture documentation
- Code comments and structure

---

## 🆘 **Support & Resources**

### **Documentation Files**
- `README.md` - Main setup guide
- `API_DOCUMENTATION.md` - Complete API reference
- `ARCHITECTURE.md` - System architecture details
- `Airbnb_API_Collection.postman_collection.json` - Postman collection

### **Getting Help**
1. Check the API documentation first
2. Use the Postman collection for testing
3. Review the sample data structure
4. Check server logs for debugging

---

## 🎉 **Ready to Build!**

The backend is **100% complete** and ready for frontend integration. All core Airbnb functionality has been implemented with production-ready security, validation, and error handling.

**Next Steps:**
1. Set up the backend using this guide
2. Test the API endpoints
3. Start building your React frontend
4. Integrate with the provided APIs

**Happy coding! 🚀**
