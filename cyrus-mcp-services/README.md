# Cyrus MCP Services

An extensible Model Context Protocol (MCP) server that provides Cyrus with direct access to DigitalOcean Droplets for troubleshooting, deployment management, and infrastructure control.

## Features

### DigitalOcean Integration
- **Droplet Management**: List, inspect, and manage DigitalOcean Droplets
- **SSH Command Execution**: Run any shell command on Droplets remotely
- **Docker Operations**: Full control over Docker containers and Docker Compose services
- **System Monitoring**: Real-time CPU, memory, and disk usage statistics
- **Log Access**: Retrieve system logs, Docker logs, and application logs
- **File Operations**: Read files and check paths on remote Droplets
- **Snapshot Management**: Create backup snapshots of Droplets

### Tools Available

#### Droplet Management (4 tools)
1. `digitalocean_list_droplets` - List all Droplets in your account
2. `digitalocean_get_droplet` - Get detailed Droplet information
3. `digitalocean_reboot_droplet` - Reboot a Droplet
4. `digitalocean_create_snapshot` - Create a backup snapshot

#### SSH Command Execution (1 tool)
5. `digitalocean_execute_command` - Execute any shell command via SSH

#### Docker Operations (4 tools)
6. `digitalocean_list_docker_containers` - List running containers
7. `digitalocean_docker_logs` - Get container logs
8. `digitalocean_docker_exec` - Execute command inside a container
9. `digitalocean_docker_compose_command` - Run Docker Compose commands

#### System Monitoring (2 tools)
10. `digitalocean_get_resource_usage` - Get CPU/memory/disk stats
11. `digitalocean_get_system_logs` - Get system logs (journalctl)

#### File Operations (2 tools)
12. `digitalocean_read_file` - Read a file from the Droplet
13. `digitalocean_path_exists` - Check if a path exists

**Total: 13 tools** for complete Droplet control and troubleshooting.

## Installation

### 1. Clone or Create the Directory

```bash
cd /home/cyrus/cyrus-workspaces/REG-53/cyrus-mcp-services
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# DigitalOcean Configuration
DIGITALOCEAN_ENABLED=true
DIGITALOCEAN_API_TOKEN=dop_v1_your_api_token_here
DIGITALOCEAN_DROPLET_ID=your_droplet_id_here
DIGITALOCEAN_SSH_KEY_PATH=/home/cyrus/.ssh/id_rsa
DIGITALOCEAN_SSH_USER=root
DIGITALOCEAN_SSH_PORT=22
```

### Getting Credentials

#### DigitalOcean API Token
1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Select Read & Write scopes
4. Copy the token (starts with `dop_v1_`)

#### Droplet ID
1. Go to https://cloud.digitalocean.com/droplets
2. Click on your Supermark Droplet
3. The ID is in the URL: `/droplets/{ID}/graphs`

#### SSH Key Setup
Your SSH key must be added to the Droplet's authorized keys:

```bash
# On your local machine
cat ~/.ssh/id_rsa.pub

# Copy the output, then on the Droplet:
echo "your_public_key" >> ~/.ssh/authorized_keys
```

### MCP Configuration for Cyrus

