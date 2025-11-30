import { auth } from "@trigger.dev/sdk/v3";

export async function generateTriggerPublicAccessToken(tag: string) {
  // AGPL: Make Trigger.dev optional for local development
  if (!process.env.TRIGGER_SECRET_KEY) {
    return null;
  }

  return auth.createPublicToken({
    scopes: {
      read: {
        tags: [tag],
      },
    },
    expirationTime: "15m",
  });
}
