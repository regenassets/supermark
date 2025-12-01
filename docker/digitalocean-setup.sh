#!/bin/bash
# =====================================
# Supermark DigitalOcean Setup Script
# =====================================
#
# This script automates the initial setup of Supermark on a DigitalOcean droplet.
# Run this script on a fresh Ubuntu 24.04 LTS server.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/regenassets/supermark/main/docker/digitalocean-setup.sh | bash
#
# Or manually:
#   chmod +x docker/digitalocean-setup.sh
#   ./docker/digitalocean-setup.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   Supermark DigitalOcean Setup       ║
║   Self-Hosted Document Sharing       ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    print_info "Create a non-root user first:"
    echo "  adduser supermark"
    echo "  usermod -aG sudo supermark"
    echo "  su - supermark"
    exit 1
fi

# Confirm before proceeding
print_warning "This script will:"
echo "  • Install Docker and Docker Compose"
echo "  • Configure firewall (UFW)"
echo "  • Clone Supermark repository"
echo "  • Generate secure passwords"
echo "  • Create production environment configuration"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Setup cancelled"
    exit 1
fi

# Get domain information
echo ""
print_info "Domain Configuration"
read -p "Enter your domain (e.g., supermark.yourdomain.com): " DOMAIN
read -p "Enter your email for SSL certificates: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    print_error "Domain and email are required"
    exit 1
fi

# Update system
print_info "Updating system packages..."
sudo apt update -qq
sudo apt upgrade -y -qq
print_success "System updated"

# Install Docker
print_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh > /dev/null
    sudo usermod -aG docker $USER
    rm /tmp/get-docker.sh
    print_success "Docker installed"
else
    print_warning "Docker already installed"
fi

# Install additional tools
print_info "Installing additional tools..."
sudo apt install -y -qq git curl wget openssl htop
print_success "Tools installed"

# Configure firewall
print_info "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
print_success "Firewall configured (ports 22, 80, 443 open)"

# Clone repository
print_info "Cloning Supermark repository..."
cd ~
if [ -d "supermark" ]; then
    print_warning "supermark directory exists, pulling latest changes..."
    cd supermark
    git pull origin main
else
    git clone https://github.com/regenassets/supermark.git
    cd supermark
fi
print_success "Repository ready"

# Generate secrets
print_info "Generating secure secrets..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DOCUMENT_PASSWORD_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 24)
print_success "Secrets generated"

# Create production environment file
print_info "Creating production environment file..."
cat > .env.production << ENVEOF
# ===================================
# SUPERMARK PRODUCTION ENVIRONMENT
# Generated: $(date)
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
MINIO_ENDPOINT=$DOMAIN

# -----------------
# URLs & Hosts
# -----------------
NEXTAUTH_URL=https://$DOMAIN
NEXT_PUBLIC_BASE_URL=https://$DOMAIN
NEXT_PUBLIC_MARKETING_URL=https://$DOMAIN
NEXT_PUBLIC_APP_BASE_HOST=$DOMAIN

# -----------------
# Optional Services
# -----------------
# Email (Resend) - Add your API key
RESEND_API_KEY=

# Google OAuth - Add your credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Analytics (Tinybird) - Leave empty to disable
# TINYBIRD_TOKEN=

# Background Jobs (Trigger.dev) - Leave empty to disable
# TRIGGER_SECRET_KEY=
# TRIGGER_API_URL=https://api.trigger.dev

ENVEOF
print_success "Environment file created: .env.production"

# Save credentials to file
CREDENTIALS_FILE=~/supermark-credentials.txt
cat > $CREDENTIALS_FILE << CREDEOF
====================================
SUPERMARK CREDENTIALS
Generated: $(date)
Domain: $DOMAIN
====================================

IMPORTANT: Save these credentials securely!
Delete this file after saving to a password manager.

Database Password:
$POSTGRES_PASSWORD

MinIO Password:
$MINIO_ROOT_PASSWORD

NextAuth Secret:
$NEXTAUTH_SECRET

