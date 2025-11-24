# 🚀 AWS EC2 Deployment - Start Here!

## Prerequisites Check ✅

Before starting, make sure you have:
- [ ] AWS Account (free tier works!)
- [ ] MongoDB Atlas connection string
- [ ] Code pushed to GitHub
- [ ] This project on your local machine

---

## 🎯 STEP 1: Prepare Your Local Project (5 minutes)

### 1.1 Navigate to Backend directory
```bash
cd Backend
```

### 1.2 Run the preparation script
```bash
chmod +x ../aws-deployment/prepare-for-aws.sh
../aws-deployment/prepare-for-aws.sh
```

**It will ask for your EC2 IP** - Don't have it yet? That's OK! 
- Just enter a placeholder like `1.2.3.4` for now
- We'll update it in Step 3 after creating the EC2 instance

### 1.3 Update MongoDB credentials
```bash
nano .env
```

Find this line:
```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@...
```

Replace with your actual MongoDB Atlas connection string.

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🖥️ STEP 2: Create EC2 Instance (10 minutes)

### 2.1 Go to AWS Console
1. Open https://console.aws.amazon.com/
2. Search for "EC2" in the top search bar
3. Click "Launch Instance"

### 2.2 Configure Instance

| Setting | Value |
|---------|-------|
| **Name** | `airbnb-app-server` |
| **AMI** | Amazon Linux 2023 AMI (first option) |
| **Instance Type** | t3.large |
| **Key Pair** | Create new → Name: `airbnb-key` → Download .pem file |

### 2.3 Configure Network & Security

Click "Edit" next to "Network settings"

**Security Group Rules** (Click "Add security group rule" for each):

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | My IP | SSH access |
| Custom TCP | 3000 | 0.0.0.0/0 | Frontend |
| Custom TCP | 3002 | 0.0.0.0/0 | Backend API |
| Custom TCP | 5001 | 0.0.0.0/0 | AgentAI |
| Custom TCP | 8080 | My IP | Adminer (optional) |

### 2.4 Configure Storage
- Change to: **30 GB** gp3

### 2.5 Launch!
Click **"Launch Instance"**

### 2.6 Get Your EC2 Public IP
1. Go to EC2 Dashboard → Instances
2. Click on your instance
3. Copy the **"Public IPv4 address"**
4. **Write it down:** `_________________`

---

## 🔄 STEP 3: Update Config with Real EC2 IP (2 minutes)

Now that you have the real EC2 IP, update your configuration:

```bash
cd Backend
```

Edit `.env`:
```bash
nano .env
```

**Find and replace these lines** with your actual EC2 IP:
```bash
FRONTEND_URL=http://YOUR_EC2_IP:3000
CORS_ORIGIN=http://YOUR_EC2_IP:3000
BACKEND_URL=http://YOUR_EC2_IP:3002
VITE_API_BASE=http://YOUR_EC2_IP:3002/api
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

Also update Frontend:
```bash
nano ../Frontend/.env
```

Replace with your EC2 IP:
```bash
VITE_API_BASE=http://YOUR_EC2_IP:3002/api
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 📤 STEP 4: Push to GitHub (2 minutes)

```bash
cd ..  # Go to project root
git add .
git commit -m "Configure for AWS EC2 deployment"
git push origin aws
```

---

## 🔐 STEP 5: MongoDB Atlas Configuration (2 minutes)

1. Go to https://cloud.mongodb.com/
2. Click your cluster → **Network Access** (left menu)
3. Click **"Add IP Address"**
4. Enter your EC2 IP from Step 2.6
5. Click **"Confirm"**

**OR** for testing: use `0.0.0.0/0` (allows from anywhere)

---

## 🌐 STEP 6: Connect to EC2 (5 minutes)

### 6.1 Prepare SSH Key
```bash
cd ~/Downloads  # or wherever you saved the .pem file
chmod 400 airbnb-key.pem
```

### 6.2 Connect
Replace `YOUR_EC2_IP` with your actual IP:
```bash
ssh -i airbnb-key.pem ec2-user@YOUR_EC2_IP
```

Type `yes` when prompted.

### 6.3 Run Setup Script
```bash
curl -o setup.sh https://raw.githubusercontent.com/Shibin506/DATA-236-LAB-1/aws/aws-deployment/ec2-setup.sh
chmod +x setup.sh
./setup.sh
```

This installs Docker, Docker Compose, and Git.

