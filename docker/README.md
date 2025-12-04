# Supermark Docker Setup

This directory contains scripts and configurations for self-hosting Supermark with Docker.

## Quick Start

Run the interactive quick-start script:

```bash
./docker/quick-start.sh
```

This script will:
1. Check Docker installation
2. Generate secure passwords and secrets
3. Create and configure `.env` file
4. Prompt for domain configuration
5. Start all services

## Directory Structure

```
docker/
├── README.md                 # This file
├── PRODUCTION_SETUP.md      # Production deployment guide
├── validate-env.sh          # Environment validation script
├── quick-start.sh           # Interactive setup script
├── backup.sh                # Database and storage backup script
├── restore.sh               # Restore from backup script
└── init-db.sh              # PostgreSQL initialization script
```

## Scripts

### validate-env.sh

**IMPORTANT**: Run this script to validate your environment configuration and detect common issues like duplicate environment variables that can cause NextAuth failures.

```bash
./docker/validate-env.sh
```

This script checks for:
- Presence of required .env file
- Conflicting or duplicate .env files
- Required environment variables
- Duplicate variables in docker-compose config
- Duplicate variables in running containers

**Always run this before deploying to production!**

### quick-start.sh

Interactive setup wizard that guides you through the initial configuration.

```bash
./docker/quick-start.sh
```

### backup.sh

Creates a timestamped backup of PostgreSQL database and MinIO storage.

```bash
./docker/backup.sh
```

Backups are stored in `./backups/YYYYMMDD_HHMMSS/`

### restore.sh

Restores PostgreSQL database and MinIO storage from a backup directory.

```bash
./docker/restore.sh ./backups/20250105_143000
```

**Warning**: This will overwrite existing data!

### init-db.sh

PostgreSQL initialization script that runs when the database is first created. Currently minimal, but can be extended with custom SQL scripts.

## Manual Setup

If you prefer manual setup over the quick-start script:

### 1. Create Environment File

```bash
cp .env.docker .env
```

### 2. Generate Secrets

```bash
# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DOCUMENT_PASSWORD_KEY=$(openssl rand -base64 32)
VERIFICATION_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 16)
REDIS_PASSWORD=$(openssl rand -base64 16)

# Update .env manually or with sed
sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEXTAUTH_SECRET|" .env
sed -i "s|DOCUMENT_PASSWORD_KEY=.*|DOCUMENT_PASSWORD_KEY=$DOCUMENT_PASSWORD_KEY|" .env
sed -i "s|VERIFICATION_SECRET=.*|VERIFICATION_SECRET=$VERIFICATION_SECRET|" .env
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
sed -i "s|MINIO_ROOT_PASSWORD=.*|MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD|" .env
sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|" .env
```

### 3. Update Domain Configuration

Edit `.env` and set:
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_MARKETING_URL`
- `NEXT_PUBLIC_APP_BASE_HOST`
- `MINIO_ENDPOINT`

### 4. Start Services

```bash
# Without Nginx (direct access on port 3000)
docker compose up -d

# With Nginx (for SSL/production)
docker compose --profile with-nginx up -d
```

## Common Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f supermark
docker compose logs -f postgres
docker compose logs -f minio
```

### Check Service Status

```bash
docker compose ps
```

### Restart Services

```bash
# All services
docker compose restart

# Specific service
docker compose restart supermark
```

### Stop Services

```bash
docker compose down
```

### Update Supermark

```bash
# Backup first
./docker/backup.sh

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Access Container Shell

```bash
# Supermark app
docker compose exec supermark sh

# PostgreSQL
docker compose exec postgres psql -U supermark supermark

# MinIO client
docker compose exec minio-setup sh
```

## Automated Backups

To schedule automatic backups, add to your crontab (`crontab -e`):

```cron
# Daily backup at 2 AM
0 2 * * * cd /path/to/supermark && ./docker/backup.sh

# Weekly cleanup - keep only last 4 weeks of backups
0 3 * * 0 find /path/to/supermark/backups -type d -mtime +28 -exec rm -rf {} +
```

## Production Deployment

For production deployments (especially to DigitalOcean Droplets or similar VPS), see the comprehensive production setup guide:

**[docker/PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)**

This guide covers:
- Avoiding environment variable duplication (critical for NextAuth)
- Production deployment checklist
- Troubleshooting duplicate environment variables
- Security best practices

## Troubleshooting

### NextAuth/Environment Variable Issues

If you encounter NextAuth errors or authentication failures, it's often due to duplicate or misconfigured environment variables.

**Run the validation script first:**
```bash
./docker/validate-env.sh
```

Common issues:
- Duplicate `NEXTAUTH_SECRET` or `NEXTAUTH_URL` in container environment
- Multiple `.env` files in the project root
- Incorrect `NEXTAUTH_URL` (must match your domain exactly)

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md#troubleshooting) for detailed troubleshooting steps.

### Permission Issues

If you encounter permission issues with volumes:

```bash
# Fix ownership
sudo chown -R $USER:$USER ./nginx
docker compose down
docker volume rm supermark_postgres_data supermark_minio_data supermark_redis_data
docker compose up -d
```

### Reset Everything

To completely reset (WARNING: deletes all data):

```bash
docker compose down -v
rm .env
./docker/quick-start.sh
```

### Database Migration Issues

If migrations fail:

```bash
# Enter container
docker compose exec supermark sh

# Run migrations manually
npx prisma migrate deploy

# Or reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Security Notes

1. **Never commit `.env` to version control**
2. **Change default passwords** in production
3. **Use strong secrets** (32+ characters)
4. **Enable SSL/HTTPS** for production
5. **Restrict port access** - only expose 80/443
6. **Regular backups** - automate with cron
7. **Keep updated** - regularly update Docker images

## Support

For detailed documentation, see [SELF_HOSTING.md](../SELF_HOSTING.md)

For issues, visit: https://github.com/regenassets/supermark/issues
