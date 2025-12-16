# 🏠 HostIQ — Enterprise Property Rental Platform

<div align="center">

![HostIQ Banner](https://img.shields.io/badge/HostIQ-Property_Rental_Platform-FF385C?style=for-the-badge&logo=airbnb&logoColor=white)

**A production-ready, full-stack property rental platform with microservices architecture, real-time event processing, and AI-powered trip planning**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Kafka](https://img.shields.io/badge/Apache-Kafka-231F20?style=flat&logo=apache-kafka&logoColor=white)](https://kafka.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?style=flat&logo=kubernetes&logoColor=white)](https://kubernetes.io/)

[Features](#-key-features) • [Architecture](#-system-architecture) • [Quick Start](#-quick-start) • [API](#-api-documentation) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Frontend Features](#-frontend-features)
- [Backend Services](#-backend-services)
- [Event-Driven Architecture](#-event-driven-architecture)
- [AI Concierge](#-ai-concierge-service)
- [Performance Testing](#-performance-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)

---

## 🌟 Overview

**HostIQ** is an enterprise-grade property rental platform built with modern microservices architecture. It provides a complete solution for property owners and travelers, featuring real-time booking management, AI-powered trip planning, and event-driven notifications.

### Why HostIQ?

- 🏗️ **Microservices Architecture** — Scalable, maintainable, and cloud-native
- ⚡ **Real-time Processing** — Apache Kafka for event streaming and async communication
- 🤖 **AI Integration** — Intelligent trip planning with live web search
- 🔒 **Enterprise Security** — JWT + session authentication, RBAC, rate limiting
- 📊 **Load Tested** — Handles 500+ concurrent users with 97% success rate
- 🐳 **Container-Ready** — Docker & Kubernetes deployment configurations
- 📱 **Responsive Design** — Modern React UI with Bootstrap

---

## ✨ Key Features

### For Travelers
- 🔍 **Advanced Search** — Filter by location, dates, price, amenities, guest count
- 📅 **Smart Booking** — Real-time availability validation with conflict prevention
- ❤️ **Favorites System** — Save and manage favorite properties
- ⭐ **Reviews & Ratings** — View and submit property reviews
- 👤 **Profile Management** — Avatar upload, preferences, booking history
- 🤖 **AI Trip Planner** — Get personalized itineraries with local recommendations
- 📧 **Real-time Notifications** — Kafka-powered booking updates

### For Property Owners
- 🏠 **Property Management** — Full CRUD operations for listings
- 📸 **Image Management** — Multi-image upload with preview
- 📊 **Dashboard Analytics** — Booking requests, earnings, property status
- ✅ **Booking Control** — Accept/reject incoming reservation requests
- 📈 **Revenue Tracking** — Comprehensive booking statistics
- 🔔 **Event Notifications** — Real-time alerts for new bookings

### Platform Features
- 🔐 **Secure Authentication** — bcrypt password hashing, JWT tokens, session management
- 🚀 **High Performance** — Redis caching, MongoDB indexing, connection pooling
- 📦 **Event Streaming** — Apache Kafka for asynchronous processing
- 🔄 **Background Workers** — Kafka consumers for owner/traveler notifications
- 📝 **Comprehensive API** — RESTful endpoints with detailed documentation
- 🧪 **Load Tested** — JMeter performance tests for 100-500 concurrent users

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Device]
    end

    subgraph "Frontend - React SPA"
        REACT[React Application<br/>Vite + React Router]
        UI[UI Components<br/>Bootstrap 5]
        STATE[State Management<br/>Redux Toolkit]
    end

    subgraph "API Gateway Layer"
        NGINX[Nginx Reverse Proxy<br/>Load Balancer]
    end

    subgraph "Backend Services"
        API[Express API Server<br/>Port 3001]
        AGENT[AI Concierge Service<br/>FastAPI - Port 8000]
    end

    subgraph "Background Workers"
        OWNER_WORKER[Owner Consumer<br/>Kafka Consumer]
        TRAVELER_WORKER[Traveler Consumer<br/>Kafka Consumer]
    end

    subgraph "Message Broker"
        KAFKA[Apache Kafka<br/>Event Streaming]
        ZOOKEEPER[Apache Zookeeper<br/>Kafka Coordination]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB Atlas<br/>Primary Database)]
        REDIS[(Redis<br/>Session Cache)]
    end

    subgraph "External Services"
        TAVILY[Tavily Search API<br/>Live Web Search]
        STORAGE[Cloud Storage<br/>Image Uploads]
    end

    WEB --> REACT
    MOBILE --> REACT
    REACT --> UI
    REACT --> STATE
    REACT --> |HTTP/REST| NGINX
    NGINX --> API
    NGINX --> AGENT
    
    API --> |Read/Write| MONGO
    API --> |Cache| REDIS
    API --> |Publish Events| KAFKA
    
    KAFKA --> |Subscribe| OWNER_WORKER
    KAFKA --> |Subscribe| TRAVELER_WORKER
    KAFKA --- ZOOKEEPER
    
    OWNER_WORKER --> |Notifications| MONGO
    TRAVELER_WORKER --> |Notifications| MONGO
    
    AGENT --> |Search Queries| TAVILY
    AGENT --> |Property Data| MONGO
    
    API --> |Store| STORAGE

    style REACT fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    style API fill:#68a063,stroke:#333,stroke-width:2px
    style AGENT fill:#009688,stroke:#333,stroke-width:2px
    style KAFKA fill:#231f20,stroke:#333,stroke-width:2px,color:#fff
    style MONGO fill:#4db33d,stroke:#333,stroke-width:2px
    style REDIS fill:#dc382d,stroke:#333,stroke-width:2px
```

### Microservices Communication Flow

```mermaid
sequenceDiagram
    actor T as Traveler
    participant F as Frontend (React)
    participant A as API Server
    participant M as MongoDB
    participant K as Kafka
    participant OW as Owner Worker
    participant TW as Traveler Worker
    participant AI as AI Concierge

    Note over T,AI: Booking Flow with Event Streaming
    
    T->>F: Search Properties
    F->>A: GET /api/properties/search
    A->>M: Query properties
    M-->>A: Property results
    A-->>F: JSON response
    F-->>T: Display properties
    
    T->>F: Create Booking
    F->>A: POST /api/bookings
    A->>M: Check availability
    M-->>A: Availability confirmed
    A->>M: Create booking record
    M-->>A: Booking created
    
    Note over A,K: Async Event Publishing
    A->>K: Publish booking-events
    A->>K: Publish owner-notifications
    A->>K: Publish traveler-notifications
    A-->>F: Booking confirmation
    F-->>T: Success message
    
    par Background Processing
        K->>OW: Consume owner-notifications
        OW->>M: Create owner notification
        M-->>OW: Notification saved
    and
        K->>TW: Consume traveler-notifications
        TW->>M: Create traveler notification
        M-->>TW: Notification saved
    end
    
    Note over T,AI: AI Trip Planning
    T->>F: Ask for itinerary
    F->>AI: POST /api/v1/concierge-agent
    AI->>M: Fetch property details
    M-->>AI: Property data
    AI->>AI: Generate with LLM + Tavily
    AI-->>F: Personalized itinerary
    F-->>T: Display trip plan
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph Input
        USER[User Request]
        FILE[File Upload]
    end
    
    subgraph "Request Processing Pipeline"
        CORS[CORS Middleware]
        RATE[Rate Limiter]
        AUTH[Authentication]
        VALID[Validation]
        ROUTER[Router]
    end
    
    subgraph "Business Logic Layer"
        CTRL[Controller]
        SVC[Service]
        MODEL[Data Model]
    end
    
    subgraph "Data Persistence"
        CACHE[(Redis Cache)]
        DB[(MongoDB)]
        QUEUE[(Kafka Queue)]
    end
    
    subgraph Output
        RESP[JSON Response]
        EVENT[Event Published]
    end
    
    USER --> CORS
    FILE --> CORS
    CORS --> RATE
    RATE --> AUTH
    AUTH --> VALID
    VALID --> ROUTER
    ROUTER --> CTRL
    CTRL --> SVC
    
    SVC --> |Check Cache| CACHE
    CACHE --> |Cache Miss| DB
    SVC --> |Read/Write| DB
    SVC --> |Publish Event| QUEUE
    
    SVC --> CTRL
    CTRL --> RESP
    QUEUE --> EVENT
    
    style USER fill:#3498db,stroke:#2980b9,stroke-width:2px
    style RESP fill:#2ecc71,stroke:#27ae60,stroke-width:2px
    style EVENT fill:#e74c3c,stroke:#c0392b,stroke-width:2px
    style DB fill:#f39c12,stroke:#d68910,stroke-width:2px
    style CACHE fill:#e67e22,stroke:#ca6f1e,stroke-width:2px
    style QUEUE fill:#9b59b6,stroke:#8e44ad,stroke-width:2px
```

### Database Schema

```mermaid
erDiagram
    USERS ||--o{ PROPERTIES : owns
    USERS ||--o{ BOOKINGS : creates
    USERS ||--o{ FAVORITES : has
    USERS ||--o{ REVIEWS : writes
    PROPERTIES ||--o{ BOOKINGS : receives
    PROPERTIES ||--o{ FAVORITES : featured_in
    PROPERTIES ||--o{ REVIEWS : has
    PROPERTIES ||--o{ PROPERTY_IMAGES : contains
    BOOKINGS ||--o| REVIEWS : generates

    USERS {
        ObjectId _id PK
        string name
        string email UK
        string password
        enum user_type "traveler|owner"
        string phone
        string about_me
        string city
        string state
        string country
        string profile_picture
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    PROPERTIES {
        ObjectId _id PK
        ObjectId owner_id FK
        string name
        text description
        enum property_type
        string address
        string city
        string state
        string country
        decimal price_per_night
        int bedrooms
        int bathrooms
        int max_guests
        text amenities
        text house_rules
        date availability_start
        date availability_end
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    BOOKINGS {
        ObjectId _id PK
        ObjectId property_id FK
        ObjectId traveler_id FK
        date check_in_date
        date check_out_date
        int number_of_guests
        decimal total_price
        enum status "pending|accepted|rejected|cancelled|completed"
        text special_requests
        text cancellation_reason
        timestamp created_at
        timestamp updated_at
    }

    FAVORITES {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId property_id FK
        timestamp created_at
    }

    REVIEWS {
        ObjectId _id PK
        ObjectId property_id FK
        ObjectId user_id FK
        ObjectId booking_id FK
        int rating "1-5"
        text review_text
        timestamp created_at
    }

    PROPERTY_IMAGES {
        ObjectId _id PK
        ObjectId property_id FK
        string image_url
        enum image_type "main|additional"
        int display_order
        timestamp created_at
    }
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.3.1 |
| **Vite** | Build Tool & Dev Server | 5.4.10 |
| **React Router** | Client-side Routing | 6.26.2 |
| **Redux Toolkit** | State Management | 1.9.7 |
| **Axios** | HTTP Client | 1.7.7 |
| **Bootstrap 5** | UI Components & Styling | 5.3.3 |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | 18+ |
| **Express** | Web Framework | 4.18.2 |
| **MongoDB** | Primary Database | 8.0 (Atlas) |
| **Mongoose** | ODM | 8.0.0 |
| **Redis** | Session Store & Caching | Latest |
| **Apache Kafka** | Message Broker | 7.5.0 |
| **KafkaJS** | Kafka Client | 2.2.4 |

### AI Service
| Technology | Purpose | Version |
|------------|---------|---------|
| **Python** | Runtime | 3.11+ |
| **FastAPI** | Web Framework | Latest |
| **LangChain** | LLM Framework | Latest |
| **Tavily API** | Web Search Integration | Latest |
| **Ollama** | Local LLM (Llama 3) | Latest |

### DevOps & Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Kubernetes** | Container orchestration |
| **Nginx** | Reverse proxy & load balancer |
| **JMeter** | Performance testing (500+ users tested) |

### Security
- **bcrypt** — Password hashing (10 rounds)
- **JWT** — Token-based authentication
- **express-session** — Session management
- **Helmet** — Security headers
- **express-rate-limit** — DDoS protection
- **CORS** — Cross-origin resource sharing

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js 18+              # https://nodejs.org/
Python 3.10+             # https://python.org/
Docker & Docker Compose  # https://docker.com/
MongoDB Atlas Account    # https://mongodb.com/cloud/atlas (FREE)

# Optional
Kubernetes               # For production deployment
JMeter 5.6+             # For performance testing
Tavily API Key          # For AI web search (free tier available)
```

### 1. Clone Repository

```bash
git clone https://github.com/Shibin506/HostIQ.git
cd HostIQ
```

### 2. Setup MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/hostiq?retryWrites=true&w=majority
   ```
3. Whitelist your IP address in Network Access

### 3. Environment Configuration

#### Backend Configuration
Create `Backend/.env`:

```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hostiq?retryWrites=true&w=majority

# Server
NODE_ENV=development
PORT=3001

# Security
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# CORS
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Kafka (for Docker setup)
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=hostiq-backend

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

#### Frontend Configuration
Create `Frontend/.env`:

```bash
VITE_API_BASE=http://localhost:3001/api
VITE_AGENT_API_BASE=http://localhost:8000/api/v1
VITE_MOCK=false
```

#### AI Service Configuration
Create `AgentAI/.env`:

```bash
FRONTEND_URL=http://localhost:3000
TAVILY_API_KEY=your_tavily_api_key_here  # Get free key at https://tavily.com/
```

### 4. Installation Methods

#### Option A: Docker Compose (Recommended) 🐳

Start all services with one command:

```bash
# Start backend services (API + Kafka + Redis)
cd Backend
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f backend
```

This starts:
- ✅ Backend API (Port 3001)
- ✅ Apache Kafka + Zookeeper
- ✅ Redis Cache
- ✅ Owner Consumer (Kafka worker)
- ✅ Traveler Consumer (Kafka worker)

Then start Frontend and AI service:

```bash
# Terminal 2: Frontend
cd Frontend
npm install
npm run dev
# Opens at http://localhost:3000

# Terminal 3: AI Service
cd AgentAI
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

#### Option B: Manual Installation

**Backend:**
```bash
cd Backend
npm install
npm start
# Runs on http://localhost:3001
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

**AI Service:**
```bash
cd AgentAI
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
# Runs on http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

### 5. Verify Installation

```bash
# Backend health check
curl http://localhost:3001/health

# AI service health check
curl http://localhost:8000/health

# Frontend
# Open browser: http://localhost:3000
```

### 6. Access the Application

**🌐 Frontend:** http://localhost:3000  
**📡 Backend API:** http://localhost:3001/api  
**🤖 AI Service:** http://localhost:8000  
**📚 AI Swagger Docs:** http://localhost:8000/docs

---

## 📁 Project Structure

```
HostIQ/
├── Frontend/                    # React SPA (Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx     # Navigation with branding
│   │   │   ├── Footer.jsx     # Footer component
│   │   │   ├── PropertyCard.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── AgentAIModal.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Signup.jsx
│   │   │   ├── traveler/
│   │   │   │   ├── Home.jsx           # Property search
│   │   │   │   ├── PropertyDetails.jsx
│   │   │   │   ├── Favorites.jsx
│   │   │   │   ├── Trips.jsx          # Booking history
│   │   │   │   └── Profile.jsx
│   │   │   └── owner/
│   │   │       ├── HostDashboard.jsx
│   │   │       ├── HostMyProperties.jsx
│   │   │       └── HostPropertyForm.jsx
│   │   ├── services/          # API service layer
│   │   │   └── api.js         # Axios configuration
│   │   ├── store/             # Redux store
│   │   │   ├── authSlice.js
│   │   │   ├── propertySlice.js
│   │   │   ├── bookingSlice.js
│   │   │   ├── favoriteSlice.js
│   │   │   └── store.js
│   │   ├── context/           # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx            # Root component
│   │   ├── main.jsx           # Entry point
│   │   └── styles.css         # Global styles
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── Backend/                    # Express API Server
│   ├── src/
│   │   ├── server.js          # Entry point
│   │   ├── app.js             # Express app config
│   │   ├── config/            # Configuration
│   │   │   ├── database.js    # MongoDB connection
│   │   │   └── env.js         # Environment variables
│   │   ├── routes/            # API routes
│   │   │   ├── auth.js        # Authentication endpoints
│   │   │   ├── properties.js  # Property management
│   │   │   ├── bookings.js    # Booking operations
│   │   │   ├── favorites.js   # Favorites management
│   │   │   └── users.js       # User profile
│   │   ├── controllers/       # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── propertyController.js
│   │   │   ├── bookingController.js
│   │   │   └── favoriteController.js
│   │   ├── services/          # Business logic
│   │   │   ├── authService.js
│   │   │   ├── propertyService.js
│   │   │   ├── bookingService.js
│   │   │   ├── favoriteService.js
│   │   │   └── kafka.js       # Kafka client
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Property.js
│   │   │   ├── Booking.js
│   │   │   ├── Favorite.js
│   │   │   ├── Review.js
│   │   │   └── PropertyImage.js
│   │   ├── middleware/        # Express middleware
│   │   │   ├── requireAuth.js # Authentication
│   │   │   ├── errorHandler.js
│   │   │   └── validateRequest.js
│   │   └── worker/            # Background workers
│   │       ├── ownerConsumer.js    # Kafka consumer for owners
│   │       └── travelerConsumer.js # Kafka consumer for travelers
│   ├── package.json
│   ├── docker-compose.yml     # Full stack composition
│   └── Dockerfile
│
├── AgentAI/                    # FastAPI AI Service
│   ├── app.py                 # Main application
│   ├── fallbacks/             # Fallback data
│   │   ├── activities.json
│   │   └── restaurants.json
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── JMeter/                     # Performance Testing
│   ├── Airbnb_Performance_Test.jmx    # JMeter test plan
│   ├── run_all_tests.sh               # Test automation script
│   ├── QUICK_START.md
│   └── README.md
│
├── deploy/                     # Deployment configurations
│   ├── k8s/                   # Kubernetes manifests
│   │   ├── 01-secrets.yaml
│   │   ├── 02-configmaps.yaml
│   │   ├── 04-zookeeper.yaml
│   │   ├── 05-kafka.yaml
│   │   ├── 06-mysql.yaml
│   │   ├── 07-backend.yaml
│   │   ├── 08-agentai.yaml
│   │   ├── 09-frontend.yaml
│   │   ├── 10-ingress.yaml
│   │   ├── 11-kafka-consumers.yaml
│   │   ├── deploy.sh          # Deployment script
│   │   └── cleanup.sh
│   └── README.md
│
├── docker-compose.yml          # Main Docker Compose (MySQL version)
├── docker-compose-mongodb.yml  # MongoDB Atlas version
├── README.md                   # This file
└── .gitignore

```

---

## 📚 API Documentation

### Service Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3000 | http://localhost:3000 | React Web App |
| Backend API | 3001 | http://localhost:3001/api | REST API |
| AI Concierge | 8000 | http://localhost:8000/api/v1 | FastAPI Service |
| MongoDB | 27017 | - | Database (Atlas) |
| Redis | 6379 | - | Cache & Sessions |
| Kafka | 9092 | - | Message Broker |
| Zookeeper | 2181 | - | Kafka Coordinator |

### API Endpoints Overview

#### 🔐 Authentication
```http
POST   /api/auth/register      # User registration
POST   /api/auth/login         # User login
POST   /api/auth/logout        # User logout
GET    /api/auth/me            # Get current user
```

#### 🏠 Properties
```http
GET    /api/properties/search                    # Search with filters
GET    /api/properties/:id                       # Property details
POST   /api/properties                           # Create property (Owner)
PUT    /api/properties/:id                       # Update property (Owner)
DELETE /api/properties/:id                       # Delete property (Owner)
GET    /api/properties/owner/my-properties       # Owner's properties
POST   /api/properties/:id/upload-images         # Upload images (Owner)
```

#### 📅 Bookings
```http
POST   /api/bookings                             # Create booking (Traveler)
GET    /api/bookings/traveler/my-bookings        # Traveler's bookings
GET    /api/bookings/owner/incoming-requests     # Owner's booking requests
GET    /api/bookings/:id                         # Booking details
PATCH  /api/bookings/:id/accept                  # Accept booking (Owner)
PATCH  /api/bookings/:id/cancel                  # Cancel booking
GET    /api/bookings/owner/statistics            # Booking statistics (Owner)
```

#### ❤️ Favorites
```http
GET    /api/favorites                            # Get all favorites (Traveler)
POST   /api/favorites/:propertyId                # Add to favorites (Traveler)
DELETE /api/favorites/:propertyId                # Remove from favorites (Traveler)
GET    /api/favorites/check/:propertyId          # Check favorite status
GET    /api/favorites/count                      # Get favorites count
```

#### 👤 Users
```http
GET    /api/users/profile                        # Get user profile
PUT    /api/users/profile                        # Update profile
POST   /api/users/upload-profile-picture         # Upload avatar
GET    /api/users/dashboard                      # User dashboard
```

#### 🤖 AI Concierge
```http
POST   /api/v1/concierge-agent                   # Generate trip itinerary
GET    /api/v1/concierge-agent/diag              # Service diagnostics
```

### Example API Requests

#### Search Properties
```bash
curl -X GET "http://localhost:3001/api/properties/search?city=San%20Francisco&guests=2&min_price=100&max_price=300&page=1&limit=10"
```

#### Create Booking
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: hostiq.session=your_session_cookie" \
  -d '{
    "property_id": "507f1f77bcf86cd799439011",
    "check_in_date": "2024-02-01",
    "check_out_date": "2024-02-05",
    "number_of_guests": 2,
    "special_requests": "Late check-in if possible"
  }'
```

#### AI Trip Planning
```bash
curl -X POST http://localhost:8000/api/v1/concierge-agent \
  -H "Content-Type: application/json" \
  -d '{
    "location": "San Francisco",
    "check_in_date": "2025-01-15",
    "check_out_date": "2025-01-20",
    "travelers": 2,
    "preferences": "outdoor activities, local cuisine, museums"
  }'
```

---

## 🎨 Frontend Features

### Traveler Features

#### Home & Search
- Advanced property search with multiple filters
- Real-time availability checking
- Sort by price, rating, newest
- Pagination support
- Responsive grid layout

#### Property Details
- Image gallery with preview
- Property information and amenities
- Reviews and ratings display
- Booking availability calendar
- Favorite button
- AI trip planning integration

#### Booking Management
- View all bookings (pending, confirmed, completed)
- Booking status tracking
- Cancellation with reason
- Special requests
- Total price calculation

#### Favorites
- Add/remove properties to favorites
- View all saved properties
- Quick access from any page

#### Profile Management
- Update personal information
- Upload profile picture
- View booking history
- Manage preferences

### Owner Features

#### Dashboard
- Overview of all properties
- Incoming booking requests
- Revenue statistics
- Property analytics

#### Property Management
- Create new properties
- Edit existing listings
- Upload multiple images
- Set availability dates
- Manage amenities and rules
- Delete properties

#### Booking Management
- View all booking requests
- Accept/reject requests
- View traveler information
- Booking history and statistics

---

## ⚙️ Backend Services

### Core Services

#### Authentication Service
- **bcrypt** password hashing (10 rounds)
- **JWT** token generation and validation
- **Session** management with Connect-Mongo
- **Role-based** access control (Traveler/Owner)

#### Property Service
- Full CRUD operations
- Advanced search with MongoDB aggregation
- Image upload handling (Multer)
- Availability management
- Owner verification

#### Booking Service
- Availability validation
- Conflict prevention
- Status management (pending → accepted/rejected → completed)
- Price calculation
- Cancellation handling

#### Favorite Service
- Add/remove favorites
- Favorite status checking
- Populate property details

#### Notification Service (Kafka Integration)
- Publish booking events
- Publish owner notifications
- Publish traveler notifications
- Event-driven architecture

---

## 🔄 Event-Driven Architecture

### Kafka Topics

| Topic | Purpose | Producers | Consumers |
|-------|---------|-----------|-----------|
| `booking-events` | All booking activities | Backend API | Owner Consumer, Traveler Consumer |
| `owner-notifications` | Property owner alerts | Backend API | Owner Consumer |
| `traveler-notifications` | Traveler updates | Backend API | Traveler Consumer |

### Event Flow

```mermaid
sequenceDiagram
    participant API as Backend API
    participant K as Kafka Broker
    participant OC as Owner Consumer
    participant TC as Traveler Consumer
    participant DB as MongoDB

    Note over API,DB: New Booking Created
    
    API->>K: Publish to booking-events
    API->>K: Publish to owner-notifications
    API->>K: Publish to traveler-notifications
    
    par Parallel Processing
        K->>OC: Deliver owner-notifications
        OC->>DB: Create notification record
        DB-->>OC: Notification saved
    and
        K->>TC: Deliver traveler-notifications
        TC->>DB: Create notification record
        DB-->>TC: Notification saved
    end
    
    Note over OC,TC: Consumers process events asynchronously
```

### Consumer Workers

#### Owner Consumer (`src/worker/ownerConsumer.js`)
- Listens to `owner-notifications` topic
- Sends notifications for new bookings
- Updates property analytics
- Logs booking activities

#### Traveler Consumer (`src/worker/travelerConsumer.js`)
- Listens to `traveler-notifications` topic
- Sends booking confirmations
- Tracks user activities
- Manages favorite updates

### Starting Kafka Consumers

```bash
# With Docker Compose (automatic)
cd Backend
docker-compose up -d

# Manual start
npm run owner-consumer     # Terminal 1
npm run traveler-consumer  # Terminal 2
```

---

## 🤖 AI Concierge Service

### Features

- 🗺️ **Personalized Itineraries** — Day-by-day trip planning
- 🎯 **Activity Recommendations** — Local attractions and experiences
- 🍽️ **Restaurant Suggestions** — Curated dining options with ratings
- 🎒 **Smart Packing Lists** — Weather-based packing recommendations
- 🔗 **Live Web Search** — Real-time information via Tavily API
- 📍 **Location Intelligence** — Natural language location parsing

### Technology Stack

- **FastAPI** — High-performance Python web framework
- **LangChain** — LLM orchestration framework
- **Ollama** — Local Llama 3 model (8B parameters)
- **Tavily API** — Live web search integration
- **Pydantic** — Data validation and settings management

### API Endpoint

```http
POST /api/v1/concierge-agent
Content-Type: application/json

{
  "location": "San Francisco, CA",
  "check_in_date": "2025-01-15",
  "check_out_date": "2025-01-20",
  "travelers": 2,
  "preferences": "outdoor activities, seafood, wine tasting"
}
```

### Response Structure

```json
{
  "day_by_day_plan": [
    {
      "day": 1,
      "date": "2025-01-15",
      "title": "Arrival & Fisherman's Wharf",
      "activities": ["..."],
      "meals": {
        "breakfast": "...",
        "lunch": "...",
        "dinner": "..."
      }
    }
  ],
  "activity_cards": [
    {
      "name": "Golden Gate Bridge Walk",
      "category": "Outdoor",
      "duration": "2-3 hours",
      "description": "...",
      "tips": "..."
    }
  ],
  "restaurant_recommendations": [
    {
      "name": "Swan Oyster Depot",
      "cuisine": "Seafood",
      "price_range": "$$",
      "rating": 4.8,
      "specialties": ["..."]
    }
  ],
  "packing_checklist": {
    "clothing": ["..."],
    "accessories": ["..."],
    "essentials": ["..."]
  }
}
```

### Setup Local LLM (Optional)

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve &

# Pull Llama 3 model
ollama pull llama3:8b

# Verify
ollama list
```

---

## 🧪 Performance Testing

### JMeter Test Suite

Comprehensive load testing for 100-500 concurrent users.

#### Test Coverage

- **User Authentication** — Login/Register flows
- **Property Search** — Complex queries with filters
- **Property Details** — High-traffic endpoint
- **Booking Creation** — Transaction-heavy operations

#### Test Results (500 Concurrent Users)

| Endpoint | Avg Response Time | 95th Percentile | Error Rate | Throughput |
|----------|-------------------|-----------------|------------|------------|
| User Login | 11.5s | 14.2s | 0% | 9.3 req/s |
| Search Properties | 3.9s | 8.1s | 11% | 12.1 req/s |
| Property Details | 1.8s | 3.2s | 0% | 15.4 req/s |
| Create Booking | 1.1s | 2.1s | 0% | 8.7 req/s |

#### Running Tests

```bash
cd JMeter

# Run single test (100 users)
jmeter -n -t Airbnb_Performance_Test.jmx \
  -l results/100_users.jtl \
  -e -o results/100_users_report

# Run all tests (100-500 users)
./run_all_tests.sh

# View HTML report
open results/500_users_report/index.html
```

#### Performance Optimizations

- ✅ **Connection Pooling** — MongoDB connection pool (50 max)
- ✅ **Indexing** — Database indexes on frequently queried fields
- ✅ **Redis Caching** — Session storage and query caching
- ✅ **Rate Limiting** — 100 requests per 15 minutes per IP
- ✅ **Compression** — Gzip response compression
- ✅ **Query Optimization** — Aggregation pipelines for complex queries

---

## 🚀 Deployment

### Docker Deployment

#### Development Environment

```bash
# Complete stack with MongoDB Atlas
docker-compose -f docker-compose-mongodb.yml up -d

# Or with local MySQL
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f kafka

# Stop services
docker-compose down

# Remove volumes (clean state)
docker-compose down --volumes
```

#### Production Build

```bash
# Build optimized images
docker-compose -f docker-compose-mongodb.yml build

# Run in production mode
docker-compose -f docker-compose-mongodb.yml up -d

# Scale services
docker-compose up -d --scale backend=3
```

### Kubernetes Deployment

#### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or local with Minikube)
- kubectl configured
- NGINX Ingress Controller installed

#### Deploy to Kubernetes

```bash
cd deploy/k8s

# Create namespace and secrets
kubectl apply -f 01-secrets.yaml
kubectl apply -f 02-configmaps.yaml

# Deploy infrastructure
kubectl apply -f 03-storage.yaml
kubectl apply -f 04-zookeeper.yaml
kubectl apply -f 05-kafka.yaml
kubectl apply -f 06-mysql.yaml

# Deploy application services
kubectl apply -f 07-backend.yaml
kubectl apply -f 08-agentai.yaml
kubectl apply -f 09-frontend.yaml

# Deploy Kafka consumers
kubectl apply -f 11-kafka-consumers.yaml

# Deploy ingress (optional)
kubectl apply -f 10-ingress.yaml

# Check deployment status
kubectl get pods -n hostiq
kubectl get services -n hostiq

# Or use deployment script
./deploy.sh
```

#### Scale Services

```bash
# Scale backend API
kubectl -n hostiq scale deployment backend --replicas=5

# Scale AI service
kubectl -n hostiq scale deployment agentai --replicas=3

# Scale Kafka consumers
kubectl -n hostiq scale deployment owner-consumer --replicas=2
```

#### Cleanup

```bash
# Remove all resources
./cleanup.sh

# Or manually
kubectl delete namespace hostiq
```

### Environment-Specific Configurations

#### Development
- Hot reload enabled
- Detailed error messages
- Debug logging
- Local file storage

#### Production
- Minified builds
- Generic error messages
- Production logging
- Cloud storage (S3/GCS)
- SSL/TLS enabled
- Rate limiting strict
- Security headers enforced

---

## 🔒 Security

### Security Features

#### 1. Authentication & Authorization
- ✅ **bcrypt** password hashing with 10 salt rounds
- ✅ **JWT** tokens with expiration
- ✅ **Session-based** authentication with secure cookies
- ✅ **Role-based access control** (Traveler/Owner/Admin)
- ✅ **MongoDB connection** with TLS/SSL

#### 2. API Security
- ✅ **CORS** configuration for allowed origins
- ✅ **Helmet** security headers (CSP, HSTS, X-Frame-Options)
- ✅ **Rate limiting** (100 req/15min per IP)
- ✅ **Input validation** with Joi schemas
- ✅ **SQL injection prevention** with parameterized queries
- ✅ **XSS protection** with input sanitization

#### 3. Data Protection
- ✅ **Environment variables** for secrets (.env not committed)
- ✅ **Encrypted passwords** (never stored in plain text)
- ✅ **Secure session storage** (HttpOnly, Secure, SameSite cookies)
- ✅ **MongoDB Atlas** with IP whitelisting

#### 4. File Upload Security
- ✅ **File type validation** (images only: JPG, PNG, GIF, WebP)
- ✅ **File size limits** (Profile: 5MB, Properties: 10MB per file)
- ✅ **Filename sanitization** to prevent path traversal
- ✅ **Virus scanning** (recommended for production)

### Security Best Practices

1. **Never commit `.env` files** — Use `.env.example` as template
2. **Rotate secrets regularly** — Change JWT/Session secrets periodically
3. **Use HTTPS in production** — Enable SSL/TLS certificates
4. **Keep dependencies updated** — Regularly run `npm audit`
5. **Implement API versioning** — Maintain backward compatibility
6. **Monitor suspicious activity** — Log authentication failures
7. **Backup database regularly** — Automated MongoDB Atlas backups

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
   ```bash
   git fork https://github.com/Shibin506/HostIQ.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "Add: amazing new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference related issues
   - Wait for review

### Code Style

- **JavaScript**: Follow Airbnb JavaScript Style Guide
- **Python**: Follow PEP 8
- **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)
- **Testing**: Add unit tests for new features

### Reporting Issues

- Use GitHub Issues
- Include steps to reproduce
- Provide system information
- Attach relevant logs

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 👥 Team

**Course:** DATA-236 - Cloud Technologies & Distributed Systems  
**Institution:** San Jose State University  
**Semester:** Fall 2025  

---

## 🙏 Acknowledgments

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database hosting
- [Apache Kafka](https://kafka.apache.org/) for event streaming
- [FastAPI](https://fastapi.tiangolo.com/) for AI service framework
- [Tavily](https://tavily.com/) for web search API
- [Bootstrap](https://getbootstrap.com/) for UI components

---

## 📞 Support

For questions, issues, or feature requests:

- 📧 Email: support@hostiq.com
- 🐛 Issues: [GitHub Issues]
(https://github.com/Shibin506/HostIQ/issues)
- 📖 Docs: [Full Documentation](./docs)
- 💬 Discussions: [GitHub Discussions](https://github.com/Shibin506/HostIQ/discussions)

---

## 🎯 Roadmap

### Version 2.0 (Planned)
- [ ] Real-time chat between owners and travelers
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notifications via SendGrid
- [ ] Progressive Web App (PWA) support
- [ ] Mobile apps (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Social media authentication (Google, Facebook)
- [ ] Property verification system
- [ ] Referral and rewards program

---

<div align="center">

**⭐ If you found HostIQ helpful, please give it a star on GitHub!**

[![GitHub stars](https://img.shields.io/github/stars/Shibin506/HostIQ?style=social)](https://github.com/Shibin506/HostIQ)
[![GitHub forks](https://img.shields.io/github/forks/Shibin506/HostIQ?style=social)](https://github.com/Shibin506/HostIQ/fork)

Made with ❤️ by the HostIQ Team

</div>
