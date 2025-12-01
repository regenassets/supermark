import { Queue, QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";

import { isRedisAvailable } from "@/lib/redis";

// AGPL: BullMQ-based queue system using existing Redis (replaces QStash for webhooks)
// This provides a self-hosted alternative to Upstash QStash

let connection: IORedis | null = null;
let webhookQueue: Queue | null = null;
let webhookWorker: Worker | null = null;
let webhookQueueEvents: QueueEvents | null = null;

// Initialize Redis connection for BullMQ
function getRedisConnection(): IORedis | null {
  if (!isRedisAvailable()) {
    return null;
  }

  if (!connection) {
    connection = new IORedis({
      host: process.env.UPSTASH_REDIS_REST_URL?.replace(
        /^https?:\/\//,
        "",
      ).split(":")[0],
      port: parseInt(
        process.env.UPSTASH_REDIS_REST_URL?.split(":").pop() || "6379",
      ),
      password: process.env.UPSTASH_REDIS_REST_TOKEN,
      maxRetriesPerRequest: null,
    });
  }

  return connection;
}

// Helper to check if queue system is available
export const isQueueAvailable = () => isRedisAvailable();

// Get or create webhook queue
export function getWebhookQueue(): Queue | null {
  const redisConnection = getRedisConnection();

  if (!redisConnection) {
    return null;
  }

  if (!webhookQueue) {
    webhookQueue = new Queue("webhooks", {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs for debugging
        },
      },
    });
  }

  return webhookQueue;
}

// Add a webhook job to the queue
export async function addWebhookJob(data: {
  webhookId: string;
  webhookUrl: string;
  payload: any;
  signature: string;
  callbackUrl: string;
  eventId: string;
  event: string;
}) {
  const queue = getWebhookQueue();

  if (!queue) {
    console.warn("Queue system not available - webhook will not be sent");
    return null;
  }

  return await queue.add("send-webhook", data, {
    jobId: `webhook-${data.webhookId}-${data.eventId}`, // Prevent duplicates
  });
}

// Process webhook jobs (this should be called in a worker process)
export function startWebhookWorker(
  processor: (job: any) => Promise<void>,
): Worker | null {
  const redisConnection = getRedisConnection();

  if (!redisConnection) {
    console.warn("Queue system not available - worker will not start");
    return null;
  }

  if (webhookWorker) {
    return webhookWorker; // Already running
  }

  webhookWorker = new Worker(
    "webhooks",
    async (job) => {
      await processor(job);
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 webhooks concurrently
    },
  );

  webhookWorker.on("completed", (job) => {
    console.log(`Webhook job ${job.id} completed`);
  });

  webhookWorker.on("failed", (job, err) => {
    console.error(`Webhook job ${job?.id} failed:`, err);
  });

  return webhookWorker;
}

// Clean up connections
export async function closeQueueConnections() {
  if (webhookWorker) {
    await webhookWorker.close();
    webhookWorker = null;
  }

  if (webhookQueue) {
    await webhookQueue.close();
    webhookQueue = null;
  }

  if (webhookQueueEvents) {
    await webhookQueueEvents.close();
    webhookQueueEvents = null;
  }

  if (connection) {
    await connection.quit();
    connection = null;
  }
}
