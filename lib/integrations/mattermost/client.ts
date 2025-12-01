import {
  MattermostMessage,
  MattermostWebhookResponse,
} from "@/lib/integrations/mattermost/types";

export class MattermostClient {
  constructor() {
    // Mattermost uses webhook URLs, so no client credentials needed
  }

  /**
   * Send message to Mattermost channel via incoming webhook
   */
  async sendMessage(
    webhookUrl: string,
    message: MattermostMessage,
  ): Promise<MattermostWebhookResponse> {
    if (!webhookUrl) {
      throw new Error("Missing Mattermost webhook URL");
    }

    const requestUrl = webhookUrl;
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 10000);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
      signal: ac.signal,
    }).finally(() => clearTimeout(to));

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send Mattermost message: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();

    return {
      ok: true,
      id: data.id,
    };
  }
}

// Lazily instantiate
let _mattermostClient: MattermostClient | null = null;
export function getMattermostClient(): MattermostClient {
  if (!_mattermostClient) _mattermostClient = new MattermostClient();
  return _mattermostClient;
}
