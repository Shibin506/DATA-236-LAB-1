#!/bin/bash

echo "=========================================="
echo "🚀 EC2 Setup Script"
echo "=========================================="
echo ""

# Install Docker and dependencies
echo "📦 Installing Docker and dependencies..."
sudo yum update -y
sudo yum install -y docker git
sudo service docker start
sudo usermod -a -G docker ec2-user

echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "✅ Docker installed"
docker --version
docker-compose --version
echo ""

# Clone repository
echo "📥 Cloning repository..."
cd ~
if [ -d "DATA-236-LAB-1" ]; then
    echo "Repository exists, pulling latest..."
    cd DATA-236-LAB-1
    git pull origin aws
else
    git clone https://github.com/Shibin506/DATA-236-LAB-1.git
    cd DATA-236-LAB-1
fi
git checkout aws
echo "✅ Repository ready"
echo ""

# Create Backend .env
echo "⚙️ Creating Backend environment file..."
cd ~/DATA-236-LAB-1/Backend
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://sarveshwaghmare101_db_user:Z3WNwIKBCUVw390a@airbnb-main.d4apnix.mongodb.net/airbnb?retryWrites=true&w=majority&appName=airbnb-main
NODE_ENV=production
PORT=3001
SESSION_SECRET=ec2-super-secret-session-key-$(openssl rand -hex 16)
JWT_SECRET=ec2-super-secret-jwt-key-$(openssl rand -hex 16)
FRONTEND_URL=http://54.177.241.123:3000
CORS_ORIGIN=http://54.177.241.123:3000
BACKEND_URL=http://54.177.241.123:3002
KAFKA_BROKERS=kafka:9093
KAFKA_CLIENT_ID=airbnb-backend
KAFKAJS_NO_PARTITIONER_WARNING=1
VITE_API_BASE=http://54.177.241.123:3002/api
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=Lionel@2
MYSQL_DATABASE=airbnb_db
MYSQL_USER=airbnb_user
MYSQL_PASSWORD=Lionel@2
EOF
echo "✅ Backend .env created"
echo ""

# Create Frontend .env
echo "⚙️ Creating Frontend environment file..."
cd ~/DATA-236-LAB-1/Frontend
cat > .env << 'EOF'
VITE_API_BASE=http://54.177.241.123:3002/api
EOF
echo "✅ Frontend .env created"
echo ""

# Build and start services
echo "🔨 Building Docker containers (this takes 5-10 minutes)..."
cd ~/DATA-236-LAB-1/Backend
sudo docker-compose build
echo ""

echo "🚀 Starting all services..."
sudo docker-compose up -d
echo ""

echo "⏳ Waiting for services to start..."
sleep 10
echo ""

echo "📊 Checking service status..."
sudo docker-compose ps
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 Your application URLs:"
echo "  Frontend:  http://54.177.241.123:3000"
echo "  Backend:   http://54.177.241.123:3002/health"
echo "  Kafka UI:  http://54.177.241.123:8090"
echo ""
echo "📝 Useful commands:"
echo "  Check status:  sudo docker-compose ps"
echo "  View logs:     sudo docker-compose logs -f backend"
echo "  Restart:       sudo docker-compose restart backend"
echo ""
echo "⚠️ To avoid using sudo, log out and back in:"
echo "  exit"
echo "  ssh -i ~/Downloads/airbnb-key.pem ec2-user@54.177.241.123"
echo ""
