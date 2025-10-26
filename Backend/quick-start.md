# Quick Start Guide - Airbnb Backend API

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### 2. Installation

```bash
# Clone or download the project
cd airbnb-backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env file with your database credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=airbnb_db
```

### 3. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE airbnb_db;
exit
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Or production mode
npm start
```

### 5. Test the API

```bash
# Run the test script
node test-api.js
```

### 6. Verify Installation

Visit: http://localhost:3001/health

You should see:
```json
{
  "status": "OK",
  "message": "Airbnb Backend API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## 🎯 Key Features Implemented

### ✅ Authentication System
- User registration (traveler/owner)
- Secure login with bcrypt
- Session management
- Password change functionality

### ✅ User Management
- Profile management
- Image upload for profiles
- Dashboard for both user types
- Booking history

### ✅ Property Management
- Create, read, update, delete properties
- Advanced search with filters
- Image upload for properties
- Owner property management

### ✅ Booking System
- Complete booking workflow
- Date conflict checking
- Owner approval system
- Booking statistics

### ✅ Favorites System
- Add/remove favorites
- Favorites management
- Count tracking

### ✅ Security Features
- Input validation
- Rate limiting
- CORS protection
- Secure file uploads

## 📋 API Endpoints Quick Reference

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties/search` - Search properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (owner)
- `PUT /api/properties/:id` - Update property (owner)

### Bookings
- `POST /api/bookings` - Create booking (traveler)
- `GET /api/bookings/traveler/my-bookings` - Get traveler bookings
- `PATCH /api/bookings/:id/accept` - Accept booking (owner)

### Favorites
- `GET /api/favorites` - Get favorites (traveler)
- `POST /api/favorites/:propertyId` - Add to favorites
- `DELETE /api/favorites/:propertyId` - Remove from favorites

## 🔧 Common Issues & Solutions

### Database Connection Error
```bash
# Check if MySQL is running
sudo service mysql start

# Verify database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env file
PORT=3002
```

### Missing Dependencies
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Frontend Development**: Build React frontend to consume these APIs
2. **Testing**: Add unit tests and integration tests
3. **Deployment**: Deploy to cloud platforms (AWS, Heroku, etc.)
4. **Monitoring**: Add logging and monitoring tools
5. **Features**: Add reviews, messaging, payments, etc.

## 📖 Documentation

- [Full API Documentation](API_DOCUMENTATION.md)
- [README](README.md)
- [Test Script](test-api.js)

## 🆘 Need Help?

1. Check the console logs for error messages
2. Verify your database connection
3. Ensure all environment variables are set
4. Run the test script to verify functionality
5. Check the API documentation for endpoint details

---

**🎉 Congratulations! Your Airbnb Backend API is ready for frontend integration!**
