# Trigger.dev Docker Environment Variable Fix

## Problem

After updating your `.env` file with the correct Trigger.dev production API key, you still get "Invalid API Key" errors and 500 errors when uploading documents or previewing files.

## Symptoms

1. **Docker logs show `TriggerApiError: Invalid API Key`**:
   ```
   supermark-app | TriggerApiError: Invalid API Key
   supermark-app |     at TriggerClient.request (...)
   ```

2. **500 Internal Server Error** when:
   - Uploading PDFs or images
   - Previewing documents
   - Any operation that uses Trigger.dev

3. **Environment variable mismatch**:
   ```bash
   # What's in .env file:
   $ grep TRIGGER_SECRET_KEY .env
   TRIGGER_SECRET_KEY=tr_prod_YOUR_KEY_HERE

   # What the Docker container sees:
   $ docker compose exec supermark env | grep TRIGGER_SECRET_KEY
   TRIGGER_SECRET_KEY=tr_prod_xxxxxxxxxxxxx
   ```

## Root Cause

**Docker containers don't automatically reload environment variables when you update `.env` files.**

When you:
1. Update `.env` with a new `TRIGGER_SECRET_KEY`
2. But don't restart the container
3. The running container still has the old/placeholder value in memory

This is a common Docker behavior - environment variables are loaded when the container starts, not when the `.env` file changes.

## Solution

### Step 1: Verify your `.env` file has the correct key

```bash
grep TRIGGER_SECRET_KEY .env
```

Expected output:
```
TRIGGER_SECRET_KEY=tr_prod_ACTUALKEY  # Should start with tr_prod_
```

If you see:
- `tr_dev_` - This is a development key, get the production key from Trigger.dev dashboard
- `tr_prod_xxxxxxxxxxxxx` - This is a placeholder, replace with your actual key
- Empty or commented out - Add your production key

### Step 2: Restart the Docker container

```bash
docker compose restart supermark
```

This forces Docker to reload all environment variables from `.env`.

### Step 3: Verify the container picked up the new key

```bash
docker compose exec supermark env | grep TRIGGER_SECRET_KEY
```

Expected output:
```
TRIGGER_SECRET_KEY=tr_prod_YOUR_KEY_HERE  # Should match .env
```

If it still shows the old value:
1. Check if you have a `.env.production` file that's overriding `.env`
2. Make sure you're editing the correct `.env` file
3. Try a full restart: `docker compose down && docker compose up -d`

### Step 4: Test document upload

1. Upload a PDF or image
2. Check the logs: `docker compose logs -f supermark`
3. You should no longer see "Invalid API Key" errors
4. Document processing should work correctly

## Prevention

**Always restart Docker containers after updating environment variables:**

```bash
# After editing .env
docker compose restart supermark

# Or if you're updating multiple services
docker compose restart

# For a complete rebuild (if you changed Dockerfile or dependencies)
docker compose down
docker compose up -d --build
```

## Related Issues

This same pattern applies to other environment variable changes:

- Updating database credentials
- Changing API URLs
- Modifying feature flags
- Any environment variable used by your app

**Remember:** `.env` file changes require a container restart to take effect.

## Quick Reference

```bash
# 1. Update .env with correct production key
nano .env  # or your preferred editor

# 2. Restart container to reload environment
docker compose restart supermark

# 3. Verify the key was loaded
docker compose exec supermark env | grep TRIGGER_SECRET_KEY

# 4. Check logs for errors
docker compose logs -f supermark

# 5. Test by uploading a document
```

## Development vs Production Keys

Make sure you're using the right key for your environment:

| Environment | Key Format | Where to Use |
|-------------|------------|--------------|
| Development | `tr_dev_` | Local development with `npm run trigger:dev` |
| Production | `tr_prod_` | Production Docker deployment |

**Common mistake:** Using a `tr_dev_` key in production. Development keys only work with local Trigger.dev workers, not the deployed cloud worker.

## Additional Notes

- This fix addresses the "Invalid API Key" error specifically
- If you still see "Waiting for worker to connect...", see `TRIGGER-DEPLOYMENT.md` for worker deployment
- If you see "Project not found", see `TRIGGER-PROJECT-SETUP.md` for project configuration
- Always use production keys (`tr_prod_`) in production environments
- Never commit API keys to git - keep them in `.env` files that are gitignored
