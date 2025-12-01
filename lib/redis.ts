import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// AGPL: Make Redis optional for local development
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const isLockerRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_LOCKER_URL &&
  process.env.UPSTASH_REDIS_REST_LOCKER_TOKEN
);

// Helper to check if Redis is available
export const isRedisAvailable = () => isRedisConfigured;
export const isLockerRedisAvailable = () => isLockerRedisConfigured;

// Only initialize Redis clients if configured
export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    })
  : null;

export const lockerRedisClient = isLockerRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_LOCKER_URL as string,
      token: process.env.UPSTASH_REDIS_REST_LOCKER_TOKEN as string,
    })
  : null;

// Create a new ratelimiter, that allows 10 requests per 10 seconds by default
export const ratelimit = (
  requests: number = 10,
  seconds:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = "10 s",
) => {
  if (!redis) {
    // Return a mock ratelimiter for local development without Redis
    return {
      limit: async () => ({
        success: true,
        limit: requests,
        remaining: requests,
        reset: 0,
        pending: Promise.resolve(),
      }),
    };
  }
  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(requests, seconds),
    analytics: true,
    prefix: "supermark",
  });
};
