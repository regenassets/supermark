// AGPL: Make Trigger.dev optional for local development and self-hosted deployments

const isTriggerConfigured = !!(
  process.env.TRIGGER_SECRET_KEY
);

// Helper to check if Trigger.dev is available
export const isTriggerAvailable = () => isTriggerConfigured;

// Log warning when Trigger is not configured
export const logTriggerUnavailable = (taskName: string) => {
  console.warn(`Trigger.dev not configured - ${taskName} task will not run. Configure TRIGGER_SECRET_KEY to enable background jobs.`);
};
