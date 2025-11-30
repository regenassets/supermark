import { NextResponse } from "next/server";
import { isHankoAvailable } from "@/lib/hanko";
import { isCustomDomainsAvailable } from "@/lib/domains";
import { isTriggerAvailable } from "@/lib/trigger";
import { isQStashAvailable } from "@/lib/cron";
import { isRedisAvailable } from "@/lib/redis";
import { isQueueAvailable } from "@/lib/queue";
import { isTinybirdAvailable } from "@/lib/tinybird";
import { resend } from "@/lib/resend";

// AGPL: Service health check endpoint
// Returns the availability status of all external services

export async function GET() {
  const services = {
    // Core Storage
    storage: {
      available: !!(
        process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT === "s3"
          ? process.env.NEXT_PRIVATE_UPLOAD_BUCKET &&
            process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID &&
            process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY
          : process.env.BLOB_READ_WRITE_TOKEN
      ),
      transport: process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT || "not configured",
      endpoint:
        process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT === "s3"
          ? process.env.NEXT_PRIVATE_UPLOAD_ENDPOINT || "default"
          : "vercel blob",
      distribution: process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST || "not set",
      critical: true,
    },

    // Database
    database: {
      available: !!process.env.POSTGRES_PRISMA_URL,
      critical: true,
    },

    // Email Service
    resend: {
      available: !!resend,
      configured: !!process.env.RESEND_API_KEY,
      critical: false,
      notes: "Required for email notifications and auth magic links",
    },

    // Analytics
    tinybird: {
      available: isTinybirdAvailable(),
      configured: !!process.env.TINYBIRD_TOKEN,
      critical: false,
      notes: "Optional - analytics will be disabled if not configured",
    },

    // Background Jobs
    trigger: {
      available: isTriggerAvailable(),
      configured: !!process.env.TRIGGER_SECRET_KEY,
      critical: false,
      notes: "Required for document conversion (Office, CAD), video optimization, and exports",
    },

    // Webhook Delivery
    webhooks: {
      qstash: {
        available: isQStashAvailable(),
        configured: !!(
          process.env.QSTASH_TOKEN &&
          process.env.QSTASH_CURRENT_SIGNING_KEY &&
          process.env.QSTASH_NEXT_SIGNING_KEY
        ),
        critical: false,
      },
      bullmq: {
        available: isQueueAvailable(),
        configured: isRedisAvailable(),
        critical: false,
        notes: "Fallback when QStash not available",
      },
      notes: "Either QStash OR BullMQ (Redis) required for webhook delivery",
    },

    // Rate Limiting / Caching
    redis: {
      available: isRedisAvailable(),
      configured: !!(
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN
      ),
      critical: false,
      notes: "Optional - rate limiting uses mock implementation if not configured",
    },

    // Authentication
    passkeys: {
      available: isHankoAvailable(),
      configured: !!(
        process.env.HANKO_API_KEY && process.env.NEXT_PUBLIC_HANKO_TENANT_ID
      ),
      critical: false,
      notes: "Optional - passkey auth disabled if not configured",
    },

    // Custom Domains
    customDomains: {
      available: isCustomDomainsAvailable(),
      configured: !!(
        process.env.PROJECT_ID_VERCEL &&
        process.env.TEAM_ID_VERCEL &&
        process.env.AUTH_BEARER_TOKEN
      ),
      critical: false,
      notes: "Optional - custom domain features disabled if not configured",
    },

    // OAuth Providers
    oauth: {
      google: {
        available: !!(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
        critical: false,
      },
      linkedin: {
        available: !!(
          process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
        ),
        critical: false,
      },
    },
  };

  // Calculate overall health
  const criticalServices = Object.entries(services).filter(
    ([_, config]: [string, any]) => config.critical === true
  );
  const criticalOk = criticalServices.every(([_, config]) => config.available);

  const status = criticalOk ? "healthy" : "degraded";

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    services,
  });
}
