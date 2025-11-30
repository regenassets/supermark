import { Receiver } from "@upstash/qstash";
import { Client } from "@upstash/qstash";
import Bottleneck from "bottleneck";

// we're using Bottleneck to avoid running into Resend's rate limit of 10 req/s
export const limiter = new Bottleneck({
  maxConcurrent: 1, // maximum concurrent requests
  minTime: 100, // minimum time between requests in ms
});

// AGPL: Make QStash optional for local development
const isQStashConfigured = !!(
  process.env.QSTASH_TOKEN &&
  process.env.QSTASH_CURRENT_SIGNING_KEY &&
  process.env.QSTASH_NEXT_SIGNING_KEY
);

// Helper to check if QStash is available
export const isQStashAvailable = () => isQStashConfigured;

// we're using Upstash's Receiver to verify the request signature
export const receiver = isQStashConfigured
  ? new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    })
  : null;

export const qstash = isQStashConfigured
  ? new Client({
      token: process.env.QSTASH_TOKEN!,
    })
  : null;
