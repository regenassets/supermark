# Mattermost Integration Setup Guide

This guide will help you set up and test the Mattermost integration in Supermark.

## Overview

The Mattermost integration uses **incoming webhooks** to send notifications to your Mattermost channels when:
- Documents are viewed
- Data rooms are accessed
- Documents are downloaded

## Prerequisites

1. A running Mattermost instance (self-hosted or cloud)
2. Admin access to create incoming webhooks in Mattermost
3. Supermark running locally or deployed

## Setup Steps

### Step 1: Create the Mattermost Integration Record in Database

First, you need to add the Mattermost integration to your database. Run the SQL script:

```bash
# Connect to your PostgreSQL database and run:
psql -U your_user -d your_database -f scripts/mattermost-integration-seed.sql
```

Or manually execute the SQL in `scripts/mattermost-integration-seed.sql`.

### Step 2: Create an Incoming Webhook in Mattermost

1. Log in to your Mattermost instance
2. Go to **Main Menu > Integrations > Incoming Webhooks**
3. Click **Add Incoming Webhook**
4. Fill in the details:
   - **Title**: Supermark Notifications
   - **Description**: Notifications from Supermark document sharing
   - **Channel**: Select the channel where you want to receive notifications
5. Click **Save**
6. Copy the generated **Webhook URL** (it will look like: `https://your-mattermost-instance.com/hooks/xxx...`)

### Step 3: Install the Integration in Supermark

Use the API to install and configure the Mattermost integration:

```bash
# Replace with your actual values
TEAM_ID="your-team-id"
WEBHOOK_URL="your-mattermost-webhook-url"
AUTH_TOKEN="your-session-token"

curl -X POST "http://localhost:3000/api/teams/${TEAM_ID}/integrations/mattermost" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=${AUTH_TOKEN}" \
  -d "{
    \"webhookUrl\": \"${WEBHOOK_URL}\",
    \"channelName\": \"general\",
    \"teamName\": \"Your Team\"
  }"
```

### Step 4: Configure Notification Types

By default, all notification types are enabled. To customize:

```bash
curl -X PUT "http://localhost:3000/api/teams/${TEAM_ID}/integrations/mattermost" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=${AUTH_TOKEN}" \
  -d "{
    \"enabled\": true,
    \"notificationTypes\": [\"document_view\", \"document_download\", \"dataroom_access\"]
  }"
```

Available notification types:
- `document_view` - When someone views a document
- `document_download` - When someone downloads a document
- `dataroom_access` - When someone accesses a data room

## Testing the Integration

### Test 1: Document View Notification

1. Share a document via link in Supermark
2. Open the shared link (in an incognito window if needed)
3. View the document
4. Check your Mattermost channel - you should see a notification with:
   - Document name
   - Viewer email (if provided)
   - Access method (shared link or dataroom)
   - Timestamp
   - Link to view the document in Supermark

### Test 2: Document Download Notification

1. Share a document that allows downloads
2. Open the shared link
3. Download the document
4. Check your Mattermost channel for the download notification

### Test 3: Dataroom Access Notification

1. Create a dataroom with multiple documents
2. Share the dataroom via link
3. Access the dataroom through the link
4. Check your Mattermost channel for the access notification

## API Endpoints

### Get Integration Status
```bash
GET /api/teams/{teamId}/integrations/mattermost
```

### Install/Update Integration
```bash
POST /api/teams/{teamId}/integrations/mattermost
Body: {
  "webhookUrl": "string",
  "channelName": "string" (optional),
  "teamName": "string" (optional)
}
```

### Update Configuration
```bash
PUT /api/teams/{teamId}/integrations/mattermost
Body: {
  "enabled": boolean,
  "notificationTypes": ["document_view", "document_download", "dataroom_access"]
}
```

### Uninstall Integration
```bash
DELETE /api/teams/{teamId}/integrations/mattermost
```

## Troubleshooting

### No notifications appearing

1. **Check if integration is installed:**
   ```bash
   curl "http://localhost:3000/api/teams/${TEAM_ID}/integrations/mattermost" \
     -H "Cookie: next-auth.session-token=${AUTH_TOKEN}"
   ```

