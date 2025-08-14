# NearChat Oracle Cloud Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the NearChat platform on Oracle Cloud Infrastructure (OCI) using the free tier, with Docker clustering for horizontal scaling.

## Prerequisites
- Oracle Cloud account (free tier)
- Basic knowledge of Linux commands
- Domain name (optional but recommended)

## Step 1: Oracle Cloud Setup

### 1.1 Create Oracle Cloud Account
1. Go to [Oracle Cloud](https://www.oracle.com/cloud/free/)
2. Sign up for a free account
3. Verify your email and complete the registration

### 1.2 Create Virtual Machine Instance

#### Instance Configuration:
- **Name**: `nearchat-server`
- **Image**: Canonical Ubuntu 22.04
- **Shape**: VM.Standard.A1.Flex (ARM-based, 4 OCPU, 24 GB RAM)
- **Network**: Create new VCN with public subnet
- **Public IP**: Yes

#### Security List Configuration:
Add the following ingress rules:
```
Source: 0.0.0.0/0, Port: 22 (SSH)
Source: 0.0.0.0/0, Port: 80 (HTTP)
Source: 0.0.0.0/0, Port: 443 (HTTPS)
Source: 0.0.0.0/0, Port: 3000 (NearChat Backend)
Source: 0.0.0.0/0, Port: 6379 (Redis)
Source: 0.0.0.0/0, Port: 27017 (MongoDB)
```

### 1.3 Connect to Instance
```bash
ssh ubuntu@<your-instance-public-ip>
```

## Step 2: Server Preparation

### 2.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 2.2 Install Docker
```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2.3 Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2.4 Install Node.js and PM2
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PM2 startup script
pm2 startup
```

### 2.5 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 3: Application Deployment

### 3.1 Clone Repository
```bash
cd /home/ubuntu
git clone <your-repository-url> nearchat
cd nearchat
```

### 3.2 Environment Configuration
```bash
# Create environment file
cp backend/.env.example backend/.env

# Edit environment variables
nano backend/.env
```

#### Required Environment Variables:
```bash
# Server Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com

# MongoDB Configuration (Use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nearchat

# Redis Configuration (Use Redis Cloud for production)
REDIS_URL=redis://username:password@redis-host:port

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here_make_it_long_and_random

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Admin Configuration (Hardcoded)
ADMIN_EMAIL=ghari2772@gmail.com
ADMIN_PASSWORD=hari143p

# AWS S3 Configuration (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nearchat-uploads

# AdMob Configuration
ADMOB_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
ADMOB_BANNER_AD_UNIT_ID=ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz
ADMOB_INTERSTITIAL_AD_UNIT_ID=ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww
ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-xxxxxxxxxxxxxxxx/vvvvvvvvvv
```

### 3.3 Build and Deploy Backend
```bash
cd backend

# Install dependencies
npm install

# Build Docker image
docker build -t nearchat-backend .

# Start with Docker Compose
docker-compose up -d
```

### 3.4 Deploy Flutter App
```bash
cd ../flutter_app

# Install Flutter dependencies
flutter pub get

# Build for Android
flutter build apk --release

# Build for iOS (requires macOS)
flutter build ios --release
```

### 3.5 Deploy Admin Panel
```bash
cd ../admin_panel

# Copy to Nginx directory
sudo cp -r * /var/www/html/admin/

# Set permissions
sudo chown -R www-data:www-data /var/www/html/admin/
sudo chmod -R 755 /var/www/html/admin/
```

## Step 4: Nginx Configuration

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/nearchat
```

#### Configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Admin Panel
    location /admin {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }

    # Static Files
    location /uploads {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

### 4.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/nearchat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: SSL Certificate

### 5.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 5.3 Auto-renewal
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 6: PM2 Process Management

### 6.1 Start Application with PM2
```bash
cd /home/ubuntu/nearchat/backend

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 6.2 PM2 Monitoring
```bash
# View processes
pm2 list

# Monitor resources
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart nearchat-backend
```

## Step 7: Database Setup

### 7.1 MongoDB Atlas (Recommended for Production)
1. Create MongoDB Atlas account
2. Create a new cluster
3. Configure network access (allow all IPs: 0.0.0.0/0)
4. Create database user
5. Get connection string and update MONGODB_URI

### 7.2 Redis Cloud (Recommended for Production)
1. Create Redis Cloud account
2. Create a new database
3. Configure network access
4. Get connection string and update REDIS_URL

### 7.3 Local Database (Development Only)
```bash
# Start MongoDB and Redis with Docker
docker-compose up -d mongo redis
```

## Step 8: Monitoring and Logging

### 8.1 Install Monitoring Tools
```bash
# Install htop for system monitoring
sudo apt install -y htop

# Install logrotate
sudo apt install -y logrotate
```

### 8.2 Configure Log Rotation
```bash
sudo nano /etc/logrotate.d/nearchat
```

#### Configuration:
```
/home/ubuntu/nearchat/backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 8.3 Setup Monitoring Scripts
```bash
# Create monitoring script
nano /home/ubuntu/monitor.sh
```

#### Script:
```bash
#!/bin/bash

# Check system resources
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)