### 6.4 Reconnect (important!)
```bash
exit
ssh -i airbnb-key.pem ec2-user@YOUR_EC2_IP
```

---

## 📦 STEP 7: Deploy Application (15 minutes)

### 7.1 Clone Repository
```bash
cd ~
git clone https://github.com/Shibin506/DATA-236-LAB-1.git
cd DATA-236-LAB-1
git checkout aws
```

### 7.2 Build Containers
```bash
cd Backend
docker compose build
```

**This takes 5-8 minutes** ☕️

### 7.3 Start Services
```bash
docker compose up -d
```

### 7.4 Check Status
```bash
docker compose ps
```

All services should show "Up" or "healthy"

### 7.5 View Logs
```bash
docker compose logs backend --tail=50
```

Look for: `✅ MongoDB connected successfully`

---

## ✅ STEP 8: Verify Deployment (5 minutes)

### From EC2 terminal:
```bash
# Test backend
curl http://localhost:3002/health

# Test frontend
curl http://localhost:3000
```

### From your laptop browser:
Open these URLs (replace with your EC2 IP):
- Frontend: `http://YOUR_EC2_IP:3000`
- Backend: `http://YOUR_EC2_IP:3002/health`

**Can you see your application?** 🎉

---

## 🧪 STEP 9: Run JMeter Test (5 minutes)

### On your laptop:

```bash
cd JMeter
```

Edit test config:
```bash
nano Airbnb_Performance_Test.jmx
```

Find and replace `localhost` with your EC2 IP in these sections:
- `<stringProp name="HTTPSampler.domain">localhost</stringProp>`

Change to:
- `<stringProp name="HTTPSampler.domain">YOUR_EC2_IP</stringProp>`

**Or** use a simpler method - update in JMeter GUI, but for quick testing:

```bash
# Run test pointing to EC2
jmeter -n -t Airbnb_Performance_Test.jmx \
  -Jhost=YOUR_EC2_IP \
  -Jport=3002 \
  -l results/ec2_test.jtl \
  -e -o results/ec2_report

# View results
open results/ec2_report/index.html
```

---

## 🎓 For Your Presentation

### Live Demo Flow:
1. **Show EC2 instance** running in AWS Console
2. **Open application** in browser (`http://YOUR_EC2_IP:3000`)
3. **Login** as a user
4. **Start JMeter test** from your laptop (500 concurrent users)
5. **SSH to EC2** and run: `docker compose logs -f backend`
6. **Show live logs** processing requests
7. **Show JMeter results** → 97%+ success rate
8. **Show system resources**: `docker stats`

### Key Talking Points:
- ✅ Full-stack deployed on AWS EC2
- ✅ Docker Compose orchestrating 7+ services
- ✅ MongoDB Atlas for database (cloud-managed)
- ✅ Successfully handles 500 concurrent users
- ✅ Kafka for async messaging
- ✅ Microservices architecture (Owner/Traveler consumers)
- ✅ AI Agent integrated

---

## 🛟 Troubleshooting

### Can't access application from browser?
```bash
# Check security group has ports 3000, 3002 open
# Check all containers are running
docker compose ps

# Restart if needed
docker compose restart
```

### MongoDB connection failed?
```bash
# Check MongoDB Atlas IP whitelist
# Check MONGODB_URI in .env is correct

# Test connection
docker compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(err => console.error('❌ Failed:', err.message));
"
```

### Port already in use?
```bash
# Stop all services
docker compose down

# Start again
docker compose up -d
```

---

## 💰 After Presentation

### Stop instance (saves money):
```bash
# In AWS Console: EC2 → Instances → Select instance → Instance State → Stop
```

### Terminate instance (delete everything):
```bash
# In AWS Console: EC2 → Instances → Select instance → Instance State → Terminate
```

---

## 📞 Need Help?

Check these files:
- `aws-deployment/DEPLOYMENT_GUIDE.md` - Detailed guide
- `aws-deployment/QUICK_CHECKLIST.md` - Quick reference
- `aws-deployment/YOUR_DEPLOYMENT_SETTINGS.txt` - Your specific settings

Common commands:
```bash
# View all logs
docker compose logs -f

# Restart a service
docker compose restart backend

# Check system resources
docker stats

# Stop everything
docker compose down
```

---

🎉 **You're all set!** Follow these 9 steps and you'll have your application running on AWS EC2, ready for your presentation with JMeter testing!
