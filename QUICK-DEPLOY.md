# Supermark DigitalOcean Quick Deploy

**TL;DR**: Get Supermark running on DigitalOcean in under 30 minutes.

## Prerequisites

- DigitalOcean account
- Domain name pointing to your server
- Email for SSL certificates

## One-Command Setup

SSH into a fresh Ubuntu 24.04 droplet and run:

```bash
curl -fsSL https://raw.githubusercontent.com/regenassets/supermark/main/docker/digitalocean-setup.sh | bash
```

Follow the prompts. Done! ✨

## Manual Quick Setup

### 1. Create Droplet

- **Image**: Ubuntu 24.04 LTS
- **Size**: $24/month (4GB RAM recommended)
- **Add your SSH key**

### 2. Initial Setup

```bash
# Connect
ssh root@YOUR_IP

# Create user
adduser supermark
usermod -aG sudo supermark
su - supermark

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Configure firewall
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw --force enable

# Clone repo
git clone https://github.com/regenassets/supermark.git
cd supermark
```

### 3. Configure Environment

```bash
# Copy template
cp .env.production.example .env.production

# Generate secrets
cat >> .env.production << EOF
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DOCUMENT_PASSWORD_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 24)
EOF

# Edit and set your domain
nano .env.production
# Update all instances of "yourdomain.com"
```

### 4. Deploy

```bash
# Start services
docker compose --env-file .env.production up -d

# Check status
docker compose ps
docker compose logs -f supermark
```

### 5. Setup SSL

```bash
# Create Nginx configs (see DIGITALOCEAN-DEPLOYMENT.md for full configs)
mkdir -p nginx/conf.d nginx/certbot/conf nginx/certbot/www

# Start Nginx
docker compose --env-file .env.production --profile with-nginx up -d nginx

# Get certificate
docker compose --env-file .env.production run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your@email.com \
  --agree-tos \
  -d your-domain.com

# Restart Nginx
docker compose --env-file .env.production restart nginx
```

### 6. Access Supermark

Visit `https://your-domain.com` and create your first account!

## DNS Configuration

Add these records at your DNS provider:

```
Type    Name              Value           TTL
A       supermark         YOUR_DROPLET_IP 3600
```

Wait 5-10 minutes for propagation.

## Minimum Recommended Configuration

```bash
# .env.production essentials
NEXTAUTH_SECRET=<generated>
DOCUMENT_PASSWORD_KEY=<generated>
POSTGRES_PASSWORD=<generated>
MINIO_ROOT_PASSWORD=<generated>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_MARKETING_URL=https://your-domain.com
NEXT_PUBLIC_APP_BASE_HOST=your-domain.com

# Optional but recommended
RESEND_API_KEY=<your-resend-key>  # For emails

# Leave these empty initially
TINYBIRD_TOKEN=                    # Analytics - add later
TRIGGER_SECRET_KEY=                # Background jobs - add later
```

## Common Commands

```bash
# View logs
docker compose --env-file .env.production logs -f

# Restart services
docker compose --env-file .env.production restart

# Stop services
docker compose --env-file .env.production down

# Update Supermark
git pull origin main
docker compose --env-file .env.production up -d --build

# Backup
./docker/backup.sh

# View service health
curl https://your-domain.com/api/health/services
```

## Troubleshooting

### Can't connect to domain

```bash
# Check DNS propagation
dig your-domain.com

# Check firewall
sudo ufw status

# Check Nginx
docker compose logs nginx
```

### Services won't start

```bash
# Check all service logs
docker compose logs

# Check specific service
docker compose logs postgres
docker compose logs supermark
docker compose logs minio

# Restart everything
docker compose down && docker compose up -d
```

### Database migration errors

```bash
# Enter container and run manually
docker compose exec supermark sh
npx prisma migrate deploy
```

### SSL certificate issues

```bash
# Make sure domain points to your IP
curl ifconfig.me  # Your server IP
dig your-domain.com  # Should match

# Try dry-run
docker compose run --rm certbot renew --dry-run
```

## Performance Tips

- **4GB RAM minimum** for production
- **Enable automated backups** (add to cron)
- **Use Cloudflare** for CDN (optional)
- **Add Resend** for reliable emails
- **Monitor disk space** (backups can grow)

## Security Checklist

- [ ] Firewall enabled (ports 22, 80, 443 only)
- [ ] Strong unique passwords in .env.production
- [ ] SSL/HTTPS working
- [ ] Automated SSL renewal configured
- [ ] Automated backups configured
- [ ] .env.production not in git

## What's Included

- ✅ PostgreSQL database (persistent)
- ✅ MinIO S3-compatible storage (persistent)
- ✅ Next.js application (auto-updating)
- ✅ Nginx reverse proxy with SSL
- ✅ Automatic database migrations
- ✅ Health checks and auto-restart
- ✅ Backup and restore scripts

## What's Not Included (Optional)

- ❌ Tinybird analytics (add later if needed)
- ❌ Trigger.dev background jobs (add later if needed)
- ❌ Redis caching (use Upstash if needed)
- ❌ Email (add Resend API key)

## Cost Estimate

- **Droplet**: $24/month (4GB RAM, 2 CPUs)
- **Backups**: $4.80/month (optional)
- **Resend**: Free tier (100 emails/day)
- **Domain**: ~$15/year (separate)

**Total**: ~$29/month for unlimited users and documents!

## Full Documentation

- [Complete Deployment Guide](./DIGITALOCEAN-DEPLOYMENT.md)
- [External Services Setup](./SERVICES.md)
- [Tinybird/Trigger.dev Workarounds](./TINYBIRD-TRIGGERDEV-WORKAROUNDS.md)
- [Docker Commands Reference](./docker/README.md)

## Support

- **GitHub Issues**: https://github.com/regenassets/supermark/issues
- **Discussions**: https://github.com/regenassets/supermark/discussions

---

**Ready to deploy?** Run the automated setup script:

```bash
curl -fsSL https://raw.githubusercontent.com/regenassets/supermark/main/docker/digitalocean-setup.sh | bash
```

🚀 **Happy sharing with Supermark!**
