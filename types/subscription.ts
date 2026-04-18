export const SUBSCRIPTION_STATUS = ['active', 'paused', 'cancelled'] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const BILLING_CYCLES = ['monthly', 'yearly'] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

export type Subscription = {
  id: string;
  serviceKey: string;
  name: string;
  logo: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  billingDay: number;
  startDate: string;
  renewalDate: string;
  nextBillingDate: string;
  category: string;
  status: SubscriptionStatus;
  notes: string;
};
