import prisma from "@/lib/prisma";

import { MattermostClient } from "./client";
import { createMattermostMessage } from "./templates";
import { MattermostEventData, MattermostIntegrationServer } from "./types";

export class MattermostEventManager {
  private client: MattermostClient;

  constructor() {
    this.client = new MattermostClient();
  }

  async processEvent(eventData: MattermostEventData): Promise<void> {
    try {
      // Get the Mattermost integration ID from environment or database
      const mattermostIntegration = await prisma.integration.findUnique({
        where: {
          slug: "mattermost",
        },
        select: {
          id: true,
        },
      });

      if (!mattermostIntegration) {
        console.warn("Mattermost integration not found in database");
        return;
      }

      const integration = await prisma.installedIntegration.findUnique({
        where: {
          teamId_integrationId: {
            teamId: eventData.teamId,
            integrationId: mattermostIntegration.id,
          },
        },
        select: {
          enabled: true,
          credentials: true,
          configuration: true,
        },
      });

      if (!integration || !integration.enabled) {
        return;
      }

      await this.sendMattermostNotification(
        eventData,
        integration as unknown as MattermostIntegrationServer,
      );
    } catch (error) {
      console.error("Error processing Mattermost event:", error);
    }
  }

  /**
   * Send Mattermost notification for an event
   */
  private async sendMattermostNotification(
    eventData: MattermostEventData,
    integration: MattermostIntegrationServer,
  ): Promise<void> {
    try {
      const configuration = integration.configuration;

      // Check if the event type is enabled
      if (
        !configuration ||
        !configuration.notificationTypes.includes(eventData.eventType)
      ) {
        return;
      }

      const message = await createMattermostMessage(eventData);
      if (!message) {
        return;
      }

      const webhookUrl = integration.credentials.webhookUrl;
      if (!webhookUrl) {
        console.error("Mattermost webhook URL not found");
        return;
      }

      await this.client.sendMessage(webhookUrl, message);
    } catch (error) {
      console.error("Error sending Mattermost notification:", error);
    }
  }
}

export const mattermostEventManager = new MattermostEventManager();

export async function notifyDocumentView(
  data: Omit<MattermostEventData, "eventType">,
) {
  await mattermostEventManager.processEvent({ ...data, eventType: "document_view" });
}

export async function notifyDataroomAccess(
  data: Omit<MattermostEventData, "eventType">,
) {
  await mattermostEventManager.processEvent({
    ...data,
    eventType: "dataroom_access",
  });
}

export async function notifyDocumentDownload(
  data: Omit<MattermostEventData, "eventType">,
) {
  await mattermostEventManager.processEvent({
    ...data,
    eventType: "document_download",
  });
}
