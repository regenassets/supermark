<div align="center">
  <h1 align="center">Supermark</h1>
  <h3>Open-source document sharing platform for teams</h3>
  <p>AGPL-licensed • Self-hosted • Unlimited features</p>
</div>

<br/>

<div align="center">
  <a href="https://github.com/regenassets/supermark/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-AGPLv3-purple"></a>
  <a href="https://github.com/regenassets/supermark"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/regenassets/supermark"></a>
</div>

---

## What is Supermark?

Supermark is a fully open-source, AGPL-licensed document sharing and data room platform. It's a clean-room reimplementation based on Papermark, with all commercial-licensed code removed and replaced with AGPL implementations.

**Perfect for:**
- Teams who need document sharing without subscription fees
- Organizations requiring full control over their data
- Self-hosted deployments with unlimited users and documents
- Custom integrations and modifications

## Key Features

✅ **Document Sharing** - Share PDFs, presentations, spreadsheets, and more  
✅ **Data Rooms** - Organize documents in virtual data rooms  
✅ **Analytics** - Track views, downloads, and engagement  
✅ **Team Management** - Multiple users with role-based permissions  
✅ **Custom Domains** - Use your own domain for sharing links  
✅ **Security** - Email verification, OTP, password protection, watermarks  
✅ **Storage** - MinIO S3-compatible storage included  
✅ **Unlimited Everything** - No user, document, or link limits

## What's Different from Papermark?

Supermark is **100% AGPL-licensed** with:
- ❌ No Stripe billing/payments (not needed for self-hosted)
- ❌ No commercial license restrictions
- ❌ No subscription fees
- ✅ All features unlimited
- ✅ Full source code access
- ✅ Freedom to modify and redistribute

See [AGPL-MIGRATION.md](AGPL-MIGRATION.md) for complete details.

## Quick Start

### 🚀 Production Deployment (DigitalOcean)

Deploy to production in under 30 minutes with our automated setup:

```bash
curl -fsSL https://raw.githubusercontent.com/regenassets/supermark/main/docker/digitalocean-setup.sh | bash
```

**Documentation:**
- 📘 [DigitalOcean Deployment Guide](./DIGITALOCEAN-DEPLOYMENT.md) - Complete step-by-step guide
- ⚡ [Quick Deploy Reference](./QUICK-DEPLOY.md) - TL;DR version
- 🔧 [Tinybird/Trigger.dev Workarounds](./TINYBIRD-TRIGGERDEV-WORKAROUNDS.md) - Service configuration

**What's included:**
- PostgreSQL database (persistent storage)
- MinIO S3-compatible object storage
- Nginx reverse proxy with SSL/HTTPS
- Automated backups and updates
- Health monitoring

---

### Docker Deployment (Local/Development)

```bash
# Clone the repository
git clone https://github.com/regenassets/supermark.git
cd supermark

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start with Docker Compose
docker-compose up -d
```

Services included:
- **Supermark** - Main application (port 3000)
- **PostgreSQL** - Database
- **MinIO** - S3-compatible storage
- **Nginx** - Optional reverse proxy

### Manual Installation

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate deploy
npx prisma generate

# Run development server
npm run dev

# Or build for production
npm run build
npm start
```

## Configuration

### Required Environment Variables

```bash
# Database
POSTGRES_PRISMA_URL=postgresql://user:password@localhost:5432/supermark

# Authentication
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com

# Storage (MinIO)
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_ENDPOINT=http://minio:9000
NEXT_PRIVATE_UPLOAD_BUCKET=supermark-documents
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=your-key
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=your-secret
```

### Optional Services

- **Email** - Resend API for notifications
- **OAuth** - Google Sign-In
- **Analytics** - Tinybird integration

See [.env.example](.env.example) for all options.

## Documentation

- **[AGPL Migration Guide](AGPL-MIGRATION.md)** - What changed from Papermark
- **[Self-Hosting Guide](SELF_HOSTING.md)** - Deployment instructions
- **[Phase 1 Summary](PHASE1-REMOVAL-SUMMARY.md)** - Technical details

## Architecture

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Storage**: MinIO (S3-compatible)
- **Auth**: NextAuth.js
- **Email**: Resend

## Development

```bash
# Install dependencies
npm install

# Run Prisma migrations
npm run dev:prisma

# Start development server
npm run dev

# Run linting
npm run lint

# Format code
npm run format
```

## License

Supermark is licensed under [AGPLv3](LICENSE).

**Copyright:**
- Original Papermark: Copyright (c) 2023-present Papermark, Inc.
- AGPL Modifications: Copyright (c) 2025-present Regenerative Assets LLC

This means you can:
- ✅ Use commercially
- ✅ Modify freely
- ✅ Distribute
- ✅ Use privately
- ⚠️ Must disclose source
- ⚠️ Must use same license
- ⚠️ Must state changes

## Support

- **Issues**: [GitHub Issues](https://github.com/regenassets/supermark/issues)
- **Discussions**: [GitHub Discussions](https://github.com/regenassets/supermark/discussions)

## Contributing

Contributions are welcome! This is a fully open-source project.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

Supermark is based on [Papermark](https://github.com/mfts/papermark), created by Papermark, Inc. We're grateful for their work on the original open-source components.

---

**Built with ❤️ by Regenerative Assets**
