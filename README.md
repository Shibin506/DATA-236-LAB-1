# DATA-236-LAB-1 — Full-Stack Airbnb Clone with Microservices

A production-ready full-stack application mimicking Airbnb with advanced features including real-time event processing, AI-powered concierge, and comprehensive property management.

## 🚀 Tech Stack

**Frontend:** React 18 + Vite, Axios, React Router, Bootstrap  
**Backend:** Node.js (Express), MongoDB Atlas, Kafka, Redis  
**Agent AI:** FastAPI with Tavily Search & LangChain  
**Infrastructure:** Docker, Docker Compose, Kubernetes-ready  
**Testing:** JMeter (500+ concurrent users tested)

## ✨ Key Features

- 🏠 **Property Management:** Full CRUD for listings with image uploads
- 📅 **Smart Booking System:** Real-time availability validation with conflict prevention
- ⭐ **Reviews & Ratings:** Property reviews with booking verification
- ❤️ **Favorites System:** Save and manage favorite properties
- 🤖 **AI Concierge:** Intelligent trip planning with live search integration
- 🔔 **Event-Driven Architecture:** Kafka-based real-time notifications
- 🔐 **Secure Authentication:** JWT + session-based auth with bcrypt
- 📊 **Performance Tested:** Handles 500+ concurrent users (97% success rate)

## Repository structure

```
.
├── Backend/        # Express API + MySQL
├── Frontend/       # React (Vite) SPA
└── AgentAI/        # FastAPI concierge microservice
```

## 🏗️ Architecture Overview

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        FE[React Frontend<br/>Port: 3000]
    end

    subgraph Backend["Backend Services"]
        API[Express API<br/>Port: 3001]
        AGENT[Agent AI Service<br/>Port: 8000]
    end

    subgraph DataLayer["Data & Messaging"]
        MONGO[(MongoDB Atlas)]
        REDIS[(Redis Cache)]
        KAFKA[Apache Kafka]
    end

    subgraph Workers["Background Workers"]
        OWNER[Owner Consumer]
        TRAVELER[Traveler Consumer]
    end

    subgraph External["External Services"]
        TAVILY[Tavily Search API]
    end

    FE -->|REST API| API
    FE -->|AI Queries| AGENT
    API -->|Read/Write| MONGO
    API -->|Cache| REDIS
    API -->|Publish Events| KAFKA
    KAFKA -->|Consume| OWNER
    KAFKA -->|Consume| TRAVELER
    OWNER -->|Notify| MONGO
    TRAVELER -->|Notify| MONGO
    AGENT -->|Live Search| TAVILY

    style FE fill:#61dafb
    style API fill:#68a063
    style AGENT fill:#009688
    style KAFKA fill:#231f20
    style MONGO fill:#4db33d
```

### 🔌 Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React development server |
| Backend API | 3001 | Express REST API |
| Agent AI | 8000 | FastAPI concierge service |
| MongoDB | 27017 | Database (Atlas cloud) |
| Redis | 6379 | Caching layer |
| Kafka | 9092 | Event streaming |
| Zookeeper | 2181 | Kafka coordination |

---

## 📋 Prerequisites

### Required
- **Node.js** 18+ and npm
- **Python** 3.10+ (recommended 3.11+)
- **Docker** and Docker Compose
- **MongoDB Atlas** account (free tier works)

### Optional
- **Tavily API Key** for live web search in Agent AI
- **JMeter** 5.6+ for performance testing
- **Kubernetes** for production deployment

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/Shibin506/DATA-236-LAB-1.git
cd DATA-236-LAB-1
```

### 2. Setup MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)
3. Whitelist your IP address in Atlas Network Access

### 3. Backend Environment Setup

Create `Backend/.env`:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/airbnb?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=development
PORT=3001

# Security
SESSION_SECRET=your-super-secret-session-key-change-this
JWT_SECRET=your-jwt-secret-key-change-this

# CORS
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Kafka (for Docker setup)
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=airbnb-backend

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### 4. Frontend Environment Setup

Create `Frontend/.env`:

```bash
VITE_API_BASE=http://localhost:3001/api
VITE_AGENT_API_BASE=http://localhost:8000/api/v1
VITE_MOCK=false
```

### 5. Agent AI Environment Setup

Create `AgentAI/.env`:

```bash
FRONTEND_URL=http://localhost:3000
TAVILY_API_KEY=your_tavily_api_key_here
# Get free key at: https://tavily.com/
```

