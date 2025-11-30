# External Services Integration Guide

This document describes all external service integrations in Supermark, their configuration, and which features depend on them.

## Service Health Check

View the status of all configured services at: `/api/health/services`

---

## Core Services (Required)

### 1. **PostgreSQL Database**
**Status**: Required
**Environment Variables**:
```bash
POSTGRES_PRISMA_URL=postgresql://user:password@localhost:5432/supermark
POSTGRES_PRISMA_URL_NON_POOLING=postgresql://user:password@localhost:5432/supermark
```

**Features Enabled**: All application features
**Notes**: Absolutely required - application will not start without database connection.

---

### 2. **Object Storage (Cloudflare R2 / S3 / Vercel Blob)**
**Status**: Required
**Recommended**: Cloudflare R2 (S3-compatible, cost-effective)

#### Cloudflare R2 Configuration (Recommended)
```bash
NEXT_PUBLIC_UPLOAD_TRANSPORT="s3"
NEXT_PRIVATE_UPLOAD_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
NEXT_PRIVATE_UPLOAD_REGION="auto"
NEXT_PRIVATE_UPLOAD_BUCKET="supermark-documents"
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="<R2_ACCESS_KEY>"
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="<R2_SECRET_KEY>"
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="<BUCKET_NAME>.r2.dev"
```

#### AWS S3 Configuration (Alternative)
```bash
NEXT_PUBLIC_UPLOAD_TRANSPORT="s3"
NEXT_PRIVATE_UPLOAD_BUCKET="supermark-documents"
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="<AWS_ACCESS_KEY>"
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="<AWS_SECRET_KEY>"
NEXT_PRIVATE_UPLOAD_REGION="us-east-1"
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="<BUCKET>.s3.us-east-1.amazonaws.com"
```

#### Vercel Blob Configuration (Alternative)
```bash
NEXT_PUBLIC_UPLOAD_TRANSPORT="vercel"
BLOB_READ_WRITE_TOKEN="<VERCEL_BLOB_TOKEN>"
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="<BLOB_STORE_ID>.public.blob.vercel-storage.com"
```

**Features Enabled**: All document storage, file uploads, branding assets
**Notes**: **Critical** - no file operations will work without storage configured.

---

## Optional Services

### 3. **Resend (Email Service)**
**Status**: Optional but recommended for production
**Environment Variables**:
```bash
RESEND_API_KEY="<RESEND_API_KEY>"
```

**Features Enabled**:
- Magic link authentication emails
- Team invitations
- Document view notifications
- Dataroom viewer invitations
- Email OTP verification
- Export ready notifications

**Notes**:
- Email features will fail without Resend configured
- No graceful fallback currently (emails will not be sent)
- Update email addresses in `lib/resend.ts` from `@supermark.local` to your actual domain

---

### 4. **Tinybird (Analytics)**
**Status**: Optional - gracefully disabled if not configured
**Environment Variables**:
```bash
TINYBIRD_TOKEN="<TINYBIRD_TOKEN>"
```

**Features Enabled**:
- Document page view tracking and analytics
- Video analytics (play, pause, seek events)
- Click event tracking within documents
- User agent and geolocation data
- Analytics dashboards (document stats, link performance, viewer engagement)
- Webhook event logging

**Data Sources Required**:
- `page_views__v3`
- `webhook_events__v1`
- `video_views__v1`
- `click_events__v1`
- `pm_click_events__v1`

**Notes**: Analytics features will show empty data when not configured. See `lib/tinybird/README.md` for data source schemas.

---

### 5. **Trigger.dev (Background Jobs)**
**Status**: Optional - file conversions disabled if not configured
**Environment Variables**:
```bash
TRIGGER_SECRET_KEY="<TRIGGER_SECRET_KEY>"
TRIGGER_API_URL="https://api.trigger.dev"
```

**Features Enabled**:
- Document format conversion (Office → PDF, CAD → PDF, Keynote → PDF)
- Video file optimization
- PDF to image rendering
- CSV export generation
- Scheduled email delivery
- Long-running background tasks

**Notes**:
- Documents requiring conversion will fail to process without Trigger.dev
- PDFs and natively supported formats work fine without Trigger.dev
- Availability is checked automatically - no crashes if not configured

---

### 6. **Webhook Delivery (QStash or BullMQ)**
**Status**: Optional - webhooks disabled if neither configured

#### Option A: QStash (Managed Service)
```bash
QSTASH_TOKEN="<QSTASH_TOKEN>"
QSTASH_CURRENT_SIGNING_KEY="<CURRENT_KEY>"
QSTASH_NEXT_SIGNING_KEY="<NEXT_KEY>"
```

#### Option B: BullMQ with Redis (Self-Hosted)
```bash
# BullMQ automatically uses existing Redis if configured
UPSTASH_REDIS_REST_URL="<REDIS_URL>"
UPSTASH_REDIS_REST_TOKEN="<REDIS_TOKEN>"
```

**Features Enabled**:
- Webhook event delivery
- Webhook retries and failure handling
- Event tracking

**Notes**:
- System tries QStash first, falls back to BullMQ (Redis) if QStash unavailable
- Either one is sufficient for webhook functionality
- Webhooks will not be sent if neither is configured

---

### 7. **Redis (Upstash or Self-Hosted)**
**Status**: Optional - graceful mock fallback if not configured
**Environment Variables**:
```bash
UPSTASH_REDIS_REST_URL="<REDIS_URL>"
UPSTASH_REDIS_REST_TOKEN="<REDIS_TOKEN>"

# For TUS upload locking
UPSTASH_REDIS_REST_LOCKER_URL="<REDIS_URL>"
UPSTASH_REDIS_REST_LOCKER_TOKEN="<REDIS_TOKEN>"
```

