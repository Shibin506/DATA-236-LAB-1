#!/bin/bash
# EC2 Connection and Setup Script
# Run this script to connect to your EC2 instance and deploy the application

EC2_IP="54.177.241.123"
KEY_FILE="$HOME/Downloads/airbnb-key.pem"

echo "=========================================="
echo "🚀 EC2 Deployment Script"
echo "=========================================="
echo ""

# Step 1: Set key permissions
echo "Step 1: Setting key file permissions..."
chmod 400 "$KEY_FILE"
echo "✅ Key permissions set"
echo ""

# Step 2: Connect to EC2
echo "Step 2: Connecting to EC2..."
echo "When prompted 'Are you sure you want to continue connecting?', type: yes"
echo ""
echo "Running: ssh -i $KEY_FILE ec2-user@$EC2_IP"
echo ""

# Connect
ssh -i "$KEY_FILE" ec2-user@$EC2_IP << 'ENDSSH'
echo ""
echo "=========================================="
echo "✅ Connected to EC2!"
echo "=========================================="
echo ""

# Step 3: Install Docker and dependencies
echo "Step 3: Installing Docker and dependencies..."
sudo yum update -y
sudo yum install -y docker git
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "✅ Docker and Docker Compose installed"
echo ""

# Step 4: Clone repository
echo "Step 4: Cloning repository..."
cd ~
if [ -d "DATA-236-LAB-1" ]; then
    echo "Repository already exists, updating..."
    cd DATA-236-LAB-1
    git pull origin aws
else
    git clone https://github.com/Shibin506/DATA-236-LAB-1.git
    cd DATA-236-LAB-1
fi
git checkout aws

echo "✅ Repository cloned"
echo ""

# Step 5: Setup environment variables
echo "Step 5: Setting up environment variables..."
cd Backend

# Create .env file with your settings
cat > .env << 'EOF'
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://sarveshwaghmare101_db_user:Z3WNwIKBCUVw390a@airbnb-main.d4apnix.mongodb.net/airbnb?retryWrites=true&w=majority&appName=airbnb-main

# Server Configuration
NODE_ENV=production
PORT=3001

# Session & JWT Secrets
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Frontend URL (EC2 Public IP)
FRONTEND_URL=http://54.177.241.123:3000
CORS_ORIGIN=http://54.177.241.123:3000
BACKEND_URL=http://54.177.241.123:3002

# Kafka Configuration
KAFKA_BROKERS=kafka:9093
KAFKA_CLIENT_ID=airbnb-backend
KAFKAJS_NO_PARTITIONER_WARNING=1

# Vite Frontend
VITE_API_BASE=http://54.177.241.123:3002/api

# MySQL (not used but kept for compatibility)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=Lionel@2
MYSQL_DATABASE=airbnb_db
MYSQL_USER=airbnb_user
MYSQL_PASSWORD=Lionel@2
EOF

echo "✅ Environment variables configured"
echo ""

# Step 6: Update Frontend .env
echo "Step 6: Updating Frontend configuration..."
cd ../Frontend
cat > .env << 'EOF'
VITE_API_BASE=http://54.177.241.123:3002/api
EOF

echo "✅ Frontend configured"
echo ""

# Step 7: Build and start services
echo "Step 7: Building and starting Docker containers..."
cd ../Backend

# Note: You need to log out and log back in for Docker group changes
# For now, we'll use sudo
echo "Building containers (this takes 5-10 minutes)..."
sudo docker-compose build

echo "Starting all services..."
sudo docker-compose up -d

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Your application is now running!"
echo ""
echo "Access URLs:"
echo "  Frontend:  http://54.177.241.123:3000"
echo "  Backend:   http://54.177.241.123:3002"
echo "  Kafka UI:  http://54.177.241.123:8090"
echo ""
echo "Check status: sudo docker-compose ps"
echo "View logs:    sudo docker-compose logs -f"
echo ""
echo "⚠️  IMPORTANT: Log out and log back in for Docker permissions:"
echo "  exit"
echo "  ssh -i ~/Downloads/airbnb-key.pem ec2-user@54.177.241.123"
echo ""

ENDSSH