Document Password Key:
$DOCUMENT_PASSWORD_KEY

====================================
MinIO Console Access:
URL: http://$(curl -s ifconfig.me):9001
Username: supermark
Password: $MINIO_ROOT_PASSWORD

====================================
Next Steps:
1. Add DNS A record: $DOMAIN → $(curl -s ifconfig.me)
2. Wait for DNS propagation (5-10 minutes)
3. Add Resend API key to .env.production (optional)
4. Run: cd ~/supermark && docker compose --env-file .env.production up -d
5. Get SSL certificate (see DIGITALOCEAN-DEPLOYMENT.md)

====================================
CREDEOF

chmod 600 $CREDENTIALS_FILE
print_success "Credentials saved to: $CREDENTIALS_FILE"

# Create Nginx configuration directories
print_info "Creating Nginx configuration directories..."
mkdir -p nginx/conf.d nginx/ssl nginx/certbot/conf nginx/certbot/www
print_success "Nginx directories created"

# Create Nginx main config
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

# Create site config (HTTP only for certbot)
cat > nginx/conf.d/supermark.conf << CONFEOF
server {
    listen 80;
    server_name $DOMAIN;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Proxy to Next.js app
    location / {
        proxy_pass http://supermark:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
CONFEOF

print_success "Nginx configuration created"

# Create SSL helper script
cat > ~/supermark/setup-ssl.sh << 'SSLEOF'
#!/bin/bash
# SSL Setup Helper Script

set -e

DOMAIN=$(grep NEXT_PUBLIC_APP_BASE_HOST .env.production | cut -d= -f2)
EMAIL=$1

if [ -z "$EMAIL" ]; then
    echo "Usage: ./setup-ssl.sh your-email@example.com"
    exit 1
fi

echo "Setting up SSL for $DOMAIN..."

# Get certificate
docker compose --env-file .env.production run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Update Nginx config with SSL
cat > nginx/conf.d/supermark.conf << CONFEOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://supermark:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
CONFEOF

# Reload Nginx
docker compose --env-file .env.production restart nginx

echo "✓ SSL configured! Visit https://$DOMAIN"
SSLEOF

chmod +x ~/supermark/setup-ssl.sh
print_success "SSL setup script created: ~/supermark/setup-ssl.sh"

# Setup automated backups
print_info "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd ~/supermark && ./docker/backup.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 0 find ~/supermark/backups -type d -mtime +28 -exec rm -rf {} +") | crontab -
print_success "Automated backups configured (daily at 2 AM)"

# Final summary
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Setup Complete!                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
print_info "Your server IP: $(curl -s ifconfig.me)"
print_info "Your domain: $DOMAIN"
echo ""
print_warning "IMPORTANT NEXT STEPS:"
echo ""
echo "1. Configure DNS:"
echo "   Add A record: $DOMAIN → $(curl -s ifconfig.me)"
echo "   Wait 5-10 minutes for propagation"
echo ""
echo "2. Optional: Add Resend API key to .env.production for emails"
echo "   Edit: nano ~/supermark/.env.production"
echo ""
echo "3. Start services:"
echo "   cd ~/supermark"
echo "   docker compose --env-file .env.production up -d"
echo ""
echo "4. Watch logs:"
echo "   docker compose --env-file .env.production logs -f"
echo ""
echo "5. Once services are running, enable Nginx with SSL:"
echo "   cd ~/supermark"
echo "   docker compose --env-file .env.production --profile with-nginx up -d nginx"
echo "   ./setup-ssl.sh $EMAIL"
echo ""
print_warning "SECURITY REMINDER:"
echo "  • Save credentials from: $CREDENTIALS_FILE"
echo "  • Delete credentials file after saving: rm $CREDENTIALS_FILE"
echo "  • Never commit .env.production to git"
echo ""
print_info "Full documentation: ~/supermark/DIGITALOCEAN-DEPLOYMENT.md"
print_info "Services documentation: ~/supermark/SERVICES.md"
echo ""
print_success "Happy sharing with Supermark! 🚀"
