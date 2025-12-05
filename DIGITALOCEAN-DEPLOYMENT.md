# Supermark DigitalOcean Deployment Guide

Complete guide for deploying Supermark to DigitalOcean with Docker Compose, including SSL/HTTPS setup, domain configuration, and external service integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [DigitalOcean Droplet Setup](#digitalocean-droplet-setup)
3. [Server Initial Configuration](#server-initial-configuration)
4. [Install Docker and Dependencies](#install-docker-and-dependencies)
5. [Deploy Supermark](#deploy-supermark)
6. [Configure Domain and SSL](#configure-domain-and-ssl)
7. [Configure External Services](#configure-external-services)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **DigitalOcean Account** - Sign up at https://digitalocean.com
- **Domain Name** - A domain you own (e.g., `supermark.yourdomain.com`)
- **SSH Key** - For secure server access
- **GitHub Access** - To clone the Supermark repository

### External Services (Optional but Recommended)

For production deployment, you'll need:

- **Resend** (email) - https://resend.com - Free tier available
- **Cloudflare R2** (storage) - https://cloudflare.com/products/r2 - More cost-effective than AWS S3
  - *Alternative: Use included MinIO (self-hosted S3)*
- **Tinybird** (analytics) - https://tinybird.co - Optional
- **Trigger.dev** (background jobs) - https://trigger.dev - Optional

> **Note**: Supermark has had issues with Tinybird and Trigger.dev. This guide shows how to deploy without them, using MinIO for storage instead of external S3.

---

## DigitalOcean Droplet Setup

### Step 1: Create a Droplet

1. Log into DigitalOcean: https://cloud.digitalocean.com
2. Click **Create** → **Droplets**
3. Choose configuration:

   **Image**: Ubuntu 24.04 LTS x64

   **Droplet Size** (recommendations):
   - **Development/Testing**: Basic - $12/month (2 GB RAM, 1 CPU, 50 GB SSD)
   - **Small Production**: Basic - $18/month (2 GB RAM, 2 CPUs, 60 GB SSD)
   - **Medium Production**: Basic - $24/month (4 GB RAM, 2 CPUs, 80 GB SSD) ✅ **Recommended**
   - **Large Production**: Basic - $48/month (8 GB RAM, 4 CPUs, 160 GB SSD)

   **Datacenter Region**: Choose closest to your users

   **Authentication**: SSH Key (recommended) or password

   **Optional**: Enable automated backups ($4.80-$9.60/month)

4. Click **Create Droplet**
5. Note the droplet's IP address (e.g., `164.92.xxx.xxx`)

### Step 2: Configure DNS

Add DNS records at your domain registrar or DNS provider:

```
Type    Name                Value               TTL
A       supermark           164.92.xxx.xxx      3600
CNAME   www.supermark       supermark           3600
```

Wait 5-10 minutes for DNS propagation (check with `dig supermark.yourdomain.com`)

---

## Server Initial Configuration

### Step 1: Connect to Your Droplet

```bash
ssh root@164.92.xxx.xxx
```

### Step 2: Create Non-Root User

```bash
# Create user
adduser supermark
usermod -aG sudo supermark

# Copy SSH keys
rsync --archive --chown=supermark:supermark ~/.ssh /home/supermark

# Switch to new user
su - supermark
```

### Step 3: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Step 4: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Install Docker and Dependencies

### Step 1: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes
exit
ssh supermark@164.92.xxx.xxx

# Verify Docker installation
docker --version
docker compose version
```

### Step 2: Install Additional Tools

```bash
sudo apt install -y git curl wget nano htop
```

---

## Deploy Supermark

### Step 1: Clone Repository

```bash
cd ~
git clone https://github.com/regenassets/supermark.git
cd supermark
```

### Step 2: Create Production Environment File

```bash
# Copy template
cp .env.docker .env.production

# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DOCUMENT_PASSWORD_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 24)

# Create production .env file
cat > .env.production << ENVEOF
# ===================================
# SUPERMARK PRODUCTION ENVIRONMENT
# ===================================

# -----------------
# Required Secrets
# -----------------
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
DOCUMENT_PASSWORD_KEY=$DOCUMENT_PASSWORD_KEY

# -----------------
# Database
# -----------------
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# -----------------
# MinIO S3 Storage
# -----------------
MINIO_ROOT_USER=supermark
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD
MINIO_ENDPOINT=supermark.yourdomain.com

# -----------------
# URLs & Hosts (UPDATE THESE!)
# -----------------
NEXTAUTH_URL=https://supermark.yourdomain.com
NEXT_PUBLIC_BASE_URL=https://supermark.yourdomain.com
NEXT_PUBLIC_MARKETING_URL=https://supermark.yourdomain.com
NEXT_PUBLIC_APP_BASE_HOST=supermark.yourdomain.com

# -----------------
# Optional Services
# -----------------
# Email (Resend) - Add your API key
RESEND_API_KEY=

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Analytics (Tinybird) - Optional, leave empty to disable
# TINYBIRD_TOKEN=

# Background Jobs (Trigger.dev) - Optional, leave empty to disable
# TRIGGER_SECRET_KEY=
# TRIGGER_API_URL=https://api.trigger.dev

# Redis (Upstash) - Optional for rate limiting
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

ENVEOF

# IMPORTANT: Update the domain in .env.production
nano .env.production
# Replace all instances of "supermark.yourdomain.com" with your actual domain
```

**Save generated passwords** to a secure password manager!

### Step 3: Create Nginx Configuration Directory

```bash
mkdir -p nginx/conf.d
mkdir -p nginx/ssl
mkdir -p nginx/certbot/conf
mkdir -p nginx/certbot/www
```

### Step 4: Create Nginx Configuration

Create `nginx/nginx.conf`:

```bash
cat > nginx/nginx.conf << 'NGINXEOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
NGINXEOF
```

Create `nginx/conf.d/supermark.conf`:

```bash
cat > nginx/conf.d/supermark.conf << 'SITEEOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name supermark.yourdomain.com;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name supermark.yourdomain.com;

    # SSL Configuration (will be enabled after certbot)
    ssl_certificate /etc/letsencrypt/live/supermark.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/supermark.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js app
    location / {
        proxy_pass http://supermark:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
SITEEOF

# IMPORTANT: Update domain in the file
nano nginx/conf.d/supermark.conf
# Replace all instances of "supermark.yourdomain.com" with your actual domain
```

### Step 5: Start Services (HTTP Only First)

```bash
# Start without Nginx first (for initial setup)
docker compose --env-file .env.production up -d postgres minio minio-setup

# Wait for services to initialize
sleep 30

# Check services are running
docker compose ps

# Build and start Supermark app
docker compose --env-file .env.production up -d supermark

# View logs
docker compose logs -f supermark
```

Wait until you see "Ready" in the logs (Ctrl+C to exit)

### Step 6: Test HTTP Access

Visit `http://supermark.yourdomain.com:3000` (or `http://YOUR_IP:3000`)

You should see the Supermark login page. If not, check logs:
```bash
docker compose logs supermark
docker compose logs postgres
```

---

## Configure Domain and SSL

### Step 1: Start Nginx (HTTP Only for Certbot)

First, we need to get SSL certificates. Temporarily modify `nginx/conf.d/supermark.conf` to remove SSL:

```bash
# Backup original config
cp nginx/conf.d/supermark.conf nginx/conf.d/supermark.conf.backup

# Create temporary HTTP-only config
cat > nginx/conf.d/supermark.conf << 'HTTPEOF'
server {
    listen 80;
    server_name supermark.yourdomain.com;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Proxy to Next.js app
    location / {
        proxy_pass http://supermark:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
HTTPEOF

# Update domain
nano nginx/conf.d/supermark.conf
```

Start Nginx:

```bash
docker compose --env-file .env.production --profile with-nginx up -d nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Get SSL certificate
docker compose --env-file .env.production run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d supermark.yourdomain.com

# Restore full config with SSL
mv nginx/conf.d/supermark.conf.backup nginx/conf.d/supermark.conf

# Reload Nginx
docker compose --env-file .env.production restart nginx
```

### Step 3: Set Up Auto-Renewal

```bash
# Add to crontab
crontab -e

# Add this line (runs twice daily):
0 0,12 * * * cd ~/supermark && docker compose --env-file .env.production run --rm certbot renew && docker compose --env-file .env.production restart nginx
```

### Step 4: Test HTTPS

Visit `https://supermark.yourdomain.com` - you should see a secure connection!

---

## Configure External Services

### Resend (Email) - Recommended

1. Sign up at https://resend.com
2. Create API key
3. Add to `.env.production`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```
4. Update email domain in code if needed (see SERVICES.md)
5. Restart: `docker compose --env-file .env.production restart supermark`

### Cloudflare R2 (Optional - Alternative to MinIO)
### Cloudflare R2 (Recommended - Alternative to MinIO)

**Why R2 over MinIO?**
- No egress fees (downloads are free)
- No server resources needed
- Better global performance
- Automatic redundancy and backups
- Lower total cost for most use cases

For complete R2 setup instructions, see [R2_MIGRATION.md](./R2_MIGRATION.md)

#### Quick R2 Setup

1. **Create R2 Bucket**
   - Log into Cloudflare Dashboard
   - Navigate to R2
   - Click "Create bucket"
   - Name: `supermark-documents`
   - Location: Choose nearest region
   - Enable public access via R2.dev subdomain

2. **Generate API Credentials**
   - In R2, click "Manage R2 API Tokens"
   - Create new token with Object Read & Write
   - Save Access Key ID and Secret Access Key

3. **Update Environment Variables**
   
   Edit `/opt/supermark/.env.production` (or your env file):
   ```bash
   # Storage - Cloudflare R2
   NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
   NEXT_PRIVATE_UPLOAD_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
   NEXT_PRIVATE_UPLOAD_REGION=auto
   NEXT_PRIVATE_UPLOAD_BUCKET=supermark-documents
   NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=your_r2_access_key_id
   NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=your_r2_secret_access_key
   NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST=supermark-documents.r2.dev
   ```

4. **Remove MinIO from docker-compose** (optional)
   
   Since you're using R2, you can remove MinIO services:
   ```bash
   cd /opt/supermark
   # MinIO is now optional via profile - you can skip starting it
   docker compose --env-file .env.production up -d
   ```

5. **Migrate Existing Data** (if you have files in MinIO)
   ```bash
   # Set environment variables for migration
   export MINIO_ENDPOINT="http://localhost:9000"
   export MINIO_ACCESS_KEY="supermark"
   export MINIO_SECRET_KEY="your_minio_password"
   export MINIO_BUCKET="supermark-documents"
   
   export R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
   export R2_ACCESS_KEY="your_r2_access_key_id"
   export R2_SECRET_KEY="your_r2_secret_access_key"
   export R2_BUCKET="supermark-documents"
   
   # Run migration script
   node scripts/migrate-minio-to-r2.js
   ```

6. **Test and Restart**
   ```bash
   docker compose --env-file .env.production restart supermark
   docker compose --env-file .env.production logs -f supermark
   
   # Test upload/download through the UI
   ```

#### R2 Troubleshooting

**Downloads not working?**
- Verify `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST` is set to your R2.dev subdomain or custom domain
- Check R2 bucket has public access enabled
- Configure CORS in R2 bucket settings if needed

**Uploads failing?**
- Verify R2 API credentials are correct
- Check API token has Object Read & Write permissions
- Ensure bucket name matches `NEXT_PRIVATE_UPLOAD_BUCKET`


**Note**: There have been issues with these services. Leave them disabled unless you specifically need them.

See [SERVICES.md](./SERVICES.md) for detailed configuration if needed.

---

## Monitoring and Maintenance

### Check Service Health

```bash
# View all services
docker compose --env-file .env.production ps

# Check health endpoint
curl https://supermark.yourdomain.com/api/health
curl https://supermark.yourdomain.com/api/health/services
```

### View Logs

```bash
# All services
docker compose --env-file .env.production logs -f

# Specific service
docker compose --env-file .env.production logs -f supermark
docker compose --env-file .env.production logs -f postgres
docker compose --env-file .env.production logs -f nginx
```

### Backups

```bash
# Manual backup
./docker/backup.sh

# Automated daily backups (add to crontab)
crontab -e

# Add this line:
0 2 * * * cd ~/supermark && ./docker/backup.sh

# Cleanup old backups (keep 4 weeks)
0 3 * * 0 find ~/supermark/backups -type d -mtime +28 -exec rm -rf {} +
```

Backups are stored in `./backups/YYYYMMDD_HHMMSS/`

### Updates

```bash
# Backup first!
./docker/backup.sh

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose --env-file .env.production down
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production --profile with-nginx up -d
```

### Resource Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Check resource usage
htop                    # CPU and RAM
docker stats            # Container resource usage
df -h                   # Disk usage
sudo iotop              # Disk I/O
```

### MinIO Console Access

Access MinIO console at `http://YOUR_IP:9001` or configure subdomain:

- Username: `supermark`
- Password: (from `MINIO_ROOT_PASSWORD` in .env.production)

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose --env-file .env.production logs supermark

# Check database connection
docker compose --env-file .env.production exec postgres psql -U supermark -d supermark -c '\l'

# Restart services
docker compose --env-file .env.production restart
```

### Database Migration Issues

```bash
# Enter container
docker compose --env-file .env.production exec supermark sh

# Run migrations manually
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### SSL Certificate Issues

```bash
# Test certificate renewal
docker compose --env-file .env.production run --rm certbot renew --dry-run

# Check certificate expiry
openssl x509 -in nginx/certbot/conf/live/supermark.yourdomain.com/fullchain.pem -noout -dates

# Manually renew
docker compose --env-file .env.production run --rm certbot renew
docker compose --env-file .env.production restart nginx
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Clean up old logs
sudo journalctl --vacuum-time=7d
```

### High Memory Usage

```bash
# Check what's using memory
docker stats

# Restart heavy services
docker compose --env-file .env.production restart supermark postgres
```

### Can't Connect to MinIO/Storage

```bash
# Check MinIO is running
docker compose --env-file .env.production ps minio

# Check MinIO logs
docker compose --env-file .env.production logs minio

# Recreate MinIO bucket
docker compose --env-file .env.production up -d minio-setup
```

### Reset Everything

**WARNING: This deletes all data!**

```bash
# Stop and remove everything
docker compose --env-file .env.production down -v

# Remove data
sudo rm -rf backups/*
docker volume prune -f

# Start fresh
docker compose --env-file .env.production up -d
```

---

## Security Checklist

- [ ] Changed all default passwords in `.env.production`
- [ ] Enabled firewall (ufw) with only ports 22, 80, 443 open
- [ ] SSL/HTTPS configured and working
- [ ] Auto-renewal configured for SSL certificates
- [ ] Automated backups configured (cron job)
- [ ] Strong NEXTAUTH_SECRET (32+ characters)
- [ ] Strong database password
- [ ] MinIO accessible only via internal network (not exposed to internet)
- [ ] Regular updates scheduled
- [ ] Monitoring configured
- [ ] `.env.production` not committed to git

---

## Performance Optimization

### For High Traffic

1. **Increase Droplet Size**: Upgrade to 8GB+ RAM
2. **Add Managed Database**: Use DigitalOcean Managed PostgreSQL
3. **Use Cloudflare R2**: Better for high storage needs
4. **Enable CDN**: Put Cloudflare in front of your domain
5. **Add Redis**: Uncomment Redis in docker-compose.yml for caching

### Database Optimization

```bash
# Increase shared_buffers for better performance
docker compose --env-file .env.production exec postgres sh -c "echo 'shared_buffers = 256MB' >> /var/lib/postgresql/data/postgresql.conf"
docker compose --env-file .env.production restart postgres
```

---

## Support

- **Issues**: https://github.com/regenassets/supermark/issues
- **Discussions**: https://github.com/regenassets/supermark/discussions
- **Documentation**: [SERVICES.md](./SERVICES.md), [docker/README.md](./docker/README.md)

---

## Next Steps

After deployment:

1. Create your first admin user
2. Upload test documents
3. Configure team settings
4. Set up custom domain branding
5. Test email notifications (if Resend configured)
6. Review analytics (if Tinybird configured)
7. Configure automated backups
8. Set up monitoring alerts

**Congratulations! Supermark is now running in production on DigitalOcean!** 🎉