Update your Cyrus MCP configuration file (usually `~/.cyrus/mcp-configs/*.json`):

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
        "DIGITALOCEAN_API_TOKEN": "dop_v1_your_token",
        "DIGITALOCEAN_DROPLET_ID": "your_droplet_id",
        "DIGITALOCEAN_SSH_KEY_PATH": "/home/cyrus/.ssh/id_rsa",
        "DIGITALOCEAN_SSH_USER": "supermark",
        "DIGITALOCEAN_SSH_PORT": "22"
      }
    }
  }
}
```

**Important**: Use absolute paths for:
- The compiled `index.js` file
- The SSH private key path

## Usage Examples

Once configured, Cyrus can use these tools directly:

### Check Droplet Status
```
Cyrus, what's the status of the Supermark Droplet?
```

### View Docker Containers
```
Cyrus, list all running Docker containers on the Droplet
```

### Check Application Logs
```
Cyrus, show me the last 50 lines of logs from the supermark container
```

### Monitor Resources
```
Cyrus, check CPU and memory usage on the Droplet
```

### Run Docker Compose Commands
```
Cyrus, restart the supermark service using Docker Compose
```

### Execute Custom Commands
```
Cyrus, run "df -h" on the Droplet to check disk space
```

### Troubleshoot Issues
```
Cyrus, the supermark app is down. Check the logs and fix it.
```

Cyrus will automatically:
1. Execute `digitalocean_docker_compose_command` to check service status
2. Use `digitalocean_docker_logs` to view error logs
3. Identify the issue (e.g., environment variable missing)
4. Fix it using `digitalocean_execute_command` or restart services

## Architecture

### Extensible Provider System

The MCP server uses a plugin architecture that makes it easy to add new service providers:

```
cyrus-mcp-services/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── providers/
│   │   └── digitalocean.ts   # DigitalOcean provider
│   ├── types/
│   │   ├── provider.ts       # Provider interface
│   │   └── digitalocean.ts   # DigitalOcean types
│   └── utils/
│       ├── api-client.ts     # HTTP client
│       └── ssh-client.ts     # SSH client
```

### Provider Interface

All providers implement the `ServiceProvider` interface:

```typescript
interface ServiceProvider {
  name: string;
  description: string;
  initialize(config: Record<string, any>): Promise<void>;
  getTools(): ToolDefinition[];
  executeTool(toolName: string, args: any): Promise<ToolResult>;
}
```

### Adding New Providers

To add a new provider (e.g., AWS, Cloudflare):

1. Create `src/providers/your-provider.ts`
2. Implement the `ServiceProvider` interface
3. Register in `src/index.ts`
4. Add environment variables to `.env.example`

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

### Clean

```bash
npm run clean
```

## Supermark-Specific Integration

This MCP server is specifically designed to work with Supermark deployments on DigitalOcean:

### Default Configuration
- Working directory: `~/supermark`
- Environment file: `.env.production`
- Docker Compose project name: `supermark`

### Common Supermark Operations

#### Restart Services
```bash
# Via Cyrus
digitalocean_docker_compose_command:
  command: "restart supermark"
  cwd: "~/supermark"
  envFile: ".env.production"
```

#### View Application Logs
```bash
# Via Cyrus
digitalocean_docker_logs:
  containerName: "supermark"
  tail: 100
```

#### Check Service Health
```bash
# Via Cyrus
digitalocean_docker_compose_command:
  command: "ps"
```

#### Access Environment File
```bash
# Via Cyrus
digitalocean_read_file:
  path: "~/supermark/.env.production"
```

## Security Considerations

### Credentials
- Never commit `.env` files to git
- Store API tokens securely
- Use read-only tokens when possible
- Rotate tokens regularly

### SSH Keys
- Use dedicated SSH keys for automation
- Never share private keys
- Use strong passphrase protection
- Restrict key permissions: `chmod 600 ~/.ssh/id_rsa`

### Network Access
- Ensure firewall rules allow SSH (port 22)
- Consider using DigitalOcean's private networking
- Use SSH key authentication (never passwords)

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to Droplet via SSH

**Solutions**:
1. Verify SSH key path is correct
2. Check key permissions: `chmod 600 ~/.ssh/id_rsa`
3. Test manual SSH: `ssh -i ~/.ssh/id_rsa user@droplet-ip`
4. Verify SSH key is in Droplet's `~/.ssh/authorized_keys`

### API Authentication Errors

**Problem**: DigitalOcean API returns 401 Unauthorized

**Solutions**:
1. Verify API token is correct (starts with `dop_v1_`)
2. Check token hasn't expired
3. Ensure token has Read & Write scopes
4. Test API manually: `curl -H "Authorization: Bearer $TOKEN" https://api.digitalocean.com/v2/account`

### Build Errors

**Problem**: TypeScript compilation fails

**Solutions**:
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Clean build: `npm run clean && npm run build`
3. Check TypeScript version: `npx tsc --version`

### MCP Server Not Starting

**Problem**: Cyrus can't connect to MCP server

**Solutions**:
1. Verify build completed: `ls dist/index.js`
2. Check MCP config path is absolute
3. Test server directly: `node dist/index.js`
4. Check Cyrus logs for error messages

## Logs and Debugging

The MCP server logs to stderr (visible in Cyrus console):

```
[Cyrus MCP] Registered provider: digitalocean
[Cyrus MCP] Server started successfully
[Cyrus MCP] Tool execution error: ...
```

Enable verbose logging by checking Cyrus debug settings.

## License

MIT

## Support

For issues related to:
- **MCP Server**: Open issue in the Supermark repo
- **DigitalOcean API**: Check https://docs.digitalocean.com/reference/api/
- **Cyrus Integration**: Contact Cyrus support

## Credits

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP server framework
- [node-ssh](https://github.com/steelbrain/node-ssh) - SSH client
- [axios](https://github.com/axios/axios) - HTTP client
- [zod](https://github.com/colinhacks/zod) - Schema validation

---

**Happy Troubleshooting!** With this MCP server, Cyrus can directly access and fix issues on your Supermark Droplet without manual intervention. 🚀
