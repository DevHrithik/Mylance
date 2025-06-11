// Main types export file for Mylance
export * from "@/lib/types/auth";
export * from "@/lib/types/analytics";
export * from "@/lib/types/api";
export * from "@/lib/types/database";
export * from "@/lib/types/posts";
export * from "@/lib/types/billing";

// Selective exports from posts to avoid conflicts with api types
export type {
  Post,
  PostInsert,
  PostUpdate,
  PostPerformance,
  PostPerformanceInsert,
  PostPerformanceUpdate,
  GenerationHistory,
  GenerationHistoryInsert,
  ContentType,
  ContentStatus,
  Tone,
  PostWithPerformance,
  ContentSuggestion,
  ContentPillar,
  PostFilter,
  PostStats,
  AIPromptTemplate,
  GenerationContext,
  PerformanceMetrics,
  PerformanceInput,
  PerformanceTrend,
  ContentAnalysis,
  PostContentGenerationRequest,
  PostContentGenerationResponse,
} from "./posts";

// Selective exports from api to avoid conflicts
export type {
  ApiResponse,
  ApiError,
  ContentGenerationRequest,
  ContentGenerationResponse,
  AnalyticsRequest,
  AnalyticsResponse,
  LearningRequest,
  LearningResponse,
  StripeWebhookRequest,
  SubscriptionWebhookData,
  OpenAIRequest,
  OpenAIResponse,
  FileUploadRequest,
  FileUploadResponse,
  PaginatedApiResponse,
  RateLimitInfo,
  RateLimitedResponse,
  EdgeFunctionContext,
  WebhookPayload,
  ValidatedWebhook,
  ApiConfig,
  HealthCheckResponse,
} from "@/lib/types/api";
