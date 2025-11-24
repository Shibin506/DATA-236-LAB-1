# AWS EC2 Deployment Guide for Airbnb Application

## 📋 Prerequisites
- AWS Account
- MongoDB Atlas cluster (already set up)
- Your application code in a Git repository

## 🖥️ Recommended EC2 Instance

**Instance Type:** t3.large
- **vCPUs:** 2
- **RAM:** 8 GB
- **Storage:** 30 GB (General Purpose SSD)
- **Cost:** ~$60/month (us-east-1)
- **Handles:** 500+ concurrent JMeter requests

## 📝 Step-by-Step Deployment

### Step 1: Launch EC2 Instance

1. **Go to AWS Console** → EC2 Dashboard
2. **Click "Launch Instance"**
3. **Configure Instance:**
   - **Name:** `airbnb-application-server`
   - **AMI:** Amazon Linux 2023 AMI (Free tier eligible)
   - **Instance Type:** t3.large
   - **Key Pair:** Create new or select existing (save .pem file!)
   
4. **Network Settings:**
   - **Auto-assign Public IP:** Enable
   - **Security Group:** Create new with these rules:

   | Type | Protocol | Port Range | Source | Description |
   |------|----------|------------|--------|-------------|
   | SSH | TCP | 22 | Your IP | SSH access |
   | HTTP | TCP | 80 | 0.0.0.0/0 | HTTP access |
   | HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS access |
   | Custom TCP | TCP | 3000 | 0.0.0.0/0 | Frontend |
   | Custom TCP | TCP | 3002 | 0.0.0.0/0 | Backend API |
   | Custom TCP | TCP | 8080 | Your IP | Adminer (optional) |

5. **Storage:** 30 GB gp3
6. **Click "Launch Instance"**

### Step 2: Connect to EC2 Instance

```bash
# Make key file read-only
chmod 400 your-key.pem

# SSH into instance (replace with your public IP)
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

### Step 3: Run Setup Script

```bash
# Download and run setup script
curl -o setup.sh https://raw.githubusercontent.com/<your-repo>/kafka/aws-deployment/ec2-setup.sh
chmod +x setup.sh
./setup.sh

# Log out and back in for Docker permissions
exit
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

### Step 4: Clone Your Repository

```bash
cd ~
git clone https://github.com/<your-username>/DATA-236-LAB-1.git
cd DATA-236-LAB-1
```

### Step 5: Configure Environment Variables

```bash
# Copy production environment template
cp aws-deployment/.env.production Backend/.env

# Edit with your actual values
nano Backend/.env
```

**Update these values:**
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `SESSION_SECRET`: Generate with `openssl rand -base64 32`
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `FRONTEND_URL`: Replace `<EC2_PUBLIC_IP>` with your actual EC2 public IP
- `CORS_ORIGIN`: Replace `<EC2_PUBLIC_IP>` with your actual EC2 public IP

### Step 6: Update Frontend Configuration

```bash
# Update frontend environment
nano Frontend/.env
```

Update:
```bash
VITE_API_BASE=http://<EC2_PUBLIC_IP>:3002/api
```

### Step 7: Update Docker Compose for Production

```bash
cd Backend
nano docker-compose.yml
```

Find the `frontend` service and update the `VITE_API_BASE` arg:
```yaml
args:
  VITE_API_BASE: http://<EC2_PUBLIC_IP>:3002/api
```

### Step 8: Build and Start Services

```bash
# Build all containers
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### Step 9: Verify Deployment

```bash
# Check backend health
curl http://localhost:3002/health

# Check frontend
curl http://localhost:3000

# View logs
docker compose logs -f backend
```

### Step 10: Access Your Application

- **Frontend:** `http://<EC2_PUBLIC_IP>:3000`
- **Backend API:** `http://<EC2_PUBLIC_IP>:3002`
- **Health Check:** `http://<EC2_PUBLIC_IP>:3002/health`

## 🧪 Run JMeter Tests from Your Local Machine

Update JMeter test configuration:

```bash
cd JMeter
nano Airbnb_Performance_Test.jmx
```

Update the HTTP Request Defaults:
- **Server Name:** `<EC2_PUBLIC_IP>`
- **Port:** `3002`

Run tests:
```bash
jmeter -n -t Airbnb_Performance_Test.jmx -l results/ec2_test.jtl -e -o results/ec2_test_report
```

## 📊 Monitoring Commands

```bash
# View all container logs
docker compose logs -f

# Check container resource usage
docker stats

# Check system resources
htop

# Restart a specific service
docker compose restart backend

# Stop all services
docker compose down

# Start all services
docker compose up -d
```

## 🔧 Troubleshooting

### Issue: Can't access frontend/backend from browser
- **Check Security Group:** Ensure ports 3000 and 3002 are open
- **Check Public IP:** Make sure you're using the correct EC2 public IP
- **Check containers:** `docker compose ps` - all should be "Up"

### Issue: Backend can't connect to MongoDB Atlas
- **Check MongoDB Atlas:** Ensure EC2 IP is whitelisted (or use 0.0.0.0/0 for testing)
- **Check credentials:** Verify MONGODB_URI in .env file

### Issue: Frontend API calls failing
- **Check CORS:** Verify CORS_ORIGIN in backend .env matches frontend URL
- **Check network:** `curl http://localhost:3002/health` from EC2

## 💰 Cost Optimization

**After presentation:**
1. **Stop instance:** EC2 Dashboard → Stop Instance (saves compute costs)
2. **Terminate when done:** Permanently delete to stop all charges

**Monthly costs (approximate):**
- t3.large EC2: ~$60
- Storage (30GB): ~$3
- Data transfer: ~$5-10
- **Total: ~$70/month**

## 🎓 For Your Presentation

**Demo Flow:**
1. Show application running on EC2 (browser)
2. Open JMeter on your laptop
3. Run 500 concurrent user test
4. Show real-time backend logs: `docker compose logs -f backend`
5. Show JMeter results dashboard
6. Highlight 97%+ success rate

**Key Talking Points:**
- Deployed full stack (Frontend, Backend, Kafka, AI Agent) on single EC2
- MongoDB Atlas for managed database
- Docker Compose for container orchestration
- Successfully handles 500 concurrent users
- All services communicate via internal Docker network