---

## 🐳 Running with Docker (Recommended)

### Start All Services

```bash
cd Backend
docker-compose up -d
```

This starts:
- ✅ Backend API (port 3001)
- ✅ Kafka + Zookeeper
- ✅ Redis
- ✅ Owner Consumer (Kafka)
- ✅ Traveler Consumer (Kafka)

### Verify Services

```bash
# Check all containers
docker-compose ps

# Backend health check
curl http://localhost:3001/health

# View logs
docker-compose logs -f backend
docker-compose logs -f owner-consumer
docker-compose logs -f traveler-consumer
```

### Stop Services

```bash
docker-compose down
# Or keep data: docker-compose down --volumes
```

---

## 💻 Manual Setup (Without Docker)

### Backend

```bash
cd Backend
npm install
npm start
```

**API Endpoints** (prefix: `/api`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User login |
| `/auth/logout` | POST | User logout |
| `/users/profile` | GET/PUT | User profile management |
| `/users/avatar` | POST/DELETE | Profile picture upload |
| `/properties` | GET | Search properties with filters |
| `/properties/:id` | GET | Property details |
| `/properties` | POST | Create property (owner) |
| `/properties/:id/images` | POST | Upload property images |
| `/bookings` | POST | Create booking |
| `/bookings/check` | POST | Check availability |
| `/favorites` | GET/POST/DELETE | Manage favorites |

---

## Frontend (React + Vite)

Environment (`Frontend/.env`):

```
VITE_API_BASE=http://localhost:3001/api
VITE_AGENT_API_BASE=http://localhost:8000/api/v1
VITE_MOCK=false
```

Install and run:

```bash
cd Frontend
npm install
npm run dev
# open http://localhost:3000
```

Features
- Traveler: login/session, property search with availability, details page with client-side validation, favorites, profile with avatar
- Owner: property management (listings, delete, availability window)
- Agent AI: “Ask Agent AI” modal that calls the FastAPI concierge

Image handling
- Frontend builds absolute URLs to `Backend/uploads` for property and profile images

---

### Agent AI (FastAPI)

```bash
cd AgentAI
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
# Open http://localhost:8000/docs (Swagger UI)
```

**API Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/concierge-agent` | POST | Generate trip itinerary |
| `/api/v1/concierge-agent/diag` | GET | Service diagnostics |
| `/` | GET | Health check |

**AI Concierge Features:**
- 🗺️ Personalized itinerary generation
- 🎯 Local activities recommendations
- 🍽️ Restaurant suggestions with ratings
- 🎒 Smart packing list based on destination/weather
- 🔗 Live web search integration (via Tavily)
- 📍 Location inference from natural language

**Example Request:**

```json
{
  "location": "San Francisco",
  "check_in_date": "2025-12-01",
  "check_out_date": "2025-12-05",
  "travelers": 2,
  "preferences": "outdoor activities, local cuisine"
}
```

---

---

## 🧪 Testing

### Performance Testing with JMeter

The application has been tested with **500 concurrent users** achieving **97% success rate**.

```bash
cd JMeter

# Run single test
jmeter -n -t Airbnb_Performance_Test.jmx -l results/test.jtl

# Run all tests (100, 200, 300, 400, 500 users)
./run_all_tests.sh

# Generate HTML report
jmeter -g results/test.jtl -o results/report
```

**Test Results Summary:**
- ✅ **User Login:** 0% error rate, avg 11.5s
- ✅ **Property Details:** 0% error rate, avg 3.9s
- ✅ **Create Booking:** 0% error rate, avg 1.1s
- ⚠️ **Search Properties:** 11% timeout (network spikes under 500 load)

---

## 📊 Event-Driven Architecture

### Kafka Topics

| Topic | Purpose | Consumers |
|-------|---------|-----------|
| `booking-events` | Booking creations/updates | Owner Consumer |
| `owner-notifications` | Property-related events | Owner Consumer |
| `traveler-notifications` | User activity events | Traveler Consumer |

### Consumer Services

**Owner Consumer:**
- Listens for new bookings on owner's properties
- Sends real-time notifications
- Updates property analytics

**Traveler Consumer:**
- Processes booking confirmations
- Manages user activity tracking
- Handles favorite updates

**Start Consumers (with Docker):**

```bash
cd Backend
docker-compose up owner-consumer traveler-consumer -d

# View logs
docker-compose logs -f owner-consumer
docker-compose logs -f traveler-consumer
```

---

---

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```bash
# Check connection string in Backend/.env
# Ensure IP is whitelisted in MongoDB Atlas
# Verify network connectivity
curl -I https://cloud.mongodb.com
```

**2. Kafka Connection Error**
```bash
# Ensure Kafka and Zookeeper are running
docker-compose ps
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka zookeeper
```

**3. CORS Errors**
- Update `FRONTEND_URL` and `CORS_ORIGIN` in `Backend/.env`
- Clear browser cache and cookies
- Ensure frontend is running on correct port (3000)

**4. Images Not Loading**
- Check MongoDB for image URLs
- Verify images are uploaded to cloud storage (if configured)
- Check browser console for 404 errors

**5. Agent AI Not Responding**
```bash
# Check diagnostics endpoint
curl http://localhost:8000/api/v1/concierge-agent/diag

# Verify Tavily API key
echo $TAVILY_API_KEY

# Check Agent AI logs
cd AgentAI && uvicorn app:app --reload --log-level debug
```

**6. Consumer Services Not Processing Events**
```bash
# Check consumer logs
docker-compose logs owner-consumer | tail -50
docker-compose logs traveler-consumer | tail -50

# Verify Kafka topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Monitor consumer lag
docker-compose exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --describe --all-groups
```

**7. Port Already in Use**
```bash
# Find process using port
lsof -i :3001  # Backend
lsof -i :3000  # Frontend
lsof -i :8000  # Agent AI

# Kill process
kill -9 <PID>
```

---

---

## 🚢 Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Run in production mode
docker-compose up -d
```

### Kubernetes Deployment

```bash
cd deploy/k8s

# Deploy all services
./deploy.sh

# Or deploy individually
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-secrets.yaml
kubectl apply -f 02-configmaps.yaml
kubectl apply -f deployment-backend.yaml
kubectl apply -f deployment-frontend.yaml
kubectl apply -f deployment-agentai.yaml

# Check status
kubectl get pods -n airbnb

# Cleanup
./cleanup.sh
```

---

## 📁 Project Structure

```
DATA-236-LAB-1/
├── Backend/              # Express API
│   ├── src/
│   │   ├── config/      # DB, Kafka, Redis config
│   │   ├── controllers/ # Route handlers
│   │   ├── models/      # Data models
│   │   ├── routes/      # API routes
│   │   └── services/    # Business logic
│   ├── workers/         # Kafka consumers
│   ├── docker-compose.yml
│   └── Dockerfile
├── Frontend/            # React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── context/     # React context
│   └── Dockerfile
├── AgentAI/            # FastAPI service
│   ├── app.py          # Main application
│   ├── fallbacks/      # Fallback data
│   └── requirements.txt
├── JMeter/             # Performance tests
│   ├── Airbnb_Performance_Test.jmx
│   └── run_all_tests.sh
└── deploy/             # Kubernetes configs
    └── k8s/
```

---

## 🔒 Security Best Practices

- ✅ All passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with expiration
- ✅ Session-based authentication with secure cookies
- ✅ MongoDB connection uses Atlas with IP whitelisting
- ✅ Environment variables for all secrets
- ✅ CORS properly configured
- ✅ Input validation and sanitization
- ✅ Rate limiting on API endpoints
- ⚠️ Never commit `.env` files (already in `.gitignore`)

---

## 📊 Performance Metrics

- **Throughput:** 9.3 requests/second (500 concurrent users)
- **Response Time:** 
  - Login: 11.5s avg
  - Property Search: 3.9s avg
  - Booking: 1.1s avg
- **Success Rate:** 97.25% overall
- **Database:** MongoDB Atlas (M0 free tier)
- **Concurrent Users Tested:** Up to 500

---

## 🤝 Contributing

This is an educational project. Contributions welcome for:
- Bug fixes
- Performance improvements
- New features
- Documentation improvements
- Test coverage

---

## 📝 License

Educational use for lab/demo purposes. See course guidelines for academic integrity policies.

---

## 👥 Team

**Course:** DATA-236  
**Institution:** San Jose State University  
**Semester:** Fall 2025

---

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Apache Kafka Guide](https://kafka.apache.org/documentation/)
- [React + Vite Guide](https://vitejs.dev/guide/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [JMeter User Manual](https://jmeter.apache.org/usermanual/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

**⭐ If you found this project helpful, please give it a star!**
