# Tinybird Setup Guide for Supermark

This guide will help you properly configure Tinybird analytics for your Supermark deployment.

## Prerequisites

1. A Tinybird account (sign up at https://tinybird.co)
2. Node.js and npm installed locally
3. Access to your Supermark repository

## Step 1: Install Tinybird CLI

```bash
npm install -g @tinybirdco/cli
```

## Step 2: Authenticate with Tinybird

```bash
cd /Users/autopoietik/.cyrus/repos/supermark
tb auth
```

This will open a browser window for authentication. Follow the prompts to log in.

## Step 3: Create a Workspace

If you don't have a workspace yet:

```bash
tb workspace create supermark-analytics
tb workspace use supermark-analytics
```

## Step 4: Push Datasources

```bash
cd lib/tinybird
tb push datasources/*.datasource --force
```

This will create the following datasources:
- `page_views` - Document page view tracking
- `video_views` - Video analytics
- `click_events` - Click tracking within documents
- `pm_click_events` - Link view tracking
- `webhook_events` - Webhook event logging

## Step 5: Push Endpoints (Pipes)

```bash
tb push endpoints/*.pipe --force
```

This will create analytics query endpoints for:
- Page duration calculations
- User agent tracking
- Document/link/viewer analytics
- Video and click event queries

## Step 6: Create API Token

Create a token with the correct permissions:

```bash
tb token create supermark-production \
  --permissions "DATASOURCES:READ,DATASOURCES:APPEND,PIPES:READ"
```

**Important**: Use `DATASOURCES:APPEND` (not `WRITE`) to prevent permission issues.

Copy the generated token (starts with `p.eyJ...`).

## Step 7: Update Environment Variables

Add the token to your `.env.docker` file:

```bash
# In /Users/autopoietik/.cyrus/repos/supermark/.env.docker
TINYBIRD_TOKEN=p.eyJ1IjogIj...YOUR_TOKEN_HERE
```

## Step 8: Restart Services

```bash
cd /Users/autopoietik/.cyrus/repos/supermark
docker compose down
docker compose up -d
```

## Step 9: Verify Analytics

Test that analytics are working:

1. Visit your Supermark instance
2. View a document
3. Check Tinybird dashboard at https://ui.tinybird.co
4. Query the `page_views` datasource to see if events are being recorded

Or test via API:

```bash
curl -H "Authorization: Bearer ${TINYBIRD_TOKEN}" \
     "https://api.tinybird.co/v0/pipes/get_total_document_duration.json?documentId=YOUR_DOC_ID&excludedLinkIds=&excludedViewIds=&since=0"
```

## Troubleshooting

### Error: "Permission denied"

Make sure your token has `DATASOURCES:APPEND` permission (not `WRITE`).

### Error: "Datasource already exists"

Use the `--force` flag when pushing:
```bash
tb push datasources/*.datasource --force
```

### Error: "Connection timeout"

This may happen from within Docker. Push datasources from your local machine, not from inside the Docker container.

### Analytics not showing up

1. Check that `TINYBIRD_TOKEN` is set in your environment
2. Check Docker logs:
   ```bash
   docker compose logs supermark | grep -i tinybird
   ```
3. Verify the token has the correct permissions
4. Check Tinybird dashboard for ingestion errors

## Alternative: Disable Tinybird

If you don't need analytics or encounter issues, you can disable Tinybird:

```bash
# In .env.docker, leave TINYBIRD_TOKEN empty:
TINYBIRD_TOKEN=
```

The application will continue to work without analytics. The code now gracefully handles missing Tinybird configuration and will log that analytics are disabled.

## Production Deployment

For production deployments:

1. **Use a separate workspace** for production
2. **Create a separate token** with production permissions
3. **Monitor ingestion** via Tinybird dashboard
4. **Set up alerts** for ingestion failures
5. **Review retention policies** to manage data storage costs

## Cost Considerations

Tinybird charges based on:
- Data ingested (MB/month)
- Data stored (GB/month)  
- API requests

For a typical Supermark deployment:
- Free tier: Up to 10GB ingested/month
- Paid plans start at $99/month for higher volumes

Monitor your usage in the Tinybird dashboard.

## Security Notes

- **Never commit** the `TINYBIRD_TOKEN` to git
- **Rotate tokens** periodically
- **Use separate tokens** for dev/staging/production
- **Limit permissions** to only what's needed (`APPEND`, not `WRITE`)

## Support

For issues specific to Tinybird:
- Tinybird Docs: https://www.tinybird.co/docs
- Tinybird Community: https://www.tinybird.co/community

For Supermark integration issues:
- GitHub Issues: https://github.com/regenassets/supermark/issues
- See also: `TINYBIRD-TRIGGERDEV-WORKAROUNDS.md`
