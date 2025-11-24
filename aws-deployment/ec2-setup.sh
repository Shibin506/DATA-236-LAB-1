#!/bin/bash
# EC2 Instance Setup Script for Airbnb Application
# Run this script after SSH-ing into your EC2 instance
# This script installs Docker, Docker Compose, and sets up the environment

set -e

echo "=========================================="
echo "🚀 Airbnb Application EC2 Setup"
echo "=========================================="

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📥 Installing Git..."
sudo yum install -y git

# Install monitoring tools
echo "📊 Installing monitoring tools..."
sudo yum install -y htop

# Enable Docker to start on boot
echo "⚙️  Configuring Docker to start on boot..."
sudo systemctl enable docker

# Create application directory
echo "📁 Creating application directory..."
mkdir -p ~/airbnb-app
cd ~/airbnb-app

echo ""
echo "=========================================="
echo "✅ EC2 Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Log out and log back in for Docker group changes to take effect"
echo "2. Clone your repository: git clone <your-repo-url>"
echo "3. Navigate to Backend directory and run docker-compose"
echo ""
