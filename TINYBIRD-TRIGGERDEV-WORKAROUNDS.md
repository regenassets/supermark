# Tinybird and Trigger.dev Configuration for Docker Deployment

This document addresses the known issues with Tinybird and Trigger.dev when deploying Supermark via Docker, and provides workarounds.

## Overview of Issues

Based on the mention from @ishan, there have been "serious issues with tinybird and with trigger.dev" in the current setup. Deploying to DigitalOcean with Docker may resolve these issues.

## Tinybird (Analytics)

### What Tinybird Does

Tinybird powers Supermark's analytics features:
- Document page view tracking
- Video analytics (play, pause, seek events)
- Click event tracking
- User agent and geolocation data
- Analytics dashboards

### Known Issues

1. **Permission errors** when pushing datasources
2. **Version suffix conflicts** in datasource names
3. **Connection timeout** issues from Docker containers
4. **Token permission** mismatches

### Recommended Configuration for Docker

#### Option 1: Disable Tinybird (Recommended for Initial Setup)

Simply leave the `TINYBIRD_TOKEN` empty in your `.env.production`:

```bash
# Analytics (Tinybird) - Leave empty to disable
TINYBIRD_TOKEN=
```

**Impact**: Analytics features will be disabled, but all core document sharing functionality works fine.

#### Option 2: Use Tinybird Cloud (If Analytics Required)

If you need analytics:

1. **Sign up** at https://tinybird.co
2. **Create workspace**
3. **Push datasources** from your local machine (not from Docker):
   ```bash
   cd lib/tinybird
   tb auth
   tb push datasources/*
   tb push endpoints/get_*
   ```
4. **Get token** with these permissions:
   - `DATASOURCES:READ`
   - `DATASOURCES:APPEND` (NOT WRITE)
   - `PIPES:READ`
5. **Add token** to `.env.production`:
   ```bash
   TINYBIRD_TOKEN=p.eyJ1IjogIj...
   ```

#### Option 3: Alternative Analytics Solutions

Consider these alternatives that work better with self-hosted setups:

1. **Umami Analytics** - Open source, self-hosted
   - Add as Docker service to docker-compose.yml
   - Lightweight and privacy-focused

2. **Plausible Analytics** - Open source alternative
   - Self-hosted or cloud
   - GDPR compliant

3. **PostHog** - Product analytics platform
   - Self-hosted option available
   - More features than Tinybird

### Troubleshooting Tinybird

If you encounter issues with Tinybird:

```bash
# Check if Tinybird is causing errors
docker compose --env-file .env.production logs supermark | grep -i tinybird

# Test Tinybird connection
curl -H "Authorization: Bearer ${TINYBIRD_TOKEN}" \
     https://api.tinybird.co/v0/pipes

# Disable Tinybird temporarily
# Edit .env.production and comment out TINYBIRD_TOKEN
docker compose --env-file .env.production restart supermark
```

---

## Trigger.dev (Background Jobs)

### What Trigger.dev Does

Trigger.dev handles background processing:
- PDF document conversion
- Document preview generation
- Video processing
- Bulk operations
- Async export generation

### Known Issues

1. **v3 to v4 migration** complications
2. **Worker connection** issues from Docker
3. **Task execution** timing out
4. **Environment variable** loading problems
5. **AI SDK compatibility** conflicts

### Recommended Configuration for Docker

#### Option 1: Disable Trigger.dev (Recommended for Initial Setup)

Leave `TRIGGER_SECRET_KEY` empty in `.env.production`:

```bash
# Background Jobs (Trigger.dev) - Leave empty to disable
TRIGGER_SECRET_KEY=
TRIGGER_API_URL=https://api.trigger.dev
```

**Impact**:
- Document uploads still work
- PDF processing may be slower (synchronous)
- Some features may be limited

#### Option 2: Use Trigger.dev Cloud (If Background Jobs Required)

If you need background job processing:

1. **Sign up** at https://trigger.dev
2. **Create project**
3. **Get API key** from dashboard
4. **Configure** `.env.production`:
   ```bash
   TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxx
   TRIGGER_API_URL=https://api.trigger.dev
   ```
5. **Deploy trigger** from your local machine:
   ```bash
   npx trigger.dev@3 deploy
   ```

**Note**: The codebase has been migrated to Trigger.dev v4, but there may still be import path issues.

#### Option 3: Alternative Background Job Solutions

Consider these alternatives for better self-hosted support:

1. **BullMQ** with Redis
   - Add Redis to docker-compose.yml
   - Implement job processing with BullMQ
   - Full control over job execution

2. **Upstash QStash**
   - Serverless queueing
   - HTTP-based (works well with Docker)
   - Configure with QSTASH_TOKEN

3. **Celery** (if you add Python worker)
   - Robust task queue
   - Redis or RabbitMQ backend
   - Production-proven

### Troubleshooting Trigger.dev

If you encounter Trigger.dev issues:

```bash
# Check Trigger.dev logs
docker compose --env-file .env.production logs supermark | grep -i trigger

# Test Trigger.dev connection
curl -H "Authorization: Bearer ${TRIGGER_SECRET_KEY}" \
     https://api.trigger.dev/api/v1/projects

# Check environment variables are loaded
docker compose --env-file .env.production exec supermark env | grep TRIGGER

# Disable Trigger.dev temporarily
# Edit .env.production and comment out TRIGGER_SECRET_KEY
docker compose --env-file .env.production restart supermark
```

### Known v4 Migration Issues

