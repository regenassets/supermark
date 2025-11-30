# Mattermost Integration

This directory contains the Mattermost integration for Supermark, which sends real-time notifications to Mattermost channels when documents are viewed, accessed, or downloaded.

## Architecture

The Mattermost integration uses **incoming webhooks** (not OAuth) for simplicity and ease of setup.

### Files

- **`client.ts`** - HTTP client for sending messages to Mattermost webhook URLs
- **`types.ts`** - TypeScript type definitions for credentials, configuration, and messages
- **`templates.ts`** - Message templates that format events into Mattermost markdown
- **`events.ts`** - Event processing logic that handles notification delivery

## How It Works

1. **Event Triggers**: When a document is viewed/downloaded/accessed, the application emits events
2. **Event Manager**: `events.ts` receives the event and checks if Mattermost is installed and enabled
3. **Message Creation**: `templates.ts` creates a markdown-formatted message with event details
4. **Delivery**: `client.ts` sends the message to the configured webhook URL
5. **Mattermost Displays**: The message appears in the configured Mattermost channel

## Message Format

Messages use Mattermost markdown format:

```markdown
### 📄 Your document has been viewed

**Document:** example.pdf
**Viewer:** user@example.com
**Shared Link:** "Sales Proposal"
**Time:** 2025-11-30 10:30:00

Viewed document via shared link "Sales Proposal"

[View document](https://supermark.com/documents/xxx)
```

## Event Types

Three types of notifications are supported:

1. **`document_view`** - Triggered when someone views a document
2. **`dataroom_access`** - Triggered when someone accesses a dataroom
3. **`document_download`** - Triggered when someone downloads a document

## Configuration

Mattermost integration is configured per team in the database:

```typescript
{
  credentials: {
    webhookUrl: "https://mattermost.com/hooks/xxx",
    channelName: "general",
    teamName: "My Team"
  },
  configuration: {
    enabled: true,
    notificationTypes: ["document_view", "document_download", "dataroom_access"]
  }
}
```

## Differences from Slack

| Aspect | Slack | Mattermost |
|--------|-------|------------|
| Auth | OAuth 2.0 | Webhook URL |
| Message Format | Blocks API | Markdown |
| Setup | Complex (app registration) | Simple (create webhook) |
| Environment Vars | Required | Not required |

## Usage in Code

Import and use the notification functions:

```typescript
import { notifyDocumentView } from "@/lib/integrations/mattermost/events";

// Send a document view notification
await notifyDocumentView({
  teamId: "team_123",
  documentId: "doc_456",
  linkId: "link_789",
  viewerEmail: "user@example.com",
  viewerId: "viewer_123",
});
```

## Error Handling

All notification calls are wrapped in try-catch blocks and failures are logged but don't block the main application flow. Failed webhook calls will appear in the logs as:

```
Error sending Mattermost notification: [error details]
```

## Testing

See `MATTERMOST-SETUP.md` in the project root for complete testing instructions.

Quick test:
```bash
curl -X POST "https://your-mattermost.com/hooks/xxx" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test from Supermark", "username": "Supermark"}'
```

## API Endpoints

REST API is available at:
- `GET /api/teams/[teamId]/integrations/mattermost` - Get integration status
- `POST /api/teams/[teamId]/integrations/mattermost` - Install integration
- `PUT /api/teams/[teamId]/integrations/mattermost` - Update configuration
- `DELETE /api/teams/[teamId]/integrations/mattermost` - Uninstall integration

See `pages/api/teams/[teamId]/integrations/mattermost/index.ts` for implementation.
