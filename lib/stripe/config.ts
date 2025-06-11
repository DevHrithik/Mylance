export const STRIPE_CONFIG = {
  PRICE_ID: "price_1RVHChFyiMqemrHZchIoJtX5",
  PLAN_NAME: "Mylance LinkedIn Content Thought Leadership",
  PLAN_DESCRIPTION:
    "Get a complete, done-with-you LinkedIn content system designed to grow your authority and drive client conversations. You'll get a personalized onboarding call, a custom content plan with your voice, content pillars, and monthly roadmap, plus weekly prompts delivered every Monday—crafted from your real experiences so you can post 3x/week with clear guidance and weekly email alerts to refine your content and win new clients.",
  PRICE: 139.5,
  CURRENCY: "usd",
  BILLING_PERIOD: "month",
} as const;

export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: "customer.subscription.created",
  SUBSCRIPTION_UPDATED: "customer.subscription.updated",
  SUBSCRIPTION_DELETED: "customer.subscription.deleted",
  INVOICE_PAYMENT_SUCCEEDED: "invoice.payment_succeeded",
  INVOICE_PAYMENT_FAILED: "invoice.payment_failed",
} as const;
