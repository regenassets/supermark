import { NodeSSH, SSHExecCommandResponse } from "node-ssh";
import { readFileSync } from "fs";

/**
 * SSH client configuration
 */
export interface SSHConfig {
  host: string;
  port?: number;
  username: string;
  privateKeyPath?: string;
  password?: string;
}

/**
 * SSH client for executing commands on remote servers
 */
export class SSHClient {
  private ssh: NodeSSH;
  private config: SSHConfig;
  private connected: boolean = false;

  constructor(config: SSHConfig) {
    this.ssh = new NodeSSH();
    this.config = config;
  }

  /**
   * Connect to the SSH server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const connectionConfig: any = {
      host: this.config.host,
      port: this.config.port || 22,
      username: this.config.username,
    };

    // Use private key if provided, otherwise use password
    if (this.config.privateKeyPath) {
      try {
        connectionConfig.privateKey = readFileSync(this.config.privateKeyPath, "utf8");
      } catch (error) {
        throw new Error(
          `Failed to read SSH private key from ${this.config.privateKeyPath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    } else if (this.config.password) {
      connectionConfig.password = this.config.password;
    } else {
      throw new Error("Either privateKeyPath or password must be provided");
    }

    try {
      await this.ssh.connect(connectionConfig);
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to connect to SSH server at ${this.config.host}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Execute a command on the remote server
   */
  async executeCommand(
    command: string,
    options?: { cwd?: string }
  ): Promise<SSHExecCommandResponse> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.ssh.execCommand(command, options);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to execute command "${command}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Execute a Docker command
   */
  async executeDockerCommand(
    command: string,
    options?: { cwd?: string }
  ): Promise<SSHExecCommandResponse> {
    return this.executeCommand(`docker ${command}`, options);
  }

  /**
   * Execute a Docker Compose command
   */
  async executeDockerComposeCommand(
    command: string,
    options?: { cwd?: string; envFile?: string }
  ): Promise<SSHExecCommandResponse> {
    const envFileFlag = options?.envFile ? `--env-file ${options.envFile}` : "";
    return this.executeCommand(
      `docker compose ${envFileFlag} ${command}`,
      options
    );
  }

  /**
   * Get Docker container logs
   */
  async getDockerLogs(
    containerName: string,
    options?: { tail?: number; follow?: boolean }
  ): Promise<string> {
    const tailFlag = options?.tail ? `--tail ${options.tail}` : "";
    const followFlag = options?.follow ? "-f" : "";

    const result = await this.executeDockerCommand(
      `logs ${tailFlag} ${followFlag} ${containerName}`
    );

    return result.stdout || result.stderr;
  }

  /**
   * List Docker containers
   */
  async listDockerContainers(all: boolean = false): Promise<string> {
    const allFlag = all ? "-a" : "";
    const result = await this.executeDockerCommand(
      `ps ${allFlag} --format "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.State}}\t{{.CreatedAt}}\t{{.Ports}}"`
    );
    return result.stdout;
  }

  /**
   * Get system resource usage
   */
  async getResourceUsage(): Promise<{
    cpu: string;
    memory: string;
    disk: string;
  }> {
    const [cpuResult, memResult, diskResult] = await Promise.all([
      this.executeCommand("top -bn1 | grep 'Cpu(s)' && uptime"),
      this.executeCommand("free -h"),
      this.executeCommand("df -h /"),
    ]);

    return {
      cpu: cpuResult.stdout,
      memory: memResult.stdout,
      disk: diskResult.stdout,
    };
  }

  /**
   * Read a file from the remote server
   */
  async readFile(remotePath: string): Promise<string> {
    if (!this.connected) {
      await this.connect();
    }

    const result = await this.executeCommand(`cat ${remotePath}`);
    if (result.code !== 0) {
      throw new Error(`Failed to read file ${remotePath}: ${result.stderr}`);
    }
    return result.stdout;
  }

  /**
   * Check if a path exists on the remote server
   */
  async pathExists(remotePath: string): Promise<boolean> {
    if (!this.connected) {
      await this.connect();
    }

    const result = await this.executeCommand(`test -e ${remotePath} && echo "exists"`);
    return result.stdout.trim() === "exists";
  }

  /**
   * Disconnect from the SSH server
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      this.ssh.dispose();
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
