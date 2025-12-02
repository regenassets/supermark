// Stripe stubs - billing features removed (commercial license)
export const stripeInstance = null;
export const getSubscriptionItem = (...args: any[]) => ({
  id: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  discount: null,
});
export const getPriceIdFromPlan = (...args: any[]) => null;
export const getDisplayNameFromPlan = (plan: string) => plan;
export const getQuantityFromPlan = (...args: any[]) => 1;
export const getQuantityFromPriceId = (...args: any[]) => 1;
export const getCouponFromPlan = (...args: any[]) => null;
export const getPlanFromPriceId = (...args: any[]) => ({
  name: "free",
  minQuantity: 1,
});
export const isOldAccount = (...args: any[]) => false;
export const cancelSubscription = async (...args: any[]) => ({ success: true });
export const STRIPE_PLAN_IDS = {};
export const STRIPE_PRICES = {};

// Default export for getSubscriptionItem (used in some API routes)
export default getSubscriptionItem;

// Plan enum - AGPL version (all plans available, no restrictions)
export enum PlanEnum {
  Free = "free",
  Pro = "pro",
  Business = "business",
  DataRooms = "datarooms",
  DataRoomsPlus = "dataroomsplus",
}

// Plan name mapping - AGPL version (everything is "Free" since no paid plans)
export const PLAN_NAME_MAP: Record<string, string> = {
  free: "Free",
  pro: "Free",
  business: "Free",
  datarooms: "Free",
  dataroomsplus: "Free",
};

// Subscription discount type
export type SubscriptionDiscount = {
  percent_off: number | null;
  amount_off: number | null;
  valid: boolean;
  duration?: string | null;
  durationInMonths?: number | null;
  percentOff?: number | null;
  amountOff?: number | null;
};

// Feature type for plan features
export type Feature = {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  isHighlighted?: boolean;
  text: string;
  tooltip?: string | null;
  isUsers?: boolean;
  isNotIncluded?: boolean;
  isCustomDomain?: boolean;
};

// Get features for a plan - AGPL version (all features enabled)
export const getPlanFeatures = (plan: PlanEnum, options?: any) => {
  // In AGPL version, all features are always enabled
  return {
    features: [],
    featureIntro: "All features included - unlimited usage",
  };
};

// Plans configuration - AGPL version (all plans are free, no paid tiers)
export const PLANS = [
  {
    name: PlanEnum.Free,
    price: {
      monthly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      annually: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      yearly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
    },
  },
  {
    name: PlanEnum.Pro,
    price: {
      monthly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      annually: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      yearly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
    },
  },
  {
    name: PlanEnum.Business,
    price: {
      monthly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      annually: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      yearly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
    },
  },
  {
    name: PlanEnum.DataRooms,
    price: {
      monthly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      annually: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      yearly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
    },
  },
  {
    name: PlanEnum.DataRoomsPlus,
    price: {
      monthly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      annually: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
      yearly: { amount: 0, priceIds: { production: { old: "", new: "" }, test: { old: "", new: "" } } },
    },
  },
];

// Stripe instance stub
export const getStripe = (...args: any[]) => null;

// Webhook handler stubs
export const checkoutSessionCompleted = async (...args: any[]) => {};
export const customerSubscriptionDeleted = async (...args: any[]) => {};
export const customerSubsciptionUpdated = async (...args: any[]) => {};
