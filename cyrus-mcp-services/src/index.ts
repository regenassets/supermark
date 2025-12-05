#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";
import { ServiceProvider, ProviderRegistryEntry } from "./types/provider.js";
import { DigitalOceanProvider } from "./providers/digitalocean.js";

// Load environment variables
dotenv.config();

/**
 * Main MCP Server for Cyrus
 * Provides extensible service provider integration for DigitalOcean and other services
 */
class CyrusMCPServer {
  private server: Server;
  private providers: Map<string, ProviderRegistryEntry> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: "cyrus-mcp-services",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Register a service provider
   */
  async registerProvider(
    provider: ServiceProvider,
    config: Record<string, any>,
    enabled: boolean = true
  ): Promise<void> {
    if (enabled) {
      await provider.initialize(config);
      this.providers.set(provider.name, { provider, config, enabled });
      console.error(`[Cyrus MCP] Registered provider: ${provider.name}`);
    } else {
      console.warn(`[Cyrus MCP] Skipping disabled provider: ${provider.name}`);
    }
  }

  /**
   * Get all tools from all registered providers
   */
  private getAllTools(): Tool[] {
    const tools: Tool[] = [];

    for (const [providerName, entry] of this.providers.entries()) {
      if (!entry.enabled) continue;

      const providerTools = entry.provider.getTools();
      for (const tool of providerTools) {
        tools.push({
          name: tool.name,
          description: `[${providerName}] ${tool.description}`,
          inputSchema: this.zodToJsonSchema(tool.inputSchema) as any,
        });
      }
    }

    return tools;
  }

  /**
   * Convert Zod schema to JSON Schema
   */
  private zodToJsonSchema(schema: z.ZodType<any>): any {
    if (schema instanceof z.ZodObject) {
      const shape = schema._def.shape();
      const properties: any = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as z.ZodType<any>;
        properties[key] = this.zodToJsonSchema(fieldSchema);

        // Check if field is required
        if (
          !(fieldSchema instanceof z.ZodOptional) &&
          !(fieldSchema instanceof z.ZodDefault)
        ) {
          required.push(key);
        }
      }

      return {
        type: "object",
        properties,
        ...(required.length > 0 && { required }),
      };
    }

    if (schema instanceof z.ZodString) {
      const result: any = { type: "string" };
      if (schema.description) result.description = schema.description;
      return result;
    }

    if (schema instanceof z.ZodNumber) {
      const result: any = { type: "number" };
      if (schema.description) result.description = schema.description;
      return result;
    }

    if (schema instanceof z.ZodBoolean) {
      const result: any = { type: "boolean" };
      if (schema.description) result.description = schema.description;
      return result;
    }

    if (schema instanceof z.ZodArray) {
      const result: any = {
        type: "array",
        items: this.zodToJsonSchema(schema._def.type),
      };
      if (schema.description) result.description = schema.description;
      return result;
    }

    if (schema instanceof z.ZodEnum || schema instanceof z.ZodNativeEnum) {
      const result: any = {
        type: "string",
        enum: schema._def.values,
      };
      if (schema.description) result.description = schema.description;
      return result;
    }

    if (schema instanceof z.ZodOptional) {
      return this.zodToJsonSchema(schema._def.innerType);
    }

    if (schema instanceof z.ZodDefault) {
      const innerSchema = this.zodToJsonSchema(schema._def.innerType);
      innerSchema.default = schema._def.defaultValue();
      return innerSchema;
    }

    // Default fallback
    return { type: "string" };
  }

  /**
   * Execute a tool from the appropriate provider
   */
  private async executeTool(toolName: string, args: any): Promise<any> {
    // Find which provider owns this tool
    for (const entry of this.providers.values()) {
      if (!entry.enabled) continue;

      const providerTools = entry.provider.getTools();
      const tool = providerTools.find((t) => t.name === toolName);

      if (tool) {
        // Validate args against the tool's schema
        const validatedArgs = tool.inputSchema.parse(args);

        // Execute the tool
        const result = await entry.provider.executeTool(toolName, validatedArgs);
        return result;
      }
    }

    throw new Error(`Tool not found: ${toolName}`);
  }

  /**
   * Setup request handlers
   */
  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.getAllTools();
      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await this.executeTool(request.params.name, request.params.arguments);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Cyrus MCP] Tool execution error: ${errorMessage}`);

        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("[Cyrus MCP] Server started successfully");
  }
}

/**
 * Initialize and start the server
 */
async function main() {
  try {
    const server = new CyrusMCPServer();

    // Register DigitalOcean provider
    const doEnabled = process.env.DIGITALOCEAN_ENABLED === "true";
    if (doEnabled) {
      const doProvider = new DigitalOceanProvider();
      await server.registerProvider(
        doProvider,
        {
          apiToken: process.env.DIGITALOCEAN_API_TOKEN,
          dropletId: process.env.DIGITALOCEAN_DROPLET_ID,
          sshKeyPath: process.env.DIGITALOCEAN_SSH_KEY_PATH,
          sshUser: process.env.DIGITALOCEAN_SSH_USER || "root",
          sshPort: process.env.DIGITALOCEAN_SSH_PORT
            ? parseInt(process.env.DIGITALOCEAN_SSH_PORT)
            : 22,
        },
        true
      );
    }

    // Start the server
    await server.start();
  } catch (error) {
    console.error("[Cyrus MCP] Fatal error:", error);
    process.exit(1);
  }
}

main();