Recent commits show these fixes were needed:
- `fix: complete Trigger.dev v4 migration - update remaining v3 imports`
- `fix: update Trigger.dev SDK imports from v3 to v4 paths`
- `fix: downgrade AI SDK to v4 for Trigger.dev v4 compatibility`

If you see import errors, check:
```typescript
// Old v3 imports (don't use)
import { TriggerClient } from "@trigger.dev/sdk";

// New v4 imports (use these)
import { TriggerClient } from "@trigger.dev/sdk/v3";
```

---

## Recommended Deployment Strategy

### Phase 1: Core Deployment (Day 1)

Deploy with **minimal external services**:

```bash
# .env.production
TINYBIRD_TOKEN=              # Disabled
TRIGGER_SECRET_KEY=          # Disabled
RESEND_API_KEY=              # Optional but recommended
```

**Benefits**:
- Faster deployment
- Fewer points of failure
- Easier debugging
- All core features work

### Phase 2: Add Email (Day 2-3)

Once core deployment is stable, add Resend:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**Enables**:
- Email notifications
- User invitations
- Magic link authentication

### Phase 3: Evaluate Analytics (Week 2)

After stable operation, evaluate if you need analytics:

**Option A**: Try Tinybird again
- May work better from DigitalOcean than previous environment
- Push datasources from local machine first
- Add token to production

**Option B**: Use alternative analytics
- Deploy Umami or Plausible alongside Supermark
- Add to docker-compose.yml
- Modify tracking code in Supermark

### Phase 4: Evaluate Background Jobs (Week 3-4)

If you need faster document processing:

**Option A**: Try Trigger.dev again
- v4 migration is complete in codebase
- Deploy from local machine first
- Monitor for errors

**Option B**: Use QStash
- More Docker-friendly
- HTTP-based, simpler integration
- Add QSTASH_TOKEN to .env.production

**Option C**: Implement BullMQ
- Add Redis container
- Implement job queue
- Full control over processing

---

## Testing Service Configuration

Use the health check endpoint to verify service status:

```bash
# Check all services
curl https://supermark.yourdomain.com/api/health/services

# Response shows which services are configured and working:
{
  "postgres": "healthy",
  "storage": "healthy",
  "email": "not_configured",    // If no RESEND_API_KEY
  "tinybird": "not_configured",  // If no TINYBIRD_TOKEN
  "trigger": "not_configured"    // If no TRIGGER_SECRET_KEY
}
```

---

## Migration from Vercel to DigitalOcean

If you're migrating from Vercel where Tinybird/Trigger.dev were problematic:

### What Changes

1. **Network environment** - Different egress IPs, may resolve connection issues
2. **Docker isolation** - Services run in containers with better resource limits
3. **Control** - Full control over timeouts, retries, and configurations
4. **Debugging** - Direct access to logs and container internals

### Migration Steps

1. **Deploy without Tinybird/Trigger.dev** on DigitalOcean first
2. **Verify core functionality** works perfectly
3. **Migrate data**:
   ```bash
   # Export from Vercel Postgres
   pg_dump $VERCEL_POSTGRES_URL > backup.sql

   # Import to DigitalOcean
   docker compose --env-file .env.production exec -T postgres \
     psql -U supermark -d supermark < backup.sql
   ```
4. **Test with Tinybird** - Try again from new environment
5. **Test with Trigger.dev** - Try again from new environment

### Why DigitalOcean May Fix Issues

- **Network isolation** may resolve API connection problems
- **Resource guarantees** from dedicated droplet vs. serverless
- **Persistent connections** vs. Vercel's edge function timeouts
- **Full control** over retry logic and timeouts

---

## Production Best Practices

### Monitoring

Set up monitoring to detect service issues:

```bash
# Create monitoring script
cat > ~/supermark/monitor.sh << 'EOF'
#!/bin/bash
HEALTH=$(curl -s https://supermark.yourdomain.com/api/health/services)
echo $HEALTH | jq .

# Alert if any service is unhealthy
if echo $HEALTH | grep -q "unhealthy"; then
    # Send alert (configure with your alerting system)
    echo "ALERT: Service unhealthy!" | mail -s "Supermark Alert" admin@example.com
fi
EOF

chmod +x ~/supermark/monitor.sh

# Add to crontab (check every 5 minutes)
crontab -e
# Add: */5 * * * * ~/supermark/monitor.sh
```

### Fallback Strategy

Have a fallback plan if external services fail:

1. **Tinybird fails** → Disable analytics, core features continue
2. **Trigger.dev fails** → Sync document processing (slower but works)
3. **Resend fails** → Queue emails in database for retry

### Logs

Keep detailed logs for troubleshooting:

```bash
# Enable debug logging (in .env.production)
LOG_LEVEL=debug
NODE_ENV=production

# Rotate logs to prevent disk fill
docker compose --env-file .env.production logs --tail=1000 > logs/supermark-$(date +%Y%m%d).log
```

---

## Support

If you continue to experience issues:

1. **Check GitHub Issues**: https://github.com/regenassets/supermark/issues
2. **Review recent commits** for related fixes
3. **Enable debug logging** and collect detailed error messages
4. **Test services independently** (Tinybird API, Trigger.dev API)
5. **Consider alternatives** if services remain problematic

---

## Summary

**For most deployments**, we recommend:
- ✅ **Start without Tinybird and Trigger.dev**
- ✅ **Use included MinIO** for storage (works perfectly)
- ✅ **Add Resend** for emails (highly recommended)
- ⏸️ **Defer analytics** until core deployment is stable
- ⏸️ **Defer background jobs** until needed

This approach minimizes complexity and gets you a working deployment faster. You can always add services later once the core system is proven stable.
