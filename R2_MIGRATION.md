# Migrating from MinIO to Cloudflare R2

This guide walks through migrating Supermark's file storage from MinIO to Cloudflare R2.

## Why Cloudflare R2?

- **No egress fees**: Unlike S3, R2 doesn't charge for data transfer out
- **S3-compatible API**: Uses the same AWS SDK, minimal code changes
- **Better reliability**: Managed service with automatic redundancy
- **Simpler infrastructure**: No need to self-host MinIO
- **Global CDN**: Built-in content delivery network

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://dash.cloudflare.com/sign-up)
2. **R2 Subscription**: Enable R2 from your Cloudflare dashboard
3. **API Token**: Create R2 API token with read/write permissions

## Step 1: Create R2 Bucket

1. Log into Cloudflare Dashboard
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name your bucket: `supermark-documents` (or your preferred name)
5. Choose a location hint (e.g., North America - WNAM)
6. Click **Create bucket**

## Step 2: Generate R2 API Credentials

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure token:
   - **Token name**: `supermark-storage`
   - **Permissions**: Object Read & Write
   - **TTL**: Never expire (or set custom expiration)
   - **Bucket restriction**: Select your bucket or "All buckets"
4. Click **Create API Token**
5. **Important**: Copy and save these values immediately:
   - **Access Key ID**: Will be used for `NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID`
   - **Secret Access Key**: Will be used for `NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY`
   - **Endpoint URL**: Format is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

## Step 3: Configure R2 Public Access (for downloads)

1. Go to your bucket settings
2. Click **Settings** tab
3. Under **Public access**, click **Connect Domain** or **Allow Access**
4. You have two options:

   **Option A: Use R2.dev subdomain (quick setup)**
   - Enable R2.dev subdomain
   - Your URL will be: `https://<BUCKET_NAME>.r2.dev`
   - Use this for `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST`

   **Option B: Use custom domain (recommended for production)**
   - Add a custom domain (e.g., `files.supermark.cc`)
   - Follow Cloudflare's DNS setup instructions
   - Use your custom domain for `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST`

## Step 4: Update Environment Variables

### For Production (.env or DigitalOcean)

```bash
# Storage Configuration
NEXT_PUBLIC_UPLOAD_TRANSPORT="s3"

# Cloudflare R2 Configuration
# Replace <ACCOUNT_ID> with your Cloudflare account ID (from endpoint URL)
# Replace <BUCKET_NAME> with your bucket name
NEXT_PRIVATE_UPLOAD_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
NEXT_PRIVATE_UPLOAD_REGION="auto"
NEXT_PRIVATE_UPLOAD_BUCKET="supermark-documents"
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="<YOUR_R2_ACCESS_KEY_ID>"
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="<YOUR_R2_SECRET_ACCESS_KEY>"

# Distribution host for public file access
# Option A: R2.dev subdomain
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="supermark-documents.r2.dev"
# Option B: Custom domain (if configured)
# NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="files.supermark.cc"
```

See R2_MIGRATION.md for complete migration guide.
