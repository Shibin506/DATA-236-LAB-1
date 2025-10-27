# 🐳 Docker Setup Guide - Backend API

This guide will help you run the entire Airbnb backend with Docker, including the database, without needing to install MySQL on your local machine.

---

## 📋 **Prerequisites**

- **Docker Desktop** installed on your machine
  - Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
  - macOS: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

- **Git** (to clone the repository)

---

## 🚀 **Quick Start**

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd Backend
```

### **2. Start Everything with Docker**
```bash
# This command will:
# - Build the Docker images
# - Start MySQL database
# - Start the backend API
docker-compose up
```

The first time you run this, it will:
- Download the MySQL and Node.js images
- Build the backend application
- Create the database
- Start all services

### **3. Verify Everything is Running**
```bash
# Check if containers are running
docker-compose ps

# You should see:
# - airbnb_mysql (database)
# - airbnb_backend (API server)
```

### **4. Test the API**
Open your browser and go to:
```
http://localhost:3001/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Airbnb Backend API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## 📊 **Populate Sample Data**

Once the server is running, open a **new terminal** and run:

```bash
# Connect to the backend container
docker-compose exec backend node add-sample-data.js

# Add property images
docker-compose exec backend node add-all-property-images.js

# Add reviews
docker-compose exec backend node add-property-reviews.js

# Add bookings
docker-compose exec backend node add-bookings-and-reviews.js
```

Or populate San Francisco data:
```bash
docker-compose exec backend node clean-and-populate-sf-data.js
```

---

## 🛠️ **Common Commands**

### **Start Services**
```bash
docker-compose up
```

### **Start in Background (Detached Mode)**
```bash
docker-compose up -d
```

### **Stop Services**
```bash
docker-compose down
```

### **Stop and Remove Volumes (Clean Database)**
```bash
docker-compose down -v
```

### **View Logs**
```bash
# All services
docker-compose logs -f

# Just the backend
docker-compose logs -f backend

# Just the database
docker-compose logs -f mysql
```

### **Restart Services**
```bash
docker-compose restart
```

### **Rebuild After Code Changes**
```bash
docker-compose up --build
```

---

## 🔧 **Configuration**

### **Environment Variables**
The Docker setup uses these default values (no need to change them):

```env
DB_HOST=mysql
DB_USER=airbnb_user
DB_PASSWORD=Lionel@2
DB_NAME=airbnb_db
DB_PORT=3306
PORT=3001
NODE_ENV=development
SESSION_SECRET=docker-session-secret-key
```

### **Change Database Password**
Edit `docker-compose.yml` and change these values:
```yaml
MYSQL_ROOT_PASSWORD: your_new_password
MYSQL_PASSWORD: your_new_password
```

Then update the backend environment variables accordingly.

---

## 🌐 **Access Points**

Once running:

- **Backend API**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **API Base**: `http://localhost:3001/api`
- **MySQL Database**: `localhost:3306`

### **Database Connection Details**
```env
Host: localhost
Port: 3306
Database: airbnb_db
Username: airbnb_user
Password: Lionel@2
```

You can connect with any MySQL client like:
- MySQL Workbench
- DBeaver
- TablePlus
- Command line: `mysql -h localhost -u airbnb_user -p airbnb_db`

---

## 🐛 **Troubleshooting**

### **Port Already in Use**
If you get an error about ports being in use:

**Option 1: Stop the conflicting service**
```bash
# Find what's using port 3001
# Windows:
netstat -ano | findstr :3001

# Mac/Linux:
lsof -i :3001
```

**Option 2: Change the ports in docker-compose.yml**
```yaml
ports:
  - "3002:3001"  # Use port 3002 instead
```

### **Database Connection Failed**
```bash
# Check if MySQL container is running
docker-compose ps

# Restart MySQL
docker-compose restart mysql

# Check MySQL logs
docker-compose logs mysql
```

### **Backend Won't Start**
```bash
# Check backend logs
docker-compose logs backend

# Rebuild the containers
docker-compose down
docker-compose up --build
```

### **Container Keeps Restarting**
```bash
# Check logs for errors
docker-compose logs -f backend

# Remove old containers
docker-compose down
docker system prune -a
```

### **Fresh Start (Nuclear Option)**
If nothing works, start completely fresh:
```bash
# Stop and remove everything
docker-compose down -v

# Remove all related images
docker rmi airbnb-backend-backend

# Start fresh
docker-compose up --build
```

---

## 📦 **Data Persistence**

### **Database Data**
Your database data is stored in a Docker volume `mysql_data`. It persists even when you stop containers.

To **reset the database**:
```bash
# Stop containers
docker-compose down -v

# This removes the volume and all data
# Start fresh
docker-compose up
```

### **Upload Files**
Upload files are stored in the `uploads/` directory, which is mounted as a volume. They persist between container restarts.

---

## 🧪 **Testing the API**

### **Using curl**
```bash
# Health check
curl http://localhost:3001/health

# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "user_type": "traveler"
  }'
```

### **Using Postman**
Import the `Airbnb_API_Collection.postman_collection.json` file and update the base URL to `http://localhost:3001`

### **Using Browser**
Just navigate to:
```
http://localhost:3001/health
```

---

## 🎯 **Frontend Integration**

Once everything is running:

1. **Backend is available at**: `http://localhost:3001`
2. **API endpoints are at**: `http://localhost:3001/api`
3. **Configure your frontend** to point to this URL
4. **CORS is enabled** for development

### **Example Frontend Configuration**
```javascript
// In your React app
const API_BASE_URL = 'http://localhost:3001/api';

// Example fetch
const response = await fetch(`${API_BASE_URL}/properties/search`);
```

---

## 📝 **Notes**

- **No MySQL Installation Needed**: Everything runs in Docker containers
- **Data Persists**: Your database and uploads persist between restarts
- **Isolated Environment**: Won't affect your local MySQL if you have one
- **Easy Reset**: Just run `docker-compose down -v` to start fresh
- **Production Ready**: Same setup can be deployed to production

---

## ✅ **Success Checklist**

- [ ] Docker Desktop is running
- [ ] Containers are up: `docker-compose ps`
- [ ] Health check works: `http://localhost:3001/health`
- [ ] Sample data is populated
- [ ] Can register/login via API
- [ ] Frontend can connect to backend

---

## 🆘 **Need Help?**

1. Check the logs: `docker-compose logs -f`
2. Verify containers are running: `docker-compose ps`
3. Try a fresh start: `docker-compose down -v && docker-compose up`
4. Check Docker Desktop is running
5. Ensure ports 3001 and 3306 are available

---

## 🎉 **You're All Set!**

Your backend is now running with Docker, and your frontend teammate can start integrating without any local database setup!

**Happy Coding! 🚀**
