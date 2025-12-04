# Trigger.dev Deployment Guide

## Problem

When you upload a PDF and create a link, the link shows "Waiting for worker to connect..." because Trigger.dev tasks are being created but there's no worker running to process them.

## Root Cause

**Trigger.dev v4 requires a separate worker deployment**. The codebase has been migrated to v4, but the worker hasn't been deployed to production yet.

## Solution Options

You have 3 options to fix this:

### Option 1: Deploy Trigger.dev Worker (Recommended if you need background jobs)

This option enables full document processing including PDF conversion, Office file conversion, and video optimization.

#### Prerequisites

1. **Trigger.dev Account**: Sign up at https://trigger.dev
2. **Project Created**: Create a new project in Trigger.dev dashboard
3. **API Key**: Get your production API key from the project settings

#### Steps to Deploy Worker

1. **Set environment variables locally** (for deployment only):

   ```bash
   # In your local machine (not on the server)
   export TRIGGER_SECRET_KEY=tr_prod_xxxxxxxxxxxxxxxxx  # Your production key from trigger.dev
   export TRIGGER_API_URL=https://api.trigger.dev
   ```

2. **Deploy the worker from your local machine**:

   ```bash
   cd /path/to/supermark
   npm run trigger:deploy
   ```

   This command will:
   - Build the Trigger.dev tasks
   - Upload them to Trigger.dev cloud
   - Start the worker automatically

3. **Verify deployment**:

   - Go to your Trigger.dev dashboard
   - Check that the deployment succeeded
   - You should see tasks like:
     - `convert-files-to-pdf`
     - `convert-pdf-to-image-route`
     - `convert-cad-to-pdf`
     - `convert-keynote-to-pdf`
     - `process-video`

4. **Update production environment**:

   The worker deployment is handled by Trigger.dev cloud, so you don't need to add anything to docker-compose.yml. Just ensure your `.env.production` has:

   ```bash
   TRIGGER_SECRET_KEY=tr_prod_xxxxxxxxxxxxxxxxx
   TRIGGER_API_URL=https://api.trigger.dev
   ```

5. **Restart your app** (if needed):

   ```bash
   docker compose --env-file .env.production restart supermark
   ```

#### Testing

1. Upload a PDF to your app
2. Create a link
3. The link should now show processing progress instead of "Waiting for worker to connect..."

---

### Option 2: Disable Trigger.dev (Quickest fix)

If you don't need background processing right now, you can disable Trigger.dev. PDF documents will still work, but without the background processing features.

#### Steps

1. **Edit `.env.production`**:

   ```bash
   # Comment out or remove the TRIGGER_SECRET_KEY
   TRIGGER_SECRET_KEY=
   TRIGGER_API_URL=https://api.trigger.dev
   ```

2. **Restart the app**:

   ```bash
   docker compose --env-file .env.production restart supermark
   ```

#### What This Changes

- ✅ PDF uploads still work (pages will be processed synchronously)
- ✅ Links will work immediately (no "waiting for worker" message)
- ❌ Office/CAD file conversions won't work
- ❌ Video optimization won't work
- ❌ No progress tracking for document processing

---

### Option 3: Use Alternative Background Job System (Future Enhancement)

For a self-hosted solution without Trigger.dev cloud dependency, you could implement BullMQ with Redis. This requires code changes.

**This is not implemented yet** - if you need this, consider:
1. Use Option 2 to disable Trigger.dev for now
2. Plan a migration to BullMQ later
3. See `TINYBIRD-TRIGGERDEV-WORKAROUNDS.md` for more details

---

## Recommended Approach

**For production deployment**, we recommend:

1. **Short term** (today): Use **Option 2** to disable Trigger.dev
   - Gets your app working immediately
   - No external dependencies
   - PDFs still work fine

2. **Medium term** (this week): Implement **Option 1** if you need advanced features
   - Deploy Trigger.dev worker
   - Enable Office/CAD file conversions
   - Better user experience with progress tracking

---

## Troubleshooting

### "Worker not connecting" after deployment

1. **Check Trigger.dev dashboard**:
   - Go to https://cloud.trigger.dev
   - Check your project's deployments
   - Ensure the worker is "Active"

2. **Verify environment variables**:
   ```bash
   docker compose --env-file .env.production exec supermark env | grep TRIGGER
   ```

   Should show:
   ```
   TRIGGER_SECRET_KEY=tr_prod_xxxxx
   TRIGGER_API_URL=https://api.trigger.dev
   ```

3. **Check logs**:
   ```bash
   docker compose --env-file .env.production logs supermark | grep -i trigger
   ```

### "Task not found" errors

This means the worker was deployed but the task definitions don't match. Redeploy:

```bash
npm run trigger:deploy
```

### "Authentication failed" errors

Your `TRIGGER_SECRET_KEY` doesn't match the deployed worker. Ensure you're using the **production** key from Trigger.dev dashboard.

---

## Additional Notes

### Development vs Production

- **Development**: Use `npm run trigger:dev` - starts a local worker
- **Production**: Use `npm run trigger:deploy` - deploys to Trigger.dev cloud

### Cost Considerations

- Trigger.dev has a free tier with generous limits
- For high volume, consider their paid plans or migrate to BullMQ
- See pricing: https://trigger.dev/pricing

### Security

- Never commit `TRIGGER_SECRET_KEY` to git
- Use production keys only in production
- Rotate keys if compromised

---

## Quick Reference

```bash
# Deploy worker to production
npm run trigger:deploy

# Check deployment status
# Visit: https://cloud.trigger.dev/projects/YOUR_PROJECT_ID

# Restart app after config changes
docker compose --env-file .env.production restart supermark

# View logs
docker compose --env-file .env.production logs -f supermark

# Disable Trigger.dev (quick method)
./toggle-trigger.sh disable
# Then restart: docker compose --env-file .env.production restart supermark

# Or manually edit .env.production
# Set: TRIGGER_SECRET_KEY=
# Then: docker compose --env-file .env.production restart supermark
```