2. **Check if integration is enabled:**
   ```json
   {
     "enabled": true,
     "configuration": {
       "enabled": true,
       "notificationTypes": [...]
     }
   }
   ```

3. **Verify webhook URL is correct** in Mattermost settings

4. **Check application logs** for any errors:
   ```bash
   # Look for lines containing "Mattermost notification"
   tail -f logs/app.log | grep -i mattermost
   ```

### Webhook URL is invalid

- Make sure the webhook URL starts with `http://` or `https://`
- Verify the URL works by sending a test message:
  ```bash
  curl -X POST "${WEBHOOK_URL}" \
    -H "Content-Type: application/json" \
    -d '{"text": "Test message from Supermark"}'
  ```

### Integration not found error

- Run the database seed script again to ensure the integration record exists
- Check the database:
  ```sql
  SELECT * FROM "Integration" WHERE slug = 'mattermost';
  ```

## Message Format

Mattermost notifications use markdown format and include:

**Document View:**
```markdown
### 📄 Your document has been viewed

**Document:** example.pdf
**Viewer:** user@example.com
**Shared Link:** "Sales Proposal"
**Time:** 2025-11-30 10:30:00

Viewed document via shared link "Sales Proposal"

[View document](https://supermark.com/documents/xxx)
```

**Dataroom Access:**
```markdown
### 🗂️ Your dataroom has been viewed

**Dataroom:** Q4 Reports
**Viewer:** user@example.com
**Shared Link:** "Q4 Data Room"
**Time:** 2025-11-30 10:30:00
**Documents:** 15 documents

Dataroom accessed via shared link "Q4 Data Room"

[View dataroom](https://supermark.com/datarooms/xxx)
```

**Document Download:**
```markdown
### 📥 Document has been downloaded

**Document:** example.pdf
**Downloaded by:** user@example.com
**From Dataroom:** Q4 Reports
**Time:** 2025-11-30 10:30:00

Document download via shared link "Sales Proposal"

[View activity](https://supermark.com/documents/xxx)
```

## Development Notes

### Code Structure

- **Client:** `lib/integrations/mattermost/client.ts` - Handles webhook API calls
- **Types:** `lib/integrations/mattermost/types.ts` - TypeScript type definitions
- **Templates:** `lib/integrations/mattermost/templates.ts` - Message templates
- **Events:** `lib/integrations/mattermost/events.ts` - Event processing logic
- **API:** `pages/api/teams/[teamId]/integrations/mattermost/index.ts` - REST API endpoints

### Event Triggers

Events are automatically triggered from:
- `app/api/views/route.ts` - Document views
- `app/api/views-dataroom/route.ts` - Dataroom access and document views in datarooms
- `pages/api/links/download/index.ts` - Document downloads

## Environment Variables

No special environment variables are needed for Mattermost integration! It works out of the box once the integration record is created in the database.

This is different from Slack which requires:
- `SLACK_CLIENT_ID`
- `SLACK_CLIENT_SECRET`
- `SLACK_APP_INSTALL_URL`
- `SLACK_INTEGRATION_ID`

## Security Considerations

- **Webhook URLs contain secrets** - Store them securely in the database
- **Validate webhook URLs** - Ensure they point to legitimate Mattermost instances
- **Rate limiting** - Consider implementing rate limits for webhook calls
- **Error handling** - Failed webhook calls are logged but don't block the main application flow

## Future Enhancements

Potential improvements for the Mattermost integration:

1. **OAuth-based installation** - Full OAuth flow like Slack (requires Mattermost app registration)
2. **Channel selection** - Allow users to select specific channels per notification type
3. **Custom message templates** - Let users customize notification messages
4. **Interactive messages** - Add buttons for quick actions (requires OAuth)
5. **Bi-directional integration** - Receive commands from Mattermost
6. **Multi-webhook support** - Allow multiple webhooks for different channels

## Support

For issues or questions:
- Check the application logs for error messages
- Review the API responses for detailed error information
- Verify your Mattermost webhook is working independently
- Ensure the database integration record exists

---

**Built for Supermark** - Open Source Document Sharing Platform
