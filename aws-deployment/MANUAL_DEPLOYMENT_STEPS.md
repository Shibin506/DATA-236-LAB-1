# 🚀 Manual EC2 Deployment Steps

## Step 1: Open a NEW Terminal Window

Open a **new Terminal window** on your Mac (separate from VS Code).

---

## Step 2: Connect to EC2

Copy and paste these commands one by one:

```bash
# Set key permissions
chmod 400 ~/Downloads/airbnb-key.pem

# Connect to EC2 (type 'yes' when asked)
ssh -i ~/Downloads/airbnb-key.pem ec2-user@54.177.241.123
```

---

## Step 3: Install Docker (on EC2)

Once connected, run these commands:

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker git
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## Step 4: Clone Repository

```bash
# Clone your repo
cd ~
git clone https://github.com/Shibin506/DATA-236-LAB-1.git
cd DATA-236-LAB-1
git checkout aws
```

---

## Step 5: Create .env File

```bash
cd Backend
nano .env
```

**Paste this content** (Ctrl+Shift+V or right-click paste):

```env
MONGODB_URI=mongodb+srv://sarveshwaghmare101_db_user:Z3WNwIKBCUVw390a@airbnb-main.d4apnix.mongodb.net/airbnb?retryWrites=true&w=majority&appName=airbnb-main
NODE_ENV=production
PORT=3001
SESSION_SECRET=your-super-secret-session-key-change-this
JWT_SECRET=your-super-secret-jwt-key-change-this
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
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Step 6: Create Frontend .env

```bash
cd ../Frontend
nano .env
```

**Paste:**
```
VITE_API_BASE=http://54.177.241.123:3002/api
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Step 7: Build and Deploy

```bash
cd ../Backend

# Build (takes 5-10 minutes)
sudo docker-compose build

# Start all services
sudo docker-compose up -d

# Check status
sudo docker-compose ps
```

---

## Step 8: Verify Deployment

```bash
# Check backend health
curl http://localhost:3002/health

# Check if all containers are running
sudo docker-compose ps
```

You should see all services "Up" and healthy!

---

## 🎉 Access Your Application

- **Frontend:** http://54.177.241.123:3000
- **Backend API:** http://54.177.241.123:3002
- **Kafka UI:** http://54.177.241.123:8090

---

## 🔧 Useful Commands

```bash
# View logs
sudo docker-compose logs -f backend

# Restart a service
sudo docker-compose restart backend

# Stop all services
sudo docker-compose down

# Rebuild and restart
sudo docker-compose up -d --build
```

---

## ⚠️ Important Note

After first setup, log out and log back in for Docker permissions:
```bash
exit
ssh -i ~/Downloads/airbnb-key.pem ec2-user@54.177.241.123
```

Then you won't need `sudo` for docker commands.
