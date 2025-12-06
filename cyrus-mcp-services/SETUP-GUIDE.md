# DigitalOcean MCP Server Setup Guide

This guide will walk you through setting up the Cyrus MCP server for DigitalOcean access to your Supermark Droplet.

## Prerequisites

- Access to your DigitalOcean account
- SSH key with access to your Droplet
- Droplet ID for your Supermark instance

## Step 1: Get DigitalOcean API Token

1. Log into DigitalOcean: https://cloud.digitalocean.com
2. Go to API settings: https://cloud.digitalocean.com/account/api/tokens
3. Click "Generate New Token"
4. Name it: `Cyrus MCP Access`
5. Select scopes: **Read** and **Write**
6. Click "Generate Token"
7. Copy the token immediately (starts with `dop_v1_`)

⚠️ **Important**: Save this token securely - it won't be shown again!

## Step 2: Get Your Droplet ID

1. Go to Droplets: https://cloud.digitalocean.com/droplets
2. Click on your Supermark Droplet
3. Look at the URL in your browser:
   ```
   https://cloud.digitalocean.com/droplets/{DROPLET_ID}/graphs
   ```
4. Copy the `DROPLET_ID` number

## Step 3: Verify SSH Key Access

Your SSH key must be able to access the Droplet. Test it:

```bash
# Test SSH connection
ssh -i ~/.ssh/id_rsa supermark@YOUR_DROPLET_IP

# If it works, you'll connect to the Droplet
# If not, you need to add your key to the Droplet
```

### If SSH doesn't work, add your key:

```bash
# 1. Get your public key
cat ~/.ssh/id_rsa.pub

# 2. Copy the output

# 3. Log into your Droplet via DigitalOcean console
#    (Droplets > Your Droplet > Access > Launch Console)

# 4. On the Droplet, run:
mkdir -p ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# 5. Test SSH again from your local machine
ssh -i ~/.ssh/id_rsa supermark@YOUR_DROPLET_IP
```

## Step 4: Configure Environment Variables

Create the `.env` file:

```bash
cd /home/cyrus/cyrus-workspaces/REG-53/cyrus-mcp-services
cp .env.example .env
```

Edit `.env` with your values:

```bash
nano .env
```

Fill in:

```env
DIGITALOCEAN_ENABLED=true
DIGITALOCEAN_API_TOKEN=dop_v1_YOUR_TOKEN_HERE
DIGITALOCEAN_DROPLET_ID=YOUR_DROPLET_ID
DIGITALOCEAN_SSH_KEY_PATH=/home/cyrus/.ssh/id_rsa
DIGITALOCEAN_SSH_USER=supermark
DIGITALOCEAN_SSH_PORT=22
```

**Replace**:
- `dop_v1_YOUR_TOKEN_HERE` with your actual API token from Step 1
- `YOUR_DROPLET_ID` with your Droplet ID from Step 2
- Verify `DIGITALOCEAN_SSH_USER` matches your Droplet user (usually `supermark` or `root`)

Save and exit (Ctrl+X, then Y, then Enter).

## Step 5: Test the Build

The MCP server is already built, but let's verify:

```bash
cd /home/cyrus/cyrus-workspaces/REG-53/cyrus-mcp-services
ls -la dist/index.js
```

You should see the compiled JavaScript file. If not, rebuild:

```bash
npm run build
```

## Step 6: Configure MCP in Cyrus

Now we need to tell Cyrus about this MCP server.

### Option A: Create new MCP config

```bash
# Create MCP config directory if it doesn't exist
mkdir -p ~/.cyrus/mcp-configs

# Create the config file
cat > ~/.cyrus/mcp-configs/digitalocean.json << 'EOF'
{
  "mcpServers": {
    "cyrus-digitalocean": {
      "command": "node",
      "args": [
        "/home/cyrus/cyrus-workspaces/REG-53/cyrus-mcp-services/dist/index.js"
      ],
      "env": {
        "DIGITALOCEAN_ENABLED": "true",
        "DIGITALOCEAN_API_TOKEN": "YOUR_TOKEN_HERE",
        "DIGITALOCEAN_DROPLET_ID": "YOUR_DROPLET_ID",
        "DIGITALOCEAN_SSH_KEY_PATH": "/home/cyrus/.ssh/id_rsa",
        "DIGITALOCEAN_SSH_USER": "supermark",
        "DIGITALOCEAN_SSH_PORT": "22"
      }
    }
  }
}
EOF
```

