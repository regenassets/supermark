# Supermark Scripts

Utility scripts for Supermark maintenance and operations.

## Migration Scripts

### migrate-minio-to-r2.js

Migrates all files from MinIO to Cloudflare R2 storage.

**Prerequisites:**
- Node.js installed
- Access to both MinIO and R2 storage
- R2 bucket already created

**Usage:**

```bash
# Set MinIO credentials
export MINIO_ENDPOINT="http://localhost:9000"
export MINIO_ACCESS_KEY="supermark"
export MINIO_SECRET_KEY="your-minio-password"
export MINIO_BUCKET="supermark-documents"

# Set R2 credentials
export R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
export R2_ACCESS_KEY="your-r2-access-key-id"
export R2_SECRET_KEY="your-r2-secret-access-key"
export R2_BUCKET="supermark-documents"

# Run migration
node scripts/migrate-minio-to-r2.js
```

**What it does:**
1. Lists all objects in MinIO bucket
2. Downloads each file from MinIO
3. Uploads to R2 with original metadata
4. Provides progress tracking and summary
5. Reports any errors

**Output:**
- Success/failure for each file
- Total files migrated
- Total data transferred
- Summary of any errors

For complete R2 migration instructions, see [R2_MIGRATION.md](../R2_MIGRATION.md)

## Adding New Scripts

When adding new scripts:
1. Use `#!/usr/bin/env node` or appropriate shebang
2. Make executable: `chmod +x scripts/your-script.js`
3. Add usage documentation in this README
4. Handle errors gracefully
5. Provide clear output and progress indication
