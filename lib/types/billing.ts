import { type Database } from "@/lib/supabase/database.types";

// Database types
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type SubscriptionInsert =
  Database["public"]["Tables"]["subscriptions"]["Insert"];
export type SubscriptionUpdate =
  Database["public"]["Tables"]["subscriptions"]["Update"];

export type UsageTracking =
  Database["public"]["Tables"]["usage_tracking"]["Row"];
export type UsageTrackingInsert =
  Database["public"]["Tables"]["usage_tracking"]["Insert"];
export type UsageTrackingUpdate =
  Database["public"]["Tables"]["usage_tracking"]["Update"];

// Enums
export type PlanType = Database["public"]["Enums"]["plan_type"];
export type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"];

// Subscription plan definitions
export interface PlanFeatures {
  contentGeneration: {
    monthlyLimit: number;
    aiModels: string[];
    customPrompts: boolean;
    bulkGeneration: boolean;
  };
  analytics: {
    basicReports: boolean;
    advancedInsights: boolean;
    exportData: boolean;
    realTimeTracking: boolean;
  };
  support: {
    emailSupport: boolean;
    prioritySupport: boolean;
    phoneSupport: boolean;
    dedicatedManager: boolean;
  };
  integrations: {
    basicIntegrations: boolean;
    premiumIntegrations: boolean;
    apiAccess: boolean;
    webhooks: boolean;
  };
}

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: PlanFeatures;
  popular?: boolean;
  recommended?: boolean;
  stripePriceId: {
    monthly: string;
    annual: string;
  };
}

// Usage and billing types
export interface UsageMetrics {
  contentGeneration: {
    used: number;
    limit: number;
    percentage: number;
  };
  apiRequests: {
    used: number;
    limit: number;
    percentage: number;
  };
  storageUsed: {
    used: number; // in MB
    limit: number; // in MB
    percentage: number;
  };
  analyticsExports: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export interface BillingHistory {
  id: string;
  date: Date;
  amount: number;
  status: "paid" | "pending" | "failed" | "refunded";
  description: string;
  invoiceUrl?: string;
  period: {
    start: Date;
    end: Date;
  };
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account";
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Stripe-specific types
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  defaultPaymentMethod?: string;
  subscriptions: StripeSubscription[];
}

export interface StripeSubscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  items: {
    id: string;
    priceId: string;
    quantity: number;
  }[];
}

export interface CheckoutSession {
  sessionId: string;
  planType: PlanType;
  billingCycle: "monthly" | "annual";
  successUrl: string;
  cancelUrl: string;
}

// Billing actions and states
export interface BillingContextType {
  subscription: Subscription | null;
  usage: UsageMetrics | null;
  billingHistory: BillingHistory[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;

  // Actions
  createCheckoutSession: (
    planType: PlanType,
    billingCycle: "monthly" | "annual"
  ) => Promise<string>;
  updateSubscription: (planType: PlanType) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  addPaymentMethod: () => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  downloadInvoice: (invoiceId: string) => Promise<void>;
  refreshUsage: () => Promise<void>;
}

// Pricing and discounts
export interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description: string;
  validUntil?: Date;
  maxUses?: number;
  currentUses: number;
  applicablePlans: PlanType[];
}

export interface PricingCalculation {
  basePrice: number;
  discount?: {
    code: string;
    amount: number;
  };
  tax?: {
    rate: number;
    amount: number;
  };
  total: number;
  currency: string;
}

// Subscription upgrade/downgrade
export interface PlanChangePreview {
  currentPlan: PlanType;
  newPlan: PlanType;
  prorationAmount: number;
  effectiveDate: Date;
  nextBillingDate: Date;
  featureChanges: {
    added: string[];
    removed: string[];
    changed: string[];
  };
}

// Enterprise and custom plans
export interface EnterpriseQuote {
  id: string;
  contactEmail: string;
  companyName: string;
  estimatedUsers: number;
  requiredFeatures: string[];
  estimatedUsage: {
    contentGeneration: number;
    apiRequests: number;
    storageGB: number;
  };
  customRequirements: string;
  status: "pending" | "under_review" | "quoted" | "approved" | "rejected";
  salesRepContact?: string;
}

// Notifications and alerts
export interface BillingAlert {
  id: string;
  type:
    | "usage_warning"
    | "usage_limit"
    | "payment_failed"
    | "subscription_expiring";
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  timestamp: Date;
  dismissed: boolean;
  actionRequired: boolean;
  actionUrl?: string;
}
