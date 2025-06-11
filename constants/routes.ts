export const ROUTES = {
  // Public routes
  HOME: "/",

  // Auth routes
  LOGIN: "/login",
  SIGNUP: "/signup",
  MAGIC_LINK: "/magic-link",
  AUTH_CALLBACK: "/callback",

  // Dashboard routes
  DASHBOARD: "/dashboard",
  ONBOARDING: "/onboarding",
  PROMPT_LIBRARY: "/prompt-library",
  CONTENT_CALENDAR: "/content-calendar",

  // Posts routes
  POSTS: "/posts",
  POSTS_CREATE: "/posts/create",
  POSTS_HISTORY: "/posts/history",

  // Analytics routes
  ANALYTICS: "/analytics",

  // Profile routes
  PROFILE: "/profile",
  WRITING_PROFILE: "/profile/writing-profile",

  // Settings routes
  SETTINGS: "/settings",

  // Billing routes
  BILLING: "/billing",
  BILLING_PLANS: "/billing/plans",
  BILLING_INVOICES: "/billing/invoices",

  // Help routes
  HELP: "/help",
  FAQ: "/help/faq",
  CONTACT: "/help/contact",
  TUTORIALS: "/help/tutorials",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = (typeof ROUTES)[RouteKey];
