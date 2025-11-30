import { tenant } from "@teamhanko/passkeys-next-auth-provider";

// AGPL: Make Hanko optional for local development and self-hosted deployments
const isHankoConfigured = !!(
  process.env.HANKO_API_KEY && process.env.NEXT_PUBLIC_HANKO_TENANT_ID
);

// Helper to check if Hanko is available
export const isHankoAvailable = () => isHankoConfigured;

// Lazy-load Hanko client to prevent startup crashes when not configured
let hankoInstance: ReturnType<typeof tenant> | null = null;

const getHankoClient = () => {
  if (!isHankoConfigured) {
    return null;
  }

  if (!hankoInstance) {
    hankoInstance = tenant({
      apiKey: process.env.HANKO_API_KEY!,
      tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID!,
    });
  }

  return hankoInstance;
};

// Default export for backwards compatibility
const hanko = getHankoClient();

export default hanko;
