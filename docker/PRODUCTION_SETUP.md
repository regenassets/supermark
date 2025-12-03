# Supermark Production Setup Guide

## Critical: Avoiding Environment Variable Duplication

When deploying to production, it's critical to avoid environment variable duplication which can cause NextAuth and other services to fail.

### The Issue

Docker Compose automatically loads environment variables from a `.env` file in the same directory as `docker-compose.yml`. If you have multiple `.env` files or conflicting environment variable sources, variables may be duplicated, causing authentication and other services to fail.

### The Solution

**On your production server, you should have EXACTLY ONE `.env` file** in the root directory where `docker-compose.yml` is located.

## Production Deployment Checklist

### 1. Clean Up Existing Environment Files

```bash
# SSH into your droplet
cd /home/supermark/supermark

# Check for multiple .env files
ls -la | grep "\.env"

# You should see ONLY:
# - .env (your production environment file)
# - .env.example (the example file, safe to keep)
# - .env.docker (example, safe to keep)
# - .env.production.example (example, safe to keep)

# Remove the main .env file if it exists and has incorrect values
# rm .env  # Only do this if you're sure you have backups!
```

### 2. Create Your Production Environment File

```bash
# Copy the production example as a template
cp .env.production.example .env

# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DOCUMENT_PASSWORD_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 24)

# Update the .env file with your secrets
sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEXTAUTH_SECRET|" .env
sed -i "s|DOCUMENT_PASSWORD_KEY=.*|DOCUMENT_PASSWORD_KEY=$DOCUMENT_PASSWORD_KEY|" .env
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
sed -i "s|MINIO_ROOT_PASSWORD=.*|MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD|" .env

# Update URLs for your domain
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://supermark.cc|" .env
sed -i "s|NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=http://supermark.cc|" .env
sed -i "s|NEXT_PUBLIC_MARKETING_URL=.*|NEXT_PUBLIC_MARKETING_URL=http://supermark.cc|" .env
sed -i "s|NEXT_PUBLIC_APP_BASE_HOST=.*|NEXT_PUBLIC_APP_BASE_HOST=supermark.cc|" .env
sed -i "s|MINIO_ENDPOINT=.*|MINIO_ENDPOINT=supermark.cc:9000|" .env
```

### 3. Verify Environment Variables

Before starting the services, verify that environment variables will be loaded correctly:

```bash
# Verify .env file contents
cat .env | grep -E "(NEXTAUTH_SECRET|NEXTAUTH_URL|POSTGRES_PASSWORD)"

# Test docker-compose environment variable substitution
docker compose config | grep -E "(NEXTAUTH_SECRET|NEXTAUTH_URL)" | head -4

# You should see each variable EXACTLY ONCE in the output
# If you see duplicates, you have multiple .env files or conflicting sources
```

### 4. Deploy the Application

```bash
# Stop any running containers
docker compose down

# Remove old containers and images to ensure clean deployment
docker compose down -v  # WARNING: This deletes volumes/data!
# OR keep your data:
docker compose down

# Pull latest code if needed
git pull origin main

# Build and start services
docker compose up -d --build

# Watch logs to ensure successful startup
docker compose logs -f supermark
```

### 5. Verify Environment Inside Container

After the container starts, verify that environment variables are set correctly:

```bash
# Check environment variables inside the container
docker compose exec supermark printenv | grep NEXTAUTH

# You should see:
# NEXTAUTH_SECRET=<your-secret>
# NEXTAUTH_URL=http://supermark.cc
#
# If you see DUPLICATE entries like:
# NEXTAUTH_SECRET=<value1>
# NEXTAUTH_URL=http://supermark.cc
# NEXTAUTH_SECRET=<value2>
# NEXTAUTH_URL=http://supermark.cc
#
# Then you have multiple .env files or conflicting environment sources!
```

## Troubleshooting

### Duplicate Environment Variables

If you see duplicate environment variables:

1. **Check for multiple .env files:**
   ```bash
   ls -la | grep "\.env"
   find . -name ".env*" -type f
   ```

2. **Check if environment variables are set in your shell:**
   ```bash
   env | grep NEXTAUTH
   ```

3. **Remove duplicate sources:**
   - Keep ONLY the main `.env` file
   - Remove any `.env.local`, `.env.production`, or other variants
   - Unset shell environment variables: `unset NEXTAUTH_SECRET NEXTAUTH_URL`

4. **Restart Docker Compose:**
   ```bash
   docker compose down
   docker compose up -d
   ```

### NextAuth Errors

If you get NextAuth errors like "adapter_error" or authentication failures:

1. **Verify NEXTAUTH_SECRET is set and unique:**
   ```bash
   docker compose exec supermark printenv | grep NEXTAUTH_SECRET
   ```

2. **Check NEXTAUTH_URL matches your domain:**
   ```bash
   docker compose exec supermark printenv | grep NEXTAUTH_URL
   ```

3. **Ensure the database is properly migrated:**
   ```bash
   docker compose exec supermark sh -c "cd /app && node_modules/.bin/prisma migrate deploy"
   ```

4. **Check Prisma database connection:**
   ```bash
   docker compose logs postgres
   docker compose exec supermark printenv | grep POSTGRES
   ```

### Database Migration Issues

If you encounter database migration issues (as seen in REG-43):

1. **Verify Prisma schema location:**
   ```bash
   docker compose exec supermark ls -la /app/prisma/schema/
   ```

2. **Run migrations manually:**
   ```bash
   docker compose exec supermark sh -c "cd /app && node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema"
   ```

3. **Check database tables:**
   ```bash
   docker compose exec postgres psql -U supermark -d supermark -c "\dt"
   ```

## Security Best Practices

1. **Never commit `.env` to version control**
2. **Use strong, unique secrets** (32+ characters)
3. **Change default passwords** immediately
4. **Enable HTTPS/SSL** for production (use nginx with Let's Encrypt)
5. **Restrict port access** via firewall
6. **Regular backups** using `./docker/backup.sh`
7. **Keep Docker images updated**

## Support

For issues, visit: https://github.com/regenassets/supermark/issues
