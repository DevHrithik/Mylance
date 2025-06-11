import { SupabaseClient } from "@supabase/supabase-js";

// API Response wrapper types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: string;
}

// Content Generation API types
export interface ContentGenerationRequest {
  prompt: string;
  contentType: "post" | "article" | "carousel" | "video_script" | "poll";
  tone:
    | "professional"
    | "casual"
    | "authoritative"
    | "conversational"
    | "inspirational"
    | "educational";
  maxLength?: number;
  includeHashtags?: boolean;
  includeCTA?: boolean;
  targetAudience?: string;
  keywords?: string[];
  customInstructions?: string;
  userContext: {
    industry: string;
    role: string;
    company?: string;
    previousContent?: string[];
  };
}

export interface ContentGenerationResponse {
  content: string;
  title?: string;
  hashtags?: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    generationTimeMs: number;
    confidence: number;
  };
  suggestions?: {
    alternatives: string[];
    improvements: string[];
    optimizations: string[];
  };
}

// Analytics API types
export interface AnalyticsRequest {
  userId: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics?: string[];
  includeComparison?: boolean;
  groupBy?: "day" | "week" | "month";
}

export interface AnalyticsResponse {
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalEngagement: number;
    averageEngagementRate: number;
  };
  trends: {
    impressions: Array<{ date: string; value: number }>;
    engagement: Array<{ date: string; value: number }>;
    engagementRate: Array<{ date: string; value: number }>;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    recommendations: string[];
  }>;
}

// AI Learning API types
export interface LearningRequest {
  userId: string;
  contentId: number;
  performanceData: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
  contentAnalysis: {
    topics: string[];
    sentiment: string;
    readability: number;
    length: number;
  };
}

export interface LearningResponse {
  insights: Array<{
    type: string;
    confidence: number;
    recommendation: string;
    expectedImprovement: number;
  }>;
  updatedProfile: {
    preferredTopics: string[];
    optimalTone: string;
    bestPerformingContentTypes: string[];
  };
}

// Stripe Webhook types
export interface StripeWebhookRequest {
  type: string;
  data: {
    object: Array<{
      id: string;
      price: {
        id: string;
        product: string;
      };
    }>;
  };
  created: number;
  id: string;
  livemode: boolean;
}

export interface SubscriptionWebhookData {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
      };
      quantity: number;
    }>;
  };
}

// External API types (OpenAI, LinkedIn, etc.)
export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// File upload types
export interface FileUploadRequest {
  file: File;
  bucket: string;
  path?: string;
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  };
}

export interface FileUploadResponse {
  path: string;
  fullPath: string;
  publicUrl: string;
  size: number;
  contentType: string;
}

// Pagination for API responses
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitedResponse<T = string> extends ApiResponse<T> {
  rateLimit: RateLimitInfo;
}

// Edge function context types
export interface EdgeFunctionContext {
  req: Request;
  env: Record<string, string>;
  supabaseClient: SupabaseClient;
  user?: {
    id: string;
    email: string;
  };
}

// Webhook validation types
export interface WebhookPayload {
  signature: string;
  body: string;
  headers: Record<string, string>;
}

export interface ValidatedWebhook<T = any> {
  isValid: boolean;
  payload: T;
  error?: string;
}

// API configuration types
export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// Health check types
export interface HealthCheckResponse {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  version: string;
  services: {
    database: "ok" | "down";
    ai: "ok" | "down";
    storage: "ok" | "down";
    auth: "ok" | "down";
  };
  metrics?: {
    responseTime: number;
    uptime: number;
    errorRate: number;
  };
}
