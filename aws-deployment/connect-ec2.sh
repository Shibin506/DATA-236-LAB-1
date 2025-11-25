#!/bin/bash
# Part 1: Run this on your LOCAL machine (Mac)
# This connects to EC2 and sets everything up

EC2_IP="54.177.241.123"
KEY_FILE="$HOME/Downloads/airbnb-key.pem"

echo "=========================================="
echo "🚀 EC2 Deployment - Part 1"
echo "=========================================="
echo ""

# Set key permissions
echo "Setting key permissions..."
chmod 400 "$KEY_FILE"
echo "✅ Key ready"
echo ""

echo "Connecting to EC2..."
echo "When prompted 'Are you sure you want to continue connecting?', type: yes"
echo ""

# This will connect and then you'll manually run the setup
ssh -i "$KEY_FILE" ec2-user@$EC2_IP
