# Production Setup - External Services Configuration

## Overview
This document outlines the external services required for full production functionality of Supermark.cc, based on REG-42 requirements.

## Critical Services (Must Configure)

### 1. Email Service (Resend) - REQUIRED FOR EMAIL LOGIN
**Status**: 🔴 **SUPREMELY IMPORTANT** - Email login will not work without this

**Why it's needed**:
- Magic link authentication (email login)
- Team invitations
- Document view notifications
- OTP verification

**Setup Steps**:
1. Create account at https://resend.com
2. Get your API key from the dashboard
3. Add to `.env` file:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Update email addresses in `lib/resend.ts` from `@supermark.local` to your actual domain

**Without this**: Email login will fail completely - users cannot authenticate via email

---

### 2. Analytics (Tinybird) - REQUIRED FOR TIME ON PAGE
**Status**: 🔴 **Required** - Time on page analytics won't work without this

**Why it's needed**:
- Document page view tracking
- Time on page analytics
- Video analytics
- Click event tracking
- Analytics dashboards

**Setup Steps**:
1. Create account at https://tinybird.co
2. Set up the required data sources:
   - `page_views__v3`
   - `webhook_events__v1`
   - `video_views__v1`
   - `click_events__v1`
   - `pm_click_events__v1`
3. Get your API token
4. Add to `.env` file:
   ```bash
   TINYBIRD_TOKEN=p.xxxxxxxxxxxxxx
   ```

**Data source schemas**: See `lib/tinybird/README.md` in the codebase

**Without this**: Analytics will show empty data, "time on page" feature will not work

---

## Already Configured Services

### ✅ PostgreSQL Database
- **Status**: Configured in docker-compose.yml
- **Credentials**: Set in `.env` file (POSTGRES_PASSWORD)
- **Connection**: Working via docker network

### ✅ MinIO S3 Storage
- **Status**: Configured in docker-compose.yml
- **Purpose**: Document storage (replaces need for Cloudflare R2/AWS S3)
- **Access**: localhost:9000 (API), localhost:9001 (Console)

---

## Optional But Recommended Services

### 3. Redis (Upstash) - For Rate Limiting
**Status**: ⚠️ Optional - Uses mock implementation if not configured

**Why you might want it**:
- API rate limiting
- Better security for production
- TUS upload coordination

**Setup Steps**:
1. Create account at https://upstash.com
2. Create a Redis database
3. Add to `.env` file:
   ```bash
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxx
   UPSTASH_REDIS_REST_LOCKER_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_LOCKER_TOKEN=xxxxxxxxxx
   ```

**Without this**: Uses mock rate limiter (works but less secure)

---

### 4. Trigger.dev - For File Conversions
**Status**: ⚠️ Optional - Only needed for Office/CAD file conversions

**Why you might want it**:
- Convert Office documents to PDF
- Convert CAD files to PDF
- Video optimization
- CSV exports

**Setup Steps**:
1. Create account at https://trigger.dev
2. Add to `.env` file:
   ```bash
   TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxxx
   TRIGGER_API_URL=https://api.trigger.dev
   ```

**Without this**: PDF and standard formats work fine, but Office/CAD conversions will fail

---

## Services NOT Needed for Docker Deployment

### ❌ Vercel API (Custom Domains)
- Only needed if deploying on Vercel platform
- Skip for self-hosted Docker deployment

### ❌ Hanko (Passkey Auth)
- Optional feature for biometric login
- Users can use email/Google login without this

### ❌ QStash
- Alternative to Redis for webhooks
- Not needed if you don't use webhooks

---

## Current Status Summary

| Service | Status | Impact if Missing |
|---------|--------|------------------|
| PostgreSQL | ✅ Configured | App won't start |
| MinIO Storage | ✅ Configured | No file operations |
| **Resend Email** | 🔴 **NEEDS SETUP** | **Email login fails** |
| **Tinybird Analytics** | 🔴 **NEEDS SETUP** | **No time-on-page analytics** |
| Redis | ⚠️ Optional | Mock rate limiter used |
| Trigger.dev | ⚠️ Optional | Office conversions fail |
| Vercel API | ❌ Not needed | N/A - Docker deployment |
| Hanko | ❌ Not needed | Passkey auth unavailable |

---

## Next Steps for Production Deployment

1. **Immediate** (before testing):
   - [ ] Set up Resend account and add RESEND_API_KEY
   - [ ] Set up Tinybird account and add TINYBIRD_TOKEN
   - [ ] Update email addresses in `lib/resend.ts`

2. **Recommended** (before go-live):
   - [ ] Set up Upstash Redis for production-grade rate limiting
   - [ ] Configure SSL/TLS with Let's Encrypt (see nginx setup)
   - [ ] Set up monitoring and logging

3. **Optional** (as needed):
   - [ ] Set up Trigger.dev if you need Office file conversions
   - [ ] Configure Google OAuth if you want social login

---

## Testing Checklist

After configuring Resend and Tinybird:

- [ ] Test email login (magic link)
- [ ] Test team invitations
- [ ] Upload and view a document
- [ ] Verify "time on page" analytics are tracking
- [ ] Check analytics dashboard shows data
- [ ] Test document sharing with external viewers

---

## Troubleshooting

### Email Login Not Working
1. Check `RESEND_API_KEY` is set in `.env`
2. Verify email addresses in `lib/resend.ts` are updated
3. Check Resend dashboard for delivery errors
4. Look for errors in application logs

### Analytics Not Showing
1. Check `TINYBIRD_TOKEN` is set in `.env`
2. Verify data sources are created in Tinybird
3. Check Tinybird dashboard for ingestion errors
4. View `/api/health/services` for service status

### Build Still Failing
1. Increased Node heap size to 4096MB in Dockerfile
2. If still fails, may need to increase Docker memory limits
3. Check `docker stats` to see container resource usage

---

## Support Resources

- Resend Docs: https://resend.com/docs
- Tinybird Docs: https://www.tinybird.co/docs
- Upstash Docs: https://docs.upstash.com
- Supermark Issues: https://github.com/regenassets/supermark/issues
