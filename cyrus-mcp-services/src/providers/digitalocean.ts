import { z } from "zod";
import {
  ServiceProvider,
  ToolDefinition,
  ToolResult,
} from "../types/provider.js";
import {
  DigitalOceanConfig,
  DigitalOceanConfigSchema,
  Droplet,
  DropletAction,
  CommandResult,
} from "../types/digitalocean.js";
import { APIClient } from "../utils/api-client.js";
import { SSHClient } from "../utils/ssh-client.js";

/**
 * DigitalOcean service provider for Droplet management and troubleshooting
 */
export class DigitalOceanProvider implements ServiceProvider {
  readonly name = "digitalocean";
  readonly description = "DigitalOcean Droplet management and remote troubleshooting";

  private config?: DigitalOceanConfig;
  private apiClient?: APIClient;
  private sshClient?: SSHClient;

  async initialize(config: Record<string, any>): Promise<void> {
    // Validate configuration
    this.config = DigitalOceanConfigSchema.parse(config);

    // Initialize API client
    this.apiClient = new APIClient({
      baseURL: "https://api.digitalocean.com/v2",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiToken}`,
      },
    });
  }

  /**
   * Get or create SSH client for the droplet
   */
  private async getSSHClient(dropletId?: string): Promise<SSHClient> {
    if (!this.config) {
      throw new Error("Provider not initialized");
    }

    const targetDropletId = dropletId || this.config.dropletId;
    if (!targetDropletId) {
      throw new Error("Droplet ID is required");
    }

    // Get droplet IP if we don't have an SSH client yet
    if (!this.sshClient) {
      const droplet = await this.getDropletInfo(targetDropletId);
      const publicIP = droplet.networks.v4.find((net) => net.type === "public");

      if (!publicIP) {
        throw new Error(`No public IP found for droplet ${targetDropletId}`);
      }

      if (!this.config.sshKeyPath) {
        throw new Error("SSH key path is required for SSH operations");
      }

      this.sshClient = new SSHClient({
        host: publicIP.ip_address,
        port: this.config.sshPort,
        username: this.config.sshUser,
        privateKeyPath: this.config.sshKeyPath,
      });
    }

    return this.sshClient;
  }

  /**
   * Get droplet information from API
   */
  private async getDropletInfo(dropletId: string): Promise<Droplet> {
    if (!this.apiClient) {
      throw new Error("Provider not initialized");
    }

    const response = await this.apiClient.get<{ droplet: Droplet }>(
      `/droplets/${dropletId}`
    );
    return response.droplet;
  }

  getTools(): ToolDefinition[] {
    return [
      // Droplet Management
      {
        name: "digitalocean_list_droplets",
        description: "List all Droplets in your DigitalOcean account",
        inputSchema: z.object({
          page: z.number().default(1).describe("Page number for pagination"),
          perPage: z.number().default(20).describe("Results per page"),
        }),
      },
      {
        name: "digitalocean_get_droplet",
        description: "Get detailed information about a specific Droplet",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
        }),
      },
      {
        name: "digitalocean_reboot_droplet",
        description: "Reboot a Droplet",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
        }),
      },
      {
        name: "digitalocean_create_snapshot",
        description: "Create a snapshot backup of a Droplet",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          name: z.string().describe("Snapshot name"),
        }),
      },

      // SSH Command Execution
      {
        name: "digitalocean_execute_command",
        description: "Execute a shell command on the Droplet via SSH",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          command: z.string().describe("Shell command to execute"),
          cwd: z.string().optional().describe("Working directory for command"),
        }),
      },

      // Docker Operations
      {
        name: "digitalocean_list_docker_containers",
        description: "List Docker containers running on the Droplet",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          all: z
            .boolean()
            .default(false)
            .describe("Show all containers (including stopped)"),
        }),
      },
      {
        name: "digitalocean_docker_logs",
        description: "Get logs from a Docker container",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          containerName: z.string().describe("Container name or ID"),
          tail: z
            .number()
            .optional()
            .describe("Number of lines to show from end of logs"),
        }),
      },
      {
        name: "digitalocean_docker_exec",
        description: "Execute a command inside a Docker container",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          containerName: z.string().describe("Container name or ID"),
          command: z.string().describe("Command to execute inside container"),
        }),
      },
      {
        name: "digitalocean_docker_compose_command",
        description: "Execute a Docker Compose command (for Supermark services)",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          command: z.string().describe("Docker Compose command (e.g., 'ps', 'restart supermark')"),
          cwd: z
            .string()
            .default("~/supermark")
            .describe("Working directory (default: ~/supermark)"),
          envFile: z
            .string()
            .default(".env.production")
            .describe("Environment file to use"),
        }),
      },

      // System Monitoring
      {
        name: "digitalocean_get_resource_usage",
        description: "Get CPU, memory, and disk usage statistics",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
        }),
      },
      {
        name: "digitalocean_get_system_logs",
        description: "Get system logs (journalctl)",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          service: z
            .string()
            .optional()
            .describe("Specific service to get logs for"),
          lines: z.number().default(100).describe("Number of log lines to retrieve"),
        }),
      },

      // File Operations
      {
        name: "digitalocean_read_file",
        description: "Read a file from the Droplet",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          path: z.string().describe("File path on the Droplet"),
        }),
      },
      {
        name: "digitalocean_path_exists",
        description: "Check if a file or directory exists on the Droplet",
        inputSchema: z.object({
          dropletId: z
            .string()
            .optional()
            .describe("Droplet ID (uses default if not provided)"),
          path: z.string().describe("File or directory path to check"),
        }),
      },
    ];
  }

  async executeTool(toolName: string, args: any): Promise<ToolResult> {
    try {
      switch (toolName) {
        case "digitalocean_list_droplets":
          return await this.listDroplets(args);
        case "digitalocean_get_droplet":
          return await this.getDroplet(args);
        case "digitalocean_reboot_droplet":
          return await this.rebootDroplet(args);
        case "digitalocean_create_snapshot":
          return await this.createSnapshot(args);
        case "digitalocean_execute_command":
          return await this.executeCommand(args);
        case "digitalocean_list_docker_containers":
          return await this.listDockerContainers(args);
        case "digitalocean_docker_logs":
          return await this.getDockerLogs(args);
        case "digitalocean_docker_exec":
          return await this.dockerExec(args);
        case "digitalocean_docker_compose_command":
          return await this.dockerComposeCommand(args);
        case "digitalocean_get_resource_usage":
          return await this.getResourceUsage(args);
        case "digitalocean_get_system_logs":
          return await this.getSystemLogs(args);
        case "digitalocean_read_file":
          return await this.readFile(args);
        case "digitalocean_path_exists":
          return await this.checkPathExists(args);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Tool Implementations

  private async listDroplets(args: {
    page?: number;
    perPage?: number;
  }): Promise<ToolResult> {
    if (!this.apiClient) {
      throw new Error("Provider not initialized");
    }

    const response = await this.apiClient.get<{
      droplets: Droplet[];
      meta: { total: number };
    }>("/droplets", {
      page: args.page || 1,
      per_page: args.perPage || 20,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total: response.meta.total,
              droplets: response.droplets.map((d) => ({
                id: d.id,
                name: d.name,
                status: d.status,
                ip: d.networks.v4.find((n) => n.type === "public")?.ip_address,
                region: d.region.slug,
                size: d.size_slug,
                created: d.created_at,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getDroplet(args: { dropletId?: string }): Promise<ToolResult> {
    const targetDropletId = args.dropletId || this.config?.dropletId;
    if (!targetDropletId) {
      throw new Error("Droplet ID is required");
    }

    const droplet = await this.getDropletInfo(targetDropletId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(droplet, null, 2),
        },
      ],
    };
  }

  private async rebootDroplet(args: { dropletId?: string }): Promise<ToolResult> {
    if (!this.apiClient) {
      throw new Error("Provider not initialized");
    }

    const targetDropletId = args.dropletId || this.config?.dropletId;
    if (!targetDropletId) {
      throw new Error("Droplet ID is required");
    }

    const response = await this.apiClient.post<{ action: DropletAction }>(
      `/droplets/${targetDropletId}/actions`,
      { type: "reboot" }
    );

    return {
      content: [
        {
          type: "text",
          text: `Droplet reboot initiated. Action ID: ${response.action.id}, Status: ${response.action.status}`,
        },
      ],
    };
  }

  private async createSnapshot(args: {
    dropletId?: string;
    name: string;
  }): Promise<ToolResult> {
    if (!this.apiClient) {
      throw new Error("Provider not initialized");
    }

    const targetDropletId = args.dropletId || this.config?.dropletId;
    if (!targetDropletId) {
      throw new Error("Droplet ID is required");
    }

    const response = await this.apiClient.post<{ action: DropletAction }>(
      `/droplets/${targetDropletId}/actions`,
      {
        type: "snapshot",
        name: args.name,
      }
    );

    return {
      content: [
        {
          type: "text",
          text: `Snapshot creation initiated. Action ID: ${response.action.id}, Name: ${args.name}`,
        },
      ],
    };
  }

  private async executeCommand(args: {
    dropletId?: string;
    command: string;
    cwd?: string;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const result = await ssh.executeCommand(args.command, { cwd: args.cwd });

    const commandResult: CommandResult = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.code || 0,
      command: args.command,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(commandResult, null, 2),
        },
      ],
      isError: result.code !== 0,
    };
  }

  private async listDockerContainers(args: {
    dropletId?: string;
    all?: boolean;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const output = await ssh.listDockerContainers(args.all || false);

    // Parse the output into structured format
    const containers = output
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [id, name, image, status, state, created, ports] = line.split("\t");
        return { id, name, image, status, state, created, ports };
      });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ containers }, null, 2),
        },
      ],
    };
  }

  private async getDockerLogs(args: {
    dropletId?: string;
    containerName: string;
    tail?: number;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const logs = await ssh.getDockerLogs(args.containerName, {
      tail: args.tail,
    });

    return {
      content: [
        {
          type: "text",
          text: `=== Logs for ${args.containerName} ===\n\n${logs}`,
        },
      ],
    };
  }

  private async dockerExec(args: {
    dropletId?: string;
    containerName: string;
    command: string;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const result = await ssh.executeCommand(
      `docker exec ${args.containerName} ${args.command}`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.code || 0,
            },
            null,
            2
          ),
        },
      ],
      isError: result.code !== 0,
    };
  }

  private async dockerComposeCommand(args: {
    dropletId?: string;
    command: string;
    cwd?: string;
    envFile?: string;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const result = await ssh.executeDockerComposeCommand(args.command, {
      cwd: args.cwd || "~/supermark",
      envFile: args.envFile || ".env.production",
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              command: `docker compose --env-file ${args.envFile} ${args.command}`,
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.code || 0,
            },
            null,
            2
          ),
        },
      ],
      isError: result.code !== 0,
    };
  }

  private async getResourceUsage(args: {
    dropletId?: string;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const usage = await ssh.getResourceUsage();

    return {
      content: [
        {
          type: "text",
          text: `=== System Resource Usage ===\n\n--- CPU ---\n${usage.cpu}\n\n--- Memory ---\n${usage.memory}\n\n--- Disk ---\n${usage.disk}`,
        },
      ],
    };
  }

  private async getSystemLogs(args: {
    dropletId?: string;
    service?: string;
    lines?: number;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const serviceFlag = args.service ? `-u ${args.service}` : "";
    const linesFlag = `-n ${args.lines || 100}`;

    const result = await ssh.executeCommand(
      `sudo journalctl ${serviceFlag} ${linesFlag} --no-pager`
    );

    return {
      content: [
        {
          type: "text",
          text: `=== System Logs ${args.service ? `(${args.service})` : ""} ===\n\n${result.stdout}`,
        },
      ],
    };
  }

  private async readFile(args: {
    dropletId?: string;
    path: string;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const content = await ssh.readFile(args.path);

    return {
      content: [
        {
          type: "text",
          text: `=== File: ${args.path} ===\n\n${content}`,
        },
      ],
    };
  }

  private async checkPathExists(args: {
    dropletId?: string;
    path: string;
  }): Promise<ToolResult> {
    const ssh = await this.getSSHClient(args.dropletId);
    const exists = await ssh.pathExists(args.path);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              path: args.path,
              exists,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
