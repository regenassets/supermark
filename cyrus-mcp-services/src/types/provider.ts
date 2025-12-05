import { z } from "zod";

/**
 * Result of a tool execution
 */
export interface ToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Tool definition with input validation schema
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}

/**
 * Service provider interface
 * All providers (DigitalOcean, Namecheap, Cloudflare, etc.) must implement this
 */
export interface ServiceProvider {
  /** Provider name (e.g., "digitalocean", "namecheap") */
  readonly name: string;

  /** Provider description */
  readonly description: string;

  /**
   * Initialize the provider with configuration
   * @param config Configuration object (will be validated by provider)
   */
  initialize(config: Record<string, any>): Promise<void>;

  /**
   * Get all tools provided by this provider
   */
  getTools(): ToolDefinition[];

  /**
   * Execute a specific tool
   * @param toolName Name of the tool to execute
   * @param args Tool arguments (validated against inputSchema)
   */
  executeTool(toolName: string, args: any): Promise<ToolResult>;
}

/**
 * Provider registry entry
 */
export interface ProviderRegistryEntry {
  provider: ServiceProvider;
  config: Record<string, any>;
  enabled: boolean;
}
