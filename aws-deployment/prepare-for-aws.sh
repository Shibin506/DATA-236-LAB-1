#!/bin/bash
# Script to prepare your project for AWS EC2 deployment
# Run this on your LOCAL machine BEFORE deploying to EC2

set -e

echo "=========================================="
echo "🚀 Preparing Project for AWS Deployment"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the Backend directory"
    exit 1
fi

# Prompt for EC2 Public IP
echo "📝 Please enter your EC2 Public IP address:"
read -p "EC2 IP: " EC2_IP

if [ -z "$EC2_IP" ]; then
    echo "❌ Error: EC2 IP cannot be empty"
    exit 1
fi

echo ""
echo "🔧 Configuring for EC2 IP: $EC2_IP"
echo ""

# Create .env file from template
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

cat > .env << EOF
# AWS EC2 Production Environment Variables
# Generated on $(date)

# MongoDB Atlas Connection (UPDATE THIS!)
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@airbnb-main.d4apnix.mongodb.net/airbnb?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=production
PORT=3001

# Session & JWT Secrets (CHANGE THESE!)
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# CORS Configuration
FRONTEND_URL=http://${EC2_IP}:3000
CORS_ORIGIN=http://${EC2_IP}:3000
BACKEND_URL=http://${EC2_IP}:3002

# Kafka Configuration
KAFKA_BROKERS=kafka:9093
KAFKA_CLIENT_ID=airbnb-backend

# MySQL (keeping for compatibility)
MYSQL_ROOT_PASSWORD=Lionel@2
MYSQL_DATABASE=airbnb_db
MYSQL_USER=airbnb_user
MYSQL_PASSWORD=Lionel@2
DB_HOST=mysql
DB_PORT=3306

# Frontend Build Args
VITE_API_BASE=http://${EC2_IP}:3002/api

# AgentAI Configuration
FLASK_ENV=production
EOF

echo "✅ Created Backend/.env with EC2 IP: $EC2_IP"

# Update Frontend .env
echo ""
echo "🔧 Configuring Frontend..."

cat > ../Frontend/.env << EOF
# Frontend Production Environment
# Generated on $(date)

VITE_API_BASE=http://${EC2_IP}:3002/api
EOF

echo "✅ Created Frontend/.env"

# Create deployment instructions
cat > ../aws-deployment/YOUR_DEPLOYMENT_SETTINGS.txt << EOF
===========================================
YOUR AWS DEPLOYMENT SETTINGS
Generated on $(date)
===========================================

EC2 Public IP: ${EC2_IP}

📍 Access URLs (after deployment):
----------------------------------
Frontend:     http://${EC2_IP}:3000
Backend API:  http://${EC2_IP}:3002
Health Check: http://${EC2_IP}:3002/health
Adminer:      http://${EC2_IP}:8080
AgentAI:      http://${EC2_IP}:5001

🔐 Security Group Ports to Open:
--------------------------------
- 22   (SSH)
- 80   (HTTP)
- 443  (HTTPS)
- 3000 (Frontend)
- 3002 (Backend API)
- 5001 (AgentAI)
- 8080 (Adminer - optional, only for your IP)

⚠️  IMPORTANT: Before deploying to EC2
-----------------------------------
1. Update MONGODB_URI in Backend/.env with your actual Atlas credentials
2. Go to MongoDB Atlas → Network Access → Add IP: ${EC2_IP} (or 0.0.0.0/0 for testing)
3. Commit and push your code to GitHub
4. SSH into EC2 and clone your repository

📦 Deploy Command on EC2:
------------------------
cd ~/DATA-236-LAB-1/Backend
docker compose build
docker compose up -d

🧪 Test Command (from your laptop):
----------------------------------
Update JMeter HTTP Request Defaults:
- Server: ${EC2_IP}
- Port: 3002

Then run:
jmeter -n -t Airbnb_Performance_Test.jmx -l results/ec2_test.jtl -e -o results/ec2_report

EOF

echo "✅ Created deployment settings file"
echo ""
echo "=========================================="
echo "✅ Project Prepared for AWS Deployment!"
echo "=========================================="
echo ""
echo "📋 What was configured:"
echo "  ✓ Backend/.env with EC2 IP: $EC2_IP"
echo "  ✓ Frontend/.env with EC2 API URL"
echo "  ✓ Generated secure SESSION_SECRET and JWT_SECRET"
echo "  ✓ Created deployment settings reference"
echo ""
echo "⚠️  NEXT STEPS:"
echo "  1. Edit Backend/.env and update your MongoDB Atlas credentials"
echo "  2. Add EC2 IP to MongoDB Atlas whitelist"
echo "  3. Review aws-deployment/YOUR_DEPLOYMENT_SETTINGS.txt"
echo "  4. Commit and push to GitHub"
echo "  5. Follow aws-deployment/DEPLOYMENT_GUIDE.md"
echo ""
echo "🔍 Your deployment settings saved to:"
echo "   aws-deployment/YOUR_DEPLOYMENT_SETTINGS.txt"
echo ""
