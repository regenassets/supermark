#!/bin/bash
set -e

DOMAIN="supermark.cc"
EMAIL="${LETSENCRYPT_EMAIL:-admin@supermark.cc}"

echo "Setting up SSL certificates for $DOMAIN..."

# Create temporary nginx config without SSL
cat > nginx/conf.d/supermark-temp.conf << NGINX_EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://supermark:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF

# Remove SSL config temporarily
mv nginx/conf.d/supermark.conf nginx/conf.d/supermark.conf.ssl 2>/dev/null || true

# Start nginx with HTTP only
echo "Starting nginx for certificate challenge..."
docker compose --profile with-nginx up -d nginx

# Wait for nginx to start
sleep 5

# Obtain certificate
echo "Requesting SSL certificate from Let's Encrypt..."
docker compose --profile with-nginx run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Restore SSL config
mv nginx/conf.d/supermark.conf.ssl nginx/conf.d/supermark.conf
rm nginx/conf.d/supermark-temp.conf

# Reload nginx with SSL
echo "Reloading nginx with SSL configuration..."
docker compose --profile with-nginx restart nginx

echo "SSL setup complete! Your site should now be available at https://$DOMAIN"