# Check application health
APP_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

# Send alerts if thresholds exceeded
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "High CPU usage: ${CPU_USAGE}%" | mail -s "NearChat Alert" admin@your-domain.com
fi

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "High memory usage: ${MEMORY_USAGE}%" | mail -s "NearChat Alert" admin@your-domain.com
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "High disk usage: ${DISK_USAGE}%" | mail -s "NearChat Alert" admin@your-domain.com
fi

if [ "$APP_HEALTH" != "200" ]; then
    echo "Application health check failed: ${APP_HEALTH}" | mail -s "NearChat Alert" admin@your-domain.com
fi
```

```bash
chmod +x /home/ubuntu/monitor.sh

# Add to crontab
crontab -e
# Add this line:
*/5 * * * * /home/ubuntu/monitor.sh
```

## Step 9: Backup Strategy

### 9.1 Database Backup
```bash
# Create backup script
nano /home/ubuntu/backup.sh
```

#### Script:
```bash
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB (if local)
if [ -f /home/ubuntu/nearchat/backend/.env ]; then
    source /home/ubuntu/nearchat/backend/.env
    docker exec nearchat-mongo mongodump --out /dump
    docker cp nearchat-mongo:/dump $BACKUP_DIR/mongo_$DATE
fi

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/ubuntu/nearchat

# Clean old backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
```

```bash
chmod +x /home/ubuntu/backup.sh

# Add to crontab
crontab -e
# Add this line:
0 2 * * * /home/ubuntu/backup.sh
```

## Step 10: Scaling Configuration

### 10.1 Horizontal Scaling
```bash
# Create multiple instances
# Instance 1: nearchat-server-1
# Instance 2: nearchat-server-2
# Instance 3: nearchat-server-3

# Configure load balancer
# Use Oracle Cloud Load Balancer or Nginx upstream
```

### 10.2 Load Balancer Configuration
```nginx
upstream nearchat_backend {
    server nearchat-server-1:3000;
    server nearchat-server-2:3000;
    server nearchat-server-3:3000;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    location /api {
        proxy_pass http://nearchat_backend;
        # ... other proxy settings
    }
}
```

## Step 11: Security Hardening

### 11.1 Firewall Configuration
```bash
# Install UFW
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 11.2 Fail2ban Configuration
```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

### 11.3 Regular Security Updates
```bash
# Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Step 12: Performance Optimization

### 12.1 System Tuning
```bash
# Optimize kernel parameters
sudo nano /etc/sysctl.conf
```

#### Add these lines:
```
# Network optimization
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65000

# File system optimization
fs.file-max = 2097152
```

```bash
sudo sysctl -p
```

### 12.2 Application Optimization
```bash
# Increase file descriptors
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

## Step 13: Testing and Validation

### 13.1 Health Checks
```bash
# Test API endpoints
curl -X GET https://your-domain.com/health
curl -X GET https://your-domain.com/api/health

# Test WebSocket connection
wscat -c wss://your-domain.com/socket.io/
```

### 13.2 Load Testing
```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Run load test
ab -n 1000 -c 100 https://your-domain.com/health
```

### 13.3 Performance Monitoring
```bash
# Monitor system resources
htop
iotop
nethogs

# Monitor application logs
pm2 logs --lines 100
docker logs nearchat-backend
```

## Step 14: Maintenance

### 14.1 Regular Maintenance Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Clean up Docker
docker system prune -f

# Update PM2 processes
pm2 update
```

### 14.2 Monitoring Dashboard
Access the admin dashboard at: `https://your-domain.com/admin`

Login with:
- Email: `ghari2772@gmail.com`
- Password: `hari143p`

## Troubleshooting

### Common Issues:

1. **Port 3000 not accessible**
   - Check firewall settings
   - Verify Docker container is running
   - Check application logs

2. **Database connection issues**
   - Verify MongoDB/Redis connection strings
   - Check network connectivity
   - Verify credentials

3. **SSL certificate issues**
   - Renew certificates: `sudo certbot renew`
   - Check certificate validity: `sudo certbot certificates`

4. **High resource usage**
   - Monitor with `htop` and `pm2 monit`
   - Check for memory leaks
   - Optimize database queries

5. **Application crashes**
   - Check PM2 logs: `pm2 logs`
   - Check Docker logs: `docker logs nearchat-backend`
   - Restart services: `pm2 restart all`

## Support

For additional support:
1. Check application logs
2. Monitor system resources
3. Review this deployment guide
4. Contact system administrator

## Cost Optimization

Oracle Cloud Free Tier includes:
- 2 AMD-based Compute VMs
- 24 GB memory total
- 200 GB total storage
- 10 TB data transfer

For production scaling, consider:
- Upgrading to paid instances
- Using managed database services
- Implementing CDN for static assets
- Using object storage for file uploads