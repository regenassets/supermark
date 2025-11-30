import { BasePlan } from "../swr/use-billing";

// In Trigger.dev v4, queue is just a string name
// Concurrency limits are configured in the queue settings on the dashboard
export const conversionQueue = (plan: string): string => {
  const planName = plan.split("+")[0] as BasePlan;
  return `conversion-${planName}`;
};
