# Trigger.dev Project Setup Guide

## Issue

When running `npm run trigger:deploy`, you get an error:
```
Project not found: proj_plmsfqvqunboixacjjus
```

This happens because the project ID in `trigger.config.ts` doesn't exist in your Trigger.dev account.

## Solution

You need to create a new Trigger.dev project and update the config file with your project ID.

### Step 1: Create New Trigger.dev Project

1. Visit https://cloud.trigger.dev/projects/new
2. Click "Create new project"
3. Name it: **Supermark** (or any name you prefer)
4. Copy the **Project Ref** (looks like `proj_xxxxxxxxxxxxx`)

### Step 2: Update trigger.config.ts

Edit the file `trigger.config.ts` and update line 6:

**Before:**
```typescript
export default defineConfig({
  project: "proj_plmsfqvqunboixacjjus",  // ← Old project ID
  dirs: ["./lib/trigger"],
```

**After:**
```typescript
export default defineConfig({
  project: "proj_YOUR_NEW_PROJECT_ID",  // ← Replace with your project ID
  dirs: ["./lib/trigger"],
```

### Step 3: Deploy Worker

```bash
# Run the deployment again
npm run trigger:deploy

# Follow the prompts - it should now succeed
```

### Step 4: Update Production Environment

Once deployment succeeds, add your Trigger.dev secret key to production:

```bash
# Edit .env.production
nano .env.production

# Add or update this line:
TRIGGER_SECRET_KEY=tr_prod_xxxxxxxxxxxxx  # Get from trigger.dev dashboard

# Restart the app
docker compose --env-file .env.production restart supermark
```

## Getting Your Keys

### Production Secret Key

1. Go to https://cloud.trigger.dev
2. Select your project
3. Go to **Settings** → **API Keys**
4. Copy the **Production** key (starts with `tr_prod_`)

### Finding Your Project Ref

If you forgot your project ref:

```bash
# List all your projects
npx trigger.dev@latest projects list

# Look for your Supermark project and copy the ref
```

## Node Version Warning

The warnings about Node v18.19.1 vs v18.20.0 are minor and won't prevent deployment. But if you want to upgrade:

```bash
# Upgrade to Node v18.20.0 or higher
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v18.20.0 or higher
```

## Quick Command Reference

```bash
# Create project: https://cloud.trigger.dev/projects/new

# Update trigger.config.ts with your project ref

# Deploy worker
npm run trigger:deploy

# Update .env.production with TRIGGER_SECRET_KEY

# Restart app
docker compose --env-file .env.production restart supermark

# Test by uploading a PDF and creating a link
```

## Troubleshooting

### "Authentication failed"

Make sure you're logged in:
```bash
npx trigger.dev@latest login
```

### "Project not found" after updating config

Double-check the project ref in trigger.config.ts matches exactly what's shown in your Trigger.dev dashboard.

### Deployment succeeds but tasks don't run

Ensure `TRIGGER_SECRET_KEY` in `.env.production` matches your production key from the dashboard.

## Next Steps After Deployment

1. Go to https://cloud.trigger.dev/projects/YOUR_PROJECT
2. Check the **Deployments** tab - you should see a successful deployment
3. Upload a PDF to your app
4. Create a link
5. You should now see processing progress instead of "waiting for worker"!

## Need Help?

If you're still stuck, share:
- The error message you're seeing
- Your project ref (from trigger.dev dashboard)
- Whether you've updated trigger.config.ts

I can help troubleshoot from there!
