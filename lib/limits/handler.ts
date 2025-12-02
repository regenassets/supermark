/**
 * Client-side limits handler - AGPL implementation
 */
import { DEFAULT_PLAN_LIMITS } from "./constants";

/**
 * Check if a feature is allowed (always returns true for self-hosted)
 */
export function isFeatureAllowed(feature: string): boolean {
  return true;
}

/**
 * Check if limit is reached (always returns false for self-hosted)
 */
export function isLimitReached(limitType: string, current: number): boolean {
  return false;
}

/**
 * Get remaining count (always returns high number for self-hosted)
 */
export function getRemaining(limitType: string, current: number): number {
  return 999999;
}

export { DEFAULT_PLAN_LIMITS as PLAN_LIMITS };

/**
 * Default handler for limits API endpoint
 */
const handler = async (req: any, res: any) => {
  // Return unlimited for self-hosted AGPL version
  return res.status(200).json({
    users: null,
    links: null,
    documents: null,
    domains: null,
    datarooms: null,
    customDomainOnPro: true,
    customDomainInDataroom: true,
    advancedLinkControlsOnPro: true,
  });
};

export default handler;
