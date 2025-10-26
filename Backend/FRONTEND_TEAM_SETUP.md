# 🚀 Frontend Team - Backend Setup Guide

## What You Need

Just 2 things:
1. **Docker Desktop** installed on your computer
2. **Git** to clone the repository

## Quick Setup (5 Minutes)

### Step 1: Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop
- Install it and make sure it's running

### Step 2: Clone the Repository
```bash
git clone <repository-url>
cd DATA-236-LAB-1/Backend
```

### Step 3: Start Everything
```bash
docker-compose up
```

**That's it!** The backend and database will start automatically.

### Step 4: Add Sample Data (Important!)
**This is required to have data for frontend testing!**

Open a **new terminal window** and run:
```bash
cd Backend

# Add comprehensive sample data
docker-compose exec backend node add-sample-data.js
docker-compose exec backend node add-all-property-images.js
docker-compose exec backend node add-property-reviews.js
docker-compose exec backend node add-bookings-and-reviews.js
```

**OR** use San Francisco data (recommended):
```bash
docker-compose exec backend node clean-and-populate-sf-data.js
```

This will populate your database with:
- ✅ 50+ San Francisco properties
- ✅ Property images
- ✅ Sample users (travelers and owners)
- ✅ Reviews and ratings
- ✅ Booking history
- ✅ All the data needed for frontend testing

## Access Points

Once running, use these URLs:

- **Backend API**: `http://localhost:3001`
- **API Health Check**: `http://localhost:3001/health`
- **API Base URL**: `http://localhost:3001/api`
- **Database Admin (Adminer)**: `http://localhost:8080`
- **MySQL Database**: `localhost:3306`

## Database Access (If Needed)

### Through Adminer (Web Interface):
1. Go to: `http://localhost:8080`
2. **Server**: `mysql`
3. **Username**: `airbnb_user`
4. **Password**: `Lionel@2`
5. **Database**: `airbnb_db`

### Through MySQL Client:
- **Host**: `localhost`
- **Port**: `3306`
- **Database**: `airbnb_db`
- **Username**: `airbnb_user`
- **Password**: `Lionel@2`

## API Endpoints for Frontend

### Base URL
```
http://localhost:3001/api
```

### Key Endpoints

**Authentication:**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

**Properties:**
- `GET /api/properties` - Get all properties
- `GET /api/properties/search` - Search properties
- `GET /api/properties/:id` - Get property details

**Bookings:**
- `POST /api/bookings` - Create booking
- `GET /api/bookings/traveler/my-bookings` - Get my bookings

**Favorites:**
- `POST /api/favorites/:property_id` - Add to favorites
- `GET /api/favorites` - Get my favorites

📖 **For complete API documentation, see `API_DOCUMENTATION.md`**

## Common Commands

### Start the backend:
```bash
docker-compose up
```

### Start in background:
```bash
docker-compose up -d
```

### Stop the backend:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Restart everything:
```bash
docker-compose restart
```

## Troubleshooting

### Port 3001 already in use?
Stop the conflicting service or change the port in `docker-compose.yml`

### Port 3306 already in use?
You probably have MySQL installed locally. Stop the local MySQL service or change the Docker port to `13306:3306`

### Need help?
Check the `DOCKER_SETUP.md` file for detailed troubleshooting

## What's Already Set Up

✅ Complete backend API with all endpoints
✅ MySQL database automatically configured
✅ Sample data scripts ready to populate database
✅ **Database starts empty** - you need to run sample data scripts!
✅ No local MySQL installation needed
✅ Everything runs in Docker containers

## ⚠️ Important: Database Starts Empty!

The Docker database starts **completely empty**. To have data for frontend testing, you **MUST** run the sample data scripts (Step 4 above).

**Without running these scripts, you'll have an empty database with no properties, users, or data to test with!**

## Next Steps

1. Start the backend using Docker
2. Test the API: Visit `http://localhost:3001/health`
3. Import sample data (optional)
4. Build your React frontend
5. Connect your frontend to `http://localhost:3001/api`

---

**Need More Details?**

- Complete setup: See `DOCKER_SETUP.md`
- API documentation: See `API_DOCUMENTATION.md`
- Complete guide: See `FRONTEND_TEAM_GUIDE.md`
- Postman collection: Import `Airbnb_API_Collection.postman_collection.json`
