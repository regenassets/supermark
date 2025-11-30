/**
 * Mattermost integration types
 * Uses incoming webhooks for posting messages to channels
 */

export interface MattermostCredential {
  webhookUrl: string;
  webhookId?: string;
  channelId?: string;
  channelName?: string;
  teamId?: string;
  teamName?: string;
}

export interface MattermostCredentialPublic {
  channelName?: string;
  teamName?: string;
}

export interface MattermostConfiguration {
  enabled: boolean;
  notificationTypes: MattermostNotificationType[];
}

export type MattermostNotificationType =
  | "document_view"
  | "dataroom_access"
  | "document_download";

export interface MattermostMessage {
  text?: string;
  username?: string;
  icon_url?: string;
  channel?: string;
  props?: Record<string, any>;
}

export interface MattermostWebhookResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface MattermostIntegration {
  id: string;
  integrationId: string;
  teamId: string;
  userId: string | null;
  enabled: boolean;
  credentials: MattermostCredentialPublic;
  configuration: MattermostConfiguration | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MattermostIntegrationServer {
  id: string;
  integrationId: string;
  teamId: string;
  userId: string | null;
  enabled: boolean;
  credentials: MattermostCredential;
  configuration: MattermostConfiguration | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MattermostEventData {
  teamId: string;
  eventType: MattermostNotificationType;
  documentId?: string;
  dataroomId?: string;
  viewId?: string;
  linkId?: string;
  viewerEmail?: string;
  viewerId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}
