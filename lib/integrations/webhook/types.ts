import { InstalledIntegration } from "@prisma/client";

/**
 * Generic webhook integration types that support multiple providers
 * (Slack, Mattermost, Discord, etc.)
 */

export type WebhookProvider = "slack" | "mattermost";

export type WebhookCredential = {
  provider: WebhookProvider;
  appId?: string;
  botUserId?: string;
  scope?: string;
  accessToken: string;
  tokenType?: string;
  authUser?: { id: string };
  team?: { id: string; name: string };
  // Mattermost-specific fields
  mattermostUrl?: string;
  mattermostTeamId?: string;
  mattermostTeamName?: string;
};

export type WebhookCredentialPublic = {
  provider: WebhookProvider;
  team?: { id: string; name: string };
  mattermostTeamName?: string;
};

export type WebhookConfiguration = {
  enabledChannels: Record<string, WebhookChannelConfig>;
};

export interface WebhookChannel {
  id: string;
  name: string;
  is_archived: boolean;
  is_private: boolean;
  is_member?: boolean;
}

export type WebhookIntegration = Omit<
  InstalledIntegration,
  "credentials" | "configuration"
> & {
  credentials: WebhookCredentialPublic;
  configuration: WebhookConfiguration | null;
};

export type WebhookIntegrationServer = Omit<
  InstalledIntegration,
  "credentials" | "configuration"
> & {
  credentials: WebhookCredential;
  configuration: WebhookConfiguration | null;
};

export interface WebhookMessage {
  channel?: string;
  text?: string;
  blocks?: any[];
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export interface WebhookEventData {
  teamId: string;
  eventType: WebhookNotificationType;
  documentId?: string;
  dataroomId?: string;
  viewId?: string;
  linkId?: string;
  viewerEmail?: string;
  viewerId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export type WebhookNotificationType =
  | "document_view"
  | "dataroom_access"
  | "document_download";

export interface WebhookChannelConfig {
  id: string;
  name: string;
  enabled: boolean;
  notificationTypes: WebhookNotificationType[];
}
