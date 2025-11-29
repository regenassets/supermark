// Stripe stubs - billing features removed (commercial license)
export const stripeInstance = null;
export const getSubscriptionItem = () => null;
export const getPriceIdFromPlan = () => null;
export const getDisplayNameFromPlan = (plan: string) => plan;
export const getQuantityFromPlan = () => 1;
export const getCouponFromPlan = () => null;
export const STRIPE_PLAN_IDS = {};
export const STRIPE_PRICES = {};

// Plan name mapping - AGPL version (everything is "Free" since no paid plans)
export const PLAN_NAME_MAP: Record<string, string> = {
  free: "Free",
  pro: "Free",
  business: "Free",
  datarooms: "Free",
};

// Subscription discount type
export type SubscriptionDiscount = {
  percent_off: number | null;
  amount_off: number | null;
};
