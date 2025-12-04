# Multi-stage build for Papermark self-hosted deployment
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and prisma schema (needed for postinstall)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Use cache mount for npm to speed up installs
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Accept NEXT_PUBLIC_* build arguments
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_MARKETING_URL
ARG NEXT_PUBLIC_APP_BASE_HOST
ARG NEXT_PUBLIC_UPLOAD_TRANSPORT
ARG NEXT_PUBLIC_HANKO_TENANT_ID

# Set them as environment variables for Next.js build
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_MARKETING_URL=${NEXT_PUBLIC_MARKETING_URL}
ENV NEXT_PUBLIC_APP_BASE_HOST=${NEXT_PUBLIC_APP_BASE_HOST}
ENV NEXT_PUBLIC_UPLOAD_TRANSPORT=${NEXT_PUBLIC_UPLOAD_TRANSPORT}
ENV NEXT_PUBLIC_HANKO_TENANT_ID=${NEXT_PUBLIC_HANKO_TENANT_ID}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy only necessary files for build (see .dockerignore for exclusions)
COPY package.json package-lock.json* ./
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY components.json ./
COPY middleware.ts ./
COPY trigger.config.ts ./
COPY public ./public
COPY app ./app
COPY components ./components
COPY context ./context
COPY lib ./lib
COPY pages ./pages
COPY styles ./styles

# Generate Prisma Client (already done in postinstall, but ensure it's there)
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install system dependencies for mupdf and other native modules
RUN apk add --no-cache \
    ffmpeg \
    libc6-compat \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
