# Supermark Quick Start Guide

## Current Status

✅ PostgreSQL running on port 5432
✅ MinIO running on ports 9000 (API) and 9001 (console)
✅ MinIO bucket `supermark-documents` created
⚠️  Docker build has Podman permission issues - running locally instead

## Running Supermark Locally (Recommended)

### Step 1: Create .env.local file

cd /home/cyrus/supermark
cat > .env.local << 'ENVEOF'
# Database
POSTGRES_PRISMA_URL="postgresql://supermark:NHpJCdSWa8WaPPatmLezDxxro2p+/PHU@localhost:5432/supermark?schema=public&pgbouncer=true&connection_limit=10"
POSTGRES_PRISMA_URL_NON_POOLING="postgresql://supermark:NHpJCdSWa8WaPPatmLezDxxro2p+/PHU@localhost:5432/supermark?schema=public"

# NextAuth
NEXTAUTH_SECRET="q4V7E1J23kUTKOUCrktsxDqbYsokTkpm+WXKcVIEkhY="
NEXTAUTH_URL="http://localhost:3000"

# Base URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_MARKETING_URL="http://localhost:3000"
NEXT_PUBLIC_APP_BASE_HOST="localhost"

# Storage - MinIO S3
NEXT_PUBLIC_UPLOAD_TRANSPORT="s3"
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="localhost:9000"
NEXT_PRIVATE_UPLOAD_ENDPOINT="http://localhost:9000"
NEXT_PRIVATE_UPLOAD_REGION="us-east-1"
NEXT_PRIVATE_UPLOAD_BUCKET="supermark-documents"
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="supermark"
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="SHuE33NHYWmqr+WayjjhJ/+2PSJkOprx"
NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE="true"

# Document encryption
NEXT_PRIVATE_DOCUMENT_PASSWORD_KEY="SpoTXarJveufq0KAflcs4Dw1zBnE0+EsHWzI1j/S6YU="

# Node environment
NODE_ENV="development"
ENVEOF

### Step 2: Install dependencies

npm install

### Step 3: Run database migrations

npx prisma migrate deploy

### Step 4: Start the development server

npm run dev

### Step 5: Access Supermark

Open http://localhost:3000 in your browser

## MinIO Console Access

- URL: http://localhost:9001
- Username: supermark
- Password: SHuE33NHYWmqr+WayjjhJ/+2PSJkOprx

## Troubleshooting

### Reset database
docker compose --env-file .env.docker down postgres -v
docker compose --env-file .env.docker up -d postgres
sleep 15
npx prisma migrate deploy

### Check running services
docker ps

### View logs
docker logs supermark-postgres
docker logs supermark-minio