**Features Enabled**:
- Rate limiting (view access, OTP verification, API endpoints)
- Job status tracking (export jobs)
- TUS upload coordination (prevents file corruption)
- BullMQ webhook queue (if QStash not configured)

**Notes**: Uses mock ratelimiter when unavailable - production deployments should configure Redis for security.

---

### 8. **Hanko (Passkey Authentication)**
**Status**: Optional - passkey auth disabled if not configured
**Environment Variables**:
```bash
HANKO_API_KEY="<HANKO_API_KEY>"
NEXT_PUBLIC_HANKO_TENANT_ID="<HANKO_TENANT_ID>"
```

**Features Enabled**:
- Passwordless authentication via passkeys
- Passkey registration and management
- Biometric login

**Notes**: Passkey authentication UI elements hidden when not configured. Users can still use email/Google/LinkedIn login.

---

### 9. **Custom Domains (Vercel API)**
**Status**: Optional - custom domain features disabled if not configured
**Environment Variables**:
```bash
PROJECT_ID_VERCEL="<PROJECT_ID>"
TEAM_ID_VERCEL="<TEAM_ID>"
AUTH_BEARER_TOKEN="<VERCEL_API_TOKEN>"
```

**Features Enabled**:
- Custom domain addition and removal
- Domain verification
- DNS record validation

**Notes**:
- Only relevant when deploying on Vercel
- Self-hosted deployments can skip this entirely
- Custom domain UI hidden when not configured

---

### 10. **OAuth Providers (Google, LinkedIn)**
**Status**: Optional - specific login methods disabled if not configured

#### Google OAuth
```bash
GOOGLE_CLIENT_ID="<CLIENT_ID>"
GOOGLE_CLIENT_SECRET="<CLIENT_SECRET>"
```

#### LinkedIn OAuth
```bash
LINKEDIN_CLIENT_ID="<CLIENT_ID>"
LINKEDIN_CLIENT_SECRET="<CLIENT_SECRET>"
```

**Features Enabled**: Social login buttons for respective providers
**Notes**: Users can always use email authentication even if OAuth not configured.

---

## Deployment Recommendations

### Minimal Self-Hosted Setup
```bash
# Core (Required)
✓ PostgreSQL
✓ Cloudflare R2 (storage)

# Recommended
✓ Resend (emails)
✓ Redis (rate limiting)

# Skip These
✗ Vercel API (custom domains)
✗ QStash (use BullMQ instead)
✗ Hanko (optional passkeys)
✗ Tinybird (optional analytics)
✗ Trigger.dev (optional file conversion)
```

### Full Production Setup
```bash
# Core
✓ PostgreSQL
✓ Cloudflare R2

# All Optional Services
✓ Resend (emails)
✓ Tinybird (analytics)
✓ Trigger.dev (file conversions)
✓ QStash or Redis (webhooks)
✓ Redis (rate limiting)
✓ Hanko (passkeys)
✓ Google OAuth
✓ LinkedIn OAuth
```

---

## Service Dependencies Matrix

| Feature | Required Services | Optional Services |
|---------|------------------|-------------------|
| Document Upload | Storage, Database | - |
| Document Viewing | Storage, Database | Tinybird (analytics) |
| Document Conversion | Storage, Database, Trigger.dev | - |
| Email Invitations | Database, Resend | - |
| Magic Link Auth | Database, Resend | - |
| Passkey Auth | Database | Hanko |
| Analytics Dashboard | Database | Tinybird |
| Webhooks | Database | QStash OR Redis |
| Custom Domains | Database | Vercel API |
| CSV Exports | Storage, Database | Trigger.dev |

---

## Troubleshooting

### Check Service Health
```bash
curl http://localhost:3000/api/health/services
```

### Common Issues

**"App crashes on startup"**
- Check that `POSTGRES_PRISMA_URL` is set and database is accessible
- Hanko was causing crashes - this has been fixed (now optional)

**"Documents won't upload"**
- Verify storage configuration (R2/S3/Vercel Blob)
- Check `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST` is set correctly
- Ensure bucket permissions allow uploads

**"Emails not sending"**
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Update email addresses in `lib/resend.ts` from `@supermark.local`

**"File conversions failing"**
- Verify `TRIGGER_SECRET_KEY` is configured
- Check Trigger.dev dashboard for job errors
- PDFs work without Trigger.dev - only Office/CAD files need conversion

**"Webhooks not delivering"**
- Check that either QStash OR Redis is configured
- Look for warnings in logs about unconfigured queue system
- Verify webhook URLs are accessible from your server

**"Rate limiting not working"**
- Redis is optional - uses mock implementation when not configured
- For production, configure Redis for actual rate limiting protection

---

## Migration Notes

### From Vercel Blob to Cloudflare R2
1. Update environment variables to R2 configuration
2. Migrate existing files from Vercel Blob to R2 bucket
3. Update `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST` to R2 public URL
4. No code changes required - S3 SDK works with R2

### From QStash to BullMQ
1. Ensure Redis is configured
2. Remove QStash environment variables
3. System automatically uses BullMQ when QStash unavailable
4. No code changes required

---

## Support

For issues with specific services:
- **Cloudflare R2**: https://developers.cloudflare.com/r2/
- **Resend**: https://resend.com/docs
- **Tinybird**: https://www.tinybird.co/docs
- **Trigger.dev**: https://trigger.dev/docs
- **Hanko**: https://docs.hanko.io/
- **Supermark Issues**: https://github.com/regenassets/supermark/issues
