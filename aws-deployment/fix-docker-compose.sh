#!/bin/bash

echo "🔧 Upgrading Docker Compose..."

# Remove old version
sudo rm /usr/local/bin/docker-compose

# Install latest version
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose version

echo "✅ Docker Compose upgraded"
echo ""
echo "Now run: cd ~/DATA-236-LAB-1/Backend && sudo docker-compose build"
