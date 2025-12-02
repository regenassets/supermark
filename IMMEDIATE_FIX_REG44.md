# IMMEDIATE FIX FOR REG-44: NextAuth Issue on Droplet

## Problem Summary

The production Supermark instance on `supermark.cc` is experiencing NextAuth authentication failures due to **duplicate environment variables** (`NEXTAUTH_SECRET` and `NEXTAUTH_URL` appearing twice in the container environment).

## Root Cause

When you run `docker compose exec supermark printenv | grep NEXTAUTH`, you see:

```
NEXTAUTH_SECRET=nC0a0o+9pd-----N+2eXGC4FEI=
NEXTAUTH_URL=http://supermark.cc
NEXTAUTH_SECRET=nC0a0o+9pdl2-----eXGC4FEI=
NEXTAUTH_URL=http://supermark.cc
```

This happens when environment variables are loaded from multiple sources (e.g., multiple `.env` files or shell environment variables conflicting with Docker Compose's variable substitution).

## Immediate Fix Steps

SSH into your DigitalOcean droplet and run these commands:

### 1. Check Current State

```bash
cd /home/supermark/supermark

# Check for multiple .env files
ls -la | grep "\.env"

# You might see something like:
# .env
# .env.local
# .env.production
# .env.docker
```

### 2. Backup Everything First

```bash
# Backup current environment files
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Backup database
./docker/backup.sh
```

### 3. Clean Up Environment Files

```bash
# Remove all .env files EXCEPT examples
# Be careful with this command!
rm -f .env .env.local .env.production

# Verify only example files remain
ls -la | grep "\.env"
# Should only show: .env.example, .env.docker, .env.production.example
```

### 4. Create Single Production .env File

```bash
# Copy the production example as your template
cp .env.production.example .env

# Edit the .env file with your actual values
# IMPORTANT: Use the values from your backup files!
nano .env
```

Make sure your `.env` file has:

```bash
# Required secrets (use your actual values from backups!)
NEXTAUTH_SECRET=nC0a0o+9pdl2-----eXGC4FEI=
DOCUMENT_PASSWORD_KEY=<your-key>
POSTGRES_PASSWORD=<your-password>
MINIO_ROOT_PASSWORD=<your-password>

# URLs - must match your domain
NEXTAUTH_URL=http://supermark.cc
NEXT_PUBLIC_BASE_URL=http://supermark.cc
NEXT_PUBLIC_MARKETING_URL=http://supermark.cc
NEXT_PUBLIC_APP_BASE_HOST=supermark.cc
MINIO_ENDPOINT=supermark.cc:9000

# Optional: Add your Resend API key if you have one
RESEND_API_KEY=<your-key-if-you-have-one>
```

**CRITICAL**: Make sure you use the SAME `NEXTAUTH_SECRET` that was working before! If users have active sessions, changing this will log them out.

### 5. Verify No Shell Environment Variables

```bash
# Check if NEXTAUTH variables are set in your shell
env | grep NEXTAUTH

# If you see any output, unset them:
unset NEXTAUTH_SECRET
unset NEXTAUTH_URL
```

### 6. Restart Docker Compose

```bash
# Stop services
docker compose down

# Verify configuration (should show each variable only ONCE)
docker compose config | grep -E "(NEXTAUTH_SECRET|NEXTAUTH_URL)" | head -4

# If you see duplicates, you still have multiple sources!
# Go back to step 3 and double-check

# Start services
docker compose up -d

# Watch logs
docker compose logs -f supermark
```

### 7. Verify the Fix

```bash
# Check environment variables inside container
docker compose exec supermark printenv | grep NEXTAUTH

# You should see EXACTLY:
# NEXTAUTH_SECRET=<your-secret>
# NEXTAUTH_URL=http://supermark.cc
#
# If you still see duplicates, something is wrong!
```

### 8. Test Authentication

Go to `http://supermark.cc/register` and try to log in. It should work now!

## Alternative: Use Validation Script

We've created a validation script to help detect these issues:

```bash
# Run validation script
./docker/validate-env.sh

# This will check for:
# - Multiple .env files
# - Duplicate environment variables
# - Misconfigured values
# - Running container issues
```

## If Issues Persist

1. **Check for system-wide environment variables:**
   ```bash
   # Check system environment
   sudo cat /etc/environment
   sudo ls -la /etc/profile.d/
   ```

2. **Check Docker Compose version:**
   ```bash
   docker compose version
   ```

3. **Check docker-compose.yml hasn't been modified:**
   ```bash
   git diff docker-compose.yml
   ```

4. **Full nuclear option (WARNING: Destroys all data!):**
   ```bash
   docker compose down -v
   rm .env
   cp .env.production.example .env
   # Edit .env with your values
   docker compose up -d --build
   ```

## Prevention

To prevent this in the future:

1. **Only use ONE `.env` file** in the project root
2. **Don't set NEXTAUTH_* in shell environment**
3. **Run `./docker/validate-env.sh` before deploying**
4. **Follow [docker/PRODUCTION_SETUP.md](docker/PRODUCTION_SETUP.md)** for all deployments

## Related Issues

- REG-43: Database migration issues (resolved)
- REG-44: NextAuth duplicate environment variables (this issue)

## Support

If you need help:
1. Run `./docker/validate-env.sh` and share the output
2. Share `docker compose config | grep NEXTAUTH`
3. Share `docker compose exec supermark printenv | grep NEXTAUTH`
