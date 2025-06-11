// Database enum constants for easy use in the frontend
export const CONTENT_TYPES = {
  POST: "post",
  ARTICLE: "article",
  CAROUSEL: "carousel",
  VIDEO_SCRIPT: "video_script",
  POLL: "poll",
} as const;

export const CONTENT_STATUS = {
  DRAFT: "draft",
  USED: "used",
  ARCHIVED: "archived",
} as const;

export const TONES = {
  PROFESSIONAL: "professional",
  CASUAL: "casual",
  AUTHORITATIVE: "authoritative",
  CONVERSATIONAL: "conversational",
  INSPIRATIONAL: "inspirational",
  EDUCATIONAL: "educational",
} as const;

export const PLAN_TYPES = {
  FREE: "free",
  MONTHLY: "monthly",
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  CANCELED: "canceled",
  PAST_DUE: "past_due",
  PAUSED: "paused",
} as const;

// Content type labels for UI
export const CONTENT_TYPE_LABELS = {
  [CONTENT_TYPES.POST]: "Post",
  [CONTENT_TYPES.ARTICLE]: "Article",
  [CONTENT_TYPES.CAROUSEL]: "Carousel",
  [CONTENT_TYPES.VIDEO_SCRIPT]: "Video Script",
  [CONTENT_TYPES.POLL]: "Poll",
} as const;

// Content status labels for UI
export const CONTENT_STATUS_LABELS = {
  [CONTENT_STATUS.DRAFT]: "Draft",
  [CONTENT_STATUS.USED]: "Published",
  [CONTENT_STATUS.ARCHIVED]: "Archived",
} as const;

// Tone labels for UI
export const TONE_LABELS = {
  [TONES.PROFESSIONAL]: "Professional",
  [TONES.CASUAL]: "Casual",
  [TONES.AUTHORITATIVE]: "Authoritative",
  [TONES.CONVERSATIONAL]: "Conversational",
  [TONES.INSPIRATIONAL]: "Inspirational",
  [TONES.EDUCATIONAL]: "Educational",
} as const;

// Plan type labels for UI
export const PLAN_TYPE_LABELS = {
  [PLAN_TYPES.FREE]: "Free",
  [PLAN_TYPES.MONTHLY]: "Mylance LinkedIn Content Thought Leadership",
} as const;

// Subscription status labels for UI
export const SUBSCRIPTION_STATUS_LABELS = {
  [SUBSCRIPTION_STATUS.ACTIVE]: "Active",
  [SUBSCRIPTION_STATUS.CANCELED]: "Canceled",
  [SUBSCRIPTION_STATUS.PAST_DUE]: "Past Due",
  [SUBSCRIPTION_STATUS.PAUSED]: "Paused",
} as const;

// Content type descriptions
export const CONTENT_TYPE_DESCRIPTIONS = {
  [CONTENT_TYPES.POST]: "Standard LinkedIn text post with optional media",
  [CONTENT_TYPES.ARTICLE]: "Long-form LinkedIn article for thought leadership",
  [CONTENT_TYPES.CAROUSEL]: "Multi-slide visual content with engaging design",
  [CONTENT_TYPES.VIDEO_SCRIPT]: "Script for video content creation",
  [CONTENT_TYPES.POLL]: "Interactive poll to engage your audience",
} as const;

// Tone descriptions
export const TONE_DESCRIPTIONS = {
  [TONES.PROFESSIONAL]: "Formal, business-focused, and authoritative",
  [TONES.CASUAL]: "Relaxed, friendly, and approachable",
  [TONES.AUTHORITATIVE]: "Expert, confident, and commanding",
  [TONES.CONVERSATIONAL]: "Natural, engaging, and dialogue-like",
  [TONES.INSPIRATIONAL]: "Motivating, uplifting, and encouraging",
  [TONES.EDUCATIONAL]: "Informative, teaching-focused, and helpful",
} as const;

// Arrays for dropdowns and selections
export const CONTENT_TYPE_OPTIONS = Object.values(CONTENT_TYPES);
export const CONTENT_STATUS_OPTIONS = Object.values(CONTENT_STATUS);
export const TONE_OPTIONS = Object.values(TONES);
export const PLAN_TYPE_OPTIONS = Object.values(PLAN_TYPES);
export const SUBSCRIPTION_STATUS_OPTIONS = Object.values(SUBSCRIPTION_STATUS);
