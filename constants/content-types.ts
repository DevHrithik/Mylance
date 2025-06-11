export const CONTENT_TYPES = {
  POST: "post",
  ARTICLE: "article",
  POLL: "poll",
  CAROUSEL: "carousel",
  VIDEO: "video",
} as const;

export const CONTENT_CATEGORIES = {
  THOUGHT_LEADERSHIP: "thought_leadership",
  INDUSTRY_INSIGHTS: "industry_insights",
  PERSONAL_STORY: "personal_story",
  TIPS_AND_ADVICE: "tips_and_advice",
  COMPANY_UPDATE: "company_update",
  ACHIEVEMENT: "achievement",
  QUESTION: "question",
  BEHIND_THE_SCENES: "behind_the_scenes",
} as const;

export const CONTENT_TONES = {
  PROFESSIONAL: "professional",
  CASUAL: "casual",
  INSPIRATIONAL: "inspirational",
  EDUCATIONAL: "educational",
  CONVERSATIONAL: "conversational",
  AUTHORITATIVE: "authoritative",
} as const;

export const POST_STATUS = {
  DRAFT: "draft",
  GENERATED: "generated",
  USED: "used",
  ARCHIVED: "archived",
} as const;

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];
export type ContentCategory =
  (typeof CONTENT_CATEGORIES)[keyof typeof CONTENT_CATEGORIES];
export type ContentTone = (typeof CONTENT_TONES)[keyof typeof CONTENT_TONES];
export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];