### Edit the config with your actual values:

```bash
nano ~/.cyrus/mcp-configs/digitalocean.json
```

Replace `YOUR_TOKEN_HERE` and `YOUR_DROPLET_ID` with your actual values.

### Option B: Add to existing MCP config

If you already have an MCP config file, add this section to it:

```json
{
  "mcpServers": {
    "cyrus-digitalocean": {
      "command": "node",
      "args": [
        "/home/cyrus/cyrus-workspaces/REG-53/cyrus-mcp-services/dist/index.js"
      ],
      "env": {
        "DIGITALOCEAN_ENABLED": "true",
        "DIGITALOCEAN_API_TOKEN": "your_token",
        "DIGITALOCEAN_DROPLET_ID": "your_droplet_id",
        "DIGITALOCEAN_SSH_KEY_PATH": "/home/cyrus/.ssh/id_rsa",
        "DIGITALOCEAN_SSH_USER": "supermark",
        "DIGITALOCEAN_SSH_PORT": "22"
      }
    }
  }
}
```

## Step 7: Restart Cyrus

Restart the Cyrus service to load the new MCP configuration:

```bash
# Method depends on how Cyrus is running
# If systemd service:
sudo systemctl restart cyrus

# Or if running in tmux/screen, restart the session
```

## Step 8: Test the Connection

Once Cyrus restarts, test that it can access the MCP server:

Ask Cyrus:
```
@cyrus Can you list the Droplets in my DigitalOcean account?
```

Or test a Docker operation:
```
@cyrus List the Docker containers running on the Supermark Droplet
```

Or check system resources:
```
@cyrus Check the CPU and memory usage on the Droplet
```

## Verification Checklist

- [ ] DigitalOcean API token obtained (starts with `dop_v1_`)
- [ ] Droplet ID found (numeric)
- [ ] SSH key works (tested connection)
- [ ] `.env` file created with correct values
- [ ] MCP server builds successfully (`dist/index.js` exists)
- [ ] MCP config file created at `~/.cyrus/mcp-configs/digitalocean.json`
- [ ] Cyrus restarted to load new config
- [ ] Test commands work

## Troubleshooting

### Can't get API token
- Make sure you're logged into DigitalOcean
- Go directly to: https://cloud.digitalocean.com/account/api/tokens
- Ensure you select **both Read and Write** scopes

### SSH connection fails
- Verify SSH key path is correct: `ls -la ~/.ssh/id_rsa`
- Check key permissions: `chmod 600 ~/.ssh/id_rsa`
- Test manual SSH: `ssh -i ~/.ssh/id_rsa supermark@DROPLET_IP`
- If still fails, use DigitalOcean console to add your public key

### MCP server not loading
- Check Cyrus logs for errors
- Verify absolute paths in MCP config
- Test server manually: `cd cyrus-mcp-services && node dist/index.js`
- Ensure all environment variables are set correctly

### Permission errors
- Verify SSH key permissions: `chmod 600 ~/.ssh/id_rsa`
- Ensure Cyrus can read the SSH key
- Check Droplet user is correct (usually `supermark` or `root`)

## Security Notes

- Keep your API token secure - never commit it to git
- Use read/write token only if necessary; read-only is safer
- Rotate tokens periodically
- Monitor API usage in DigitalOcean dashboard
- Consider creating a dedicated Droplet user for Cyrus with limited sudo access

## Next Steps

Once configured, Cyrus can:
- Check Droplet status and resource usage
- View and restart Docker containers
- Access application and system logs
- Execute commands to fix issues
- Monitor Supermark service health
- Troubleshoot deployment problems directly

You no longer need to manually SSH into the Droplet for troubleshooting - Cyrus can do it all!

## Support

If you encounter issues:
1. Check this guide again carefully
2. Verify all credentials are correct
3. Test SSH access manually first
4. Check Cyrus logs for specific error messages
5. Refer to README.md for detailed tool documentation

---

**Ready to go!** Cyrus now has direct access to your Supermark Droplet for troubleshooting and management. 🎉
