# Quick EC2 Deployment Checklist

## Before You Start
- [ ] AWS Account ready
- [ ] MongoDB Atlas connection string ready
- [ ] Code pushed to GitHub repository
- [ ] .pem key file downloaded and saved

## AWS Console Setup (15 minutes)
- [ ] Launch t3.large EC2 instance (Amazon Linux 2023)
- [ ] Create/attach security group with ports: 22, 80, 443, 3000, 3002
- [ ] Note down EC2 Public IP: `_________________`
- [ ] Connect via SSH: `ssh -i key.pem ec2-user@<IP>`

## EC2 Server Setup (10 minutes)
- [ ] Run ec2-setup.sh script
- [ ] Log out and back in
- [ ] Verify Docker: `docker --version`
- [ ] Clone repository: `git clone <repo-url>`

## Configuration (5 minutes)
- [ ] Copy `aws-deployment/.env.production` to `Backend/.env`
- [ ] Update MongoDB URI in .env
- [ ] Generate SESSION_SECRET: `openssl rand -base64 32`
- [ ] Generate JWT_SECRET: `openssl rand -base64 32`
- [ ] Replace `<EC2_PUBLIC_IP>` in .env with actual IP
- [ ] Update `Frontend/.env`: `VITE_API_BASE=http://<IP>:3002/api`
- [ ] Update `Backend/docker-compose.yml` frontend build args with EC2 IP

## Deployment (10 minutes)
- [ ] cd Backend
- [ ] Build: `docker compose build` (takes 5-8 minutes)
- [ ] Start: `docker compose up -d`
- [ ] Check: `docker compose ps` (all should be "Up")
- [ ] Test backend: `curl http://localhost:3002/health`
- [ ] Test frontend: `curl http://localhost:3000`

## Verification (5 minutes)
- [ ] Open browser: `http://<EC2_IP>:3000`
- [ ] Can you see the frontend? ✅
- [ ] Can you login? ✅
- [ ] Check backend logs: `docker compose logs backend --tail=50`

## JMeter Testing (10 minutes)
- [ ] Update JMeter test with EC2 IP
- [ ] Run test: `jmeter -n -t Airbnb_Performance_Test.jmx -l results/ec2.jtl -e -o results/ec2_report`
- [ ] Open report: `open results/ec2_report/index.html`
- [ ] Success rate > 95%? ✅

## MongoDB Atlas (Important!)
- [ ] Add EC2 IP to MongoDB Atlas IP Whitelist
  - Go to MongoDB Atlas → Network Access
  - Add IP Address: `<EC2_PUBLIC_IP>`
  - OR use `0.0.0.0/0` for testing (not recommended for production)

## Troubleshooting Commands
```bash
# Check all containers
docker compose ps

# View logs
docker compose logs -f

# Restart backend
docker compose restart backend

# Check system resources
htop

# Check MongoDB connection
docker compose exec backend node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(err => console.error('❌ Failed:', err.message))"
```

## URLs for Presentation
- Frontend: `http://<EC2_IP>:3000`
- Backend API: `http://<EC2_IP>:3002`
- Health Check: `http://<EC2_IP>:3002/health`
- Swagger Docs: `http://<EC2_IP>:3002/api-docs`

## Cost After Presentation
- Stop instance: Saves ~$1.50/day
- Terminate: Deletes everything, stops all charges

## Emergency Commands
```bash
# Stop all services
docker compose down

# Restart everything
docker compose up -d

# Clear and rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d
```
