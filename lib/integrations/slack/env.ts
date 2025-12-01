import { z } from "zod";

export const envSchema = z.object({
  SLACK_APP_INSTALL_URL: z.string(),
  SLACK_CLIENT_ID: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
  SLACK_INTEGRATION_ID: z.string(),
});

type SlackEnv = z.infer<typeof envSchema>;

let env: SlackEnv | undefined;

export const getSlackEnv = () => {
  if (env) {
    return env;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // AGPL: Slack/Mattermost integration is optional
    // Return null instead of throwing to allow app to function without it
    console.warn(
      "Slack/Mattermost integration not configured - integration features disabled",
    );
    return null;
  }

  env = parsed.data;

  return env;
};
