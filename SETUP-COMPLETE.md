# ✅ Supermark Setup Complete!

## 🎉 Your Supermark installation is now running

### Access Supermark
- **URL**: http://localhost:3001
- **Status**: Running in development mode

### Running Services

#### PostgreSQL Database
- **Container**: supermark-postgres
- **Port**: 5432
- **Database**: supermark
- **User**: supermark
- **Status**: ✅ Healthy

#### MinIO S3 Storage
- **Container**: supermark-minio
- **API Port**: 9000
- **Console Port**: 9001
- **Console URL**: http://localhost:9001
- **Username**: supermark
- **Password**: SHuE33NHYWmqr+WayjjhJ/+2PSJkOprx
- **Bucket**: supermark-documents
- **Status**: ✅ Healthy

#### Supermark Application
- **Port**: 3001 (3000 was in use)
- **Mode**: Development
- **Database**: ✅ Migrated (91 migrations applied)
- **Dependencies**: ✅ Installed (908 packages)
- **Status**: ✅ Running

## 📝 Next Steps

### 1. Create Your First Account
Open http://localhost:3001 in your browser and register a new account.

### 2. Upload a Document
Once logged in, you can upload and share documents with unlimited features.

### 3. View MinIO Console
Visit http://localhost:9001 to see uploaded documents in the S3-compatible storage.

## 🔧 Managing Your Installation

### Start Services
```bash
cd /home/cyrus/supermark

# Start database and storage
docker compose --env-file .env.docker up -d postgres minio

# Start development server
npm run dev
```

### Stop Services
```bash
# Stop dev server (Ctrl+C in the terminal)

# Stop database and storage
docker compose --env-file .env.docker down
```

### View Logs
```bash
# Docker services
docker logs supermark-postgres
docker logs supermark-minio

# Application logs - check the terminal where npm run dev is running
```

### Check Service Status
```bash
docker ps
```

## 🗂️ Important Files

- `.env.local` - Local environment variables (Next.js loads this automatically)
- `.env.docker` - Docker environment variables
- `docker-compose.yml` - Docker services configuration
- `run-migrations.sh` - Script to run database migrations
- `QUICKSTART.md` - Quick start guide

## 🔐 Security Notes

**IMPORTANT**: The secrets generated for this installation are:
- Stored in `.env.local` and `.env.docker`
- Randomly generated and secure
- Should be kept private
- Should be changed before deploying to production

## 💡 Tips

1. **Port 3000 is in use**: The server started on port 3001 instead. This is normal if you have another service on 3000.

2. **Unlimited Features**: This AGPL version has all features unlimited for self-hosted use.

3. **No Billing Required**: Unlike the commercial version, no payment setup is needed.

4. **MinIO Storage**: All documents are stored locally in MinIO, not in a cloud service.

## 🐛 Troubleshooting

### Database connection issues
```bash
# Restart database
docker compose --env-file .env.docker restart postgres

# Check if it's running
docker ps | grep postgres
```

### MinIO connection issues
```bash
# Restart MinIO
docker compose --env-file .env.docker restart minio

# Recreate bucket
docker compose --env-file .env.docker up minio-setup
```

### Reset everything
```bash
# Stop and remove all containers and volumes
docker compose --env-file .env.docker down -v

# Start fresh
docker compose --env-file .env.docker up -d postgres minio
sleep 15
./run-migrations.sh
npm run dev
```

## 📚 Documentation

See the main README.md for full documentation and feature list.

---

**Supermark** - Open Source Document Sharing Infrastructure
Licensed under AGPLv3 | Copyright © 2025 Regenerative Assets LLC
