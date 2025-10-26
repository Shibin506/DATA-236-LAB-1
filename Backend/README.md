# Airbnb Clone Backend API

A comprehensive backend API for an Airbnb clone application built with Node.js, Express, and MySQL.

## 🚀 Features

### Authentication & Authorization
- User registration and login
- Session-based authentication
- Role-based access control (Traveler/Owner)
- Password hashing with bcrypt

### Property Management
- Property CRUD operations
- Advanced property search with filters
- Property images and amenities
- Availability management

### Booking System
- Create and manage bookings
- Booking status management (pending, accepted, rejected, cancelled)
- Owner booking management
- Traveler booking history

### User Management
- Profile management
- Profile picture upload
- Password change functionality
- User preferences

### Favorites System
- Add/remove properties from favorites
- View favorite properties
- Favorite status checking

## 🏗️ Project Structure

```
src/
├── app.js                 # Express app configuration
├── server.js             # Server entry point
├── config/
│   └── database.js       # Database configuration
├── middleware/
│   ├── errorHandler.js   # Global error handler
│   ├── requireAuth.js    # Authentication middleware
│   └── validateRequest.js # Request validation middleware
├── routes/
│   ├── authRoutes.js     # Authentication routes
│   ├── propertyRoutes.js # Property management routes
│   ├── bookingRoutes.js  # Booking management routes
│   ├── userRoutes.js     # User management routes
│   └── favoriteRoutes.js # Favorites routes
└── utils/                # Utility functions
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd airbnb-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=airbnb_db
   DB_PORT=3306
   SESSION_SECRET=your_session_secret
   NODE_ENV=development
   ```

4. **Database Setup**
   - Create MySQL database: `airbnb_db`
   - The application will automatically create tables on startup

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

### Property Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/properties` | Get all properties | No |
| GET | `/api/properties/search` | Search properties | No |
| GET | `/api/properties/:id` | Get property by ID | No |
| POST | `/api/properties` | Create property | Owner |
| PUT | `/api/properties/:id` | Update property | Owner |
| DELETE | `/api/properties/:id` | Delete property | Owner |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/bookings` | Create booking | Traveler |
| GET | `/api/bookings/traveler/my-bookings` | Get traveler bookings | Traveler |
| GET | `/api/bookings/owner/my-bookings` | Get owner bookings | Owner |
| PUT | `/api/bookings/:id/accept` | Accept booking | Owner |
| PUT | `/api/bookings/:id/reject` | Reject booking | Owner |
| PUT | `/api/bookings/:id/cancel` | Cancel booking | Traveler |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/:id` | Get user profile | Yes |
| PUT | `/api/users/:id` | Update user profile | Yes |
| PUT | `/api/users/:id/change-password` | Change password | Yes |
| POST | `/api/users/:id/profile-picture` | Upload profile picture | Yes |

### Favorites Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/favorites` | Add to favorites | Traveler |
| GET | `/api/favorites/traveler/my-favorites` | Get user favorites | Traveler |
| DELETE | `/api/favorites/:id` | Remove from favorites | Traveler |
| GET | `/api/favorites/check/:property_id` | Check favorite status | Traveler |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | airbnb_db |
| `DB_PORT` | Database port | 3306 |
| `SESSION_SECRET` | Session secret key | - |
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3001 |

### Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `properties` - Property listings
- `bookings` - Booking records
- `favorites` - User favorite properties
- `property_images` - Property images
- `reviews` - Property reviews

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 API Examples

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "user_type": "traveler"
  }'
```

### Search Properties
```bash
curl -X GET "http://localhost:3001/api/properties/search?city=San%20Francisco&guests=2&min_price=100&max_price=300"
```

### Create Booking
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: airbnb.session=your_session_cookie" \
  -d '{
    "property_id": 1,
    "check_in_date": "2024-02-01",
    "check_out_date": "2024-02-05",
    "number_of_guests": 2,
    "special_requests": "Late check-in if possible"
  }'
```

## 🚀 Deployment

1. **Production Environment**
   ```bash
   NODE_ENV=production npm start
   ```

2. **Docker Deployment**
   ```bash
   docker build -t airbnb-backend .
   docker run -p 3001:3001 airbnb-backend
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@example.com or create an issue in the repository.