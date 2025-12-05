import { z } from "zod";

/**
 * DigitalOcean provider configuration schema
 */
export const DigitalOceanConfigSchema = z.object({
  apiToken: z.string().describe("DigitalOcean API token"),
  dropletId: z.string().optional().describe("Default Droplet ID for operations"),
  sshKeyPath: z.string().optional().describe("Path to SSH private key for Droplet access"),
  sshUser: z.string().default("root").describe("SSH user for Droplet access"),
  sshPort: z.number().default(22).describe("SSH port for Droplet access"),
});

export type DigitalOceanConfig = z.infer<typeof DigitalOceanConfigSchema>;

/**
 * Droplet information from DigitalOcean API
 */
export interface Droplet {
  id: number;
  name: string;
  status: string;
  memory: number;
  vcpus: number;
  disk: number;
  region: {
    name: string;
    slug: string;
  };
  image: {
    name: string;
    distribution: string;
  };
  size_slug: string;
  networks: {
    v4: Array<{
      ip_address: string;
      type: string;
    }>;
    v6: Array<{
      ip_address: string;
      type: string;
    }>;
  };
  created_at: string;
  tags: string[];
}

/**
 * Droplet action result
 */
export interface DropletAction {
  id: number;
  status: string;
  type: string;
  started_at: string;
  completed_at?: string;
  resource_id: number;
  resource_type: string;
  region?: {
    name: string;
    slug: string;
  };
}

/**
 * Docker container information
 */
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: string;
  ports: string;
}

/**
 * Resource usage information
 */
export interface ResourceUsage {
  cpu: {
    usage_percent: number;
    load_average: number[];
  };
  memory: {
    total: string;
    used: string;
    free: string;
    usage_percent: number;
  };
  disk: {
    total: string;
    used: string;
    free: string;
    usage_percent: number;
  };
  timestamp: string;
}

/**
 * Command execution result
 */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  timestamp: string;
}

/**
 * Snapshot information
 */
export interface Snapshot {
  id: number;
  name: string;
  created_at: string;
  regions: string[];
  min_disk_size: number;
  size_gigabytes: number;
  type: string;
}
