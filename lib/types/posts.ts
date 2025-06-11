import { type Database } from "@/lib/supabase/database.types";

// Database types
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

export type PostPerformance =
  Database["public"]["Tables"]["post_performance"]["Row"];
export type PostPerformanceInsert =
  Database["public"]["Tables"]["post_performance"]["Insert"];
export type PostPerformanceUpdate =
  Database["public"]["Tables"]["post_performance"]["Update"];

export type GenerationHistory =
  Database["public"]["Tables"]["generation_history"]["Row"];
export type GenerationHistoryInsert =
  Database["public"]["Tables"]["generation_history"]["Insert"];

// Enums
export type ContentType = Database["public"]["Enums"]["content_type"];
export type ContentStatus = Database["public"]["Enums"]["content_status"];
export type Tone = Database["public"]["Enums"]["tone"];

// Application types
export interface PostWithPerformance extends Post {
  performance?: PostPerformance[];
  averageEngagementRate?: number;
  totalImpressions?: number;
  totalEngagement?: number;
}

export interface PostContentGenerationRequest {
  topic: string;
  contentType: ContentType;
  tone: Tone;
  targetAudience?: string;
  keywords?: string[];
  includeCTA?: boolean;
  length?: "short" | "medium" | "long";
  includeHashtags?: boolean;
  customInstructions?: string;
}

export interface PostContentGenerationResponse {
  content: string;
  title?: string;
  hashtags?: string[];
  metadata: {
    tokensUsed: number;
    generationTimeMs: number;
    model: string;
    prompt: string;
  };
}

export interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  estimatedEngagement: number;
  confidence: number;
  reasons: string[];
}

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  topics: string[];
  targetAudience: string[];
  keyMessages: string[];
  isActive: boolean;
}

export interface PostFilter {
  status?: ContentStatus[];
  contentType?: ContentType[];
  tone?: Tone[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  sortBy?: "created_at" | "updated_at" | "engagement_rate";
  sortOrder?: "asc" | "desc";
}

export interface PostStats {
  totalPosts: number;
  draftPosts: number;
  usedPosts: number;
  archivedPosts: number;
  averageEngagementRate: number;
  totalImpressions: number;
  totalEngagement: number;
}

// AI Generation types
export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  contentType: ContentType;
  tone: Tone;
}

export interface GenerationContext {
  userProfile: {
    industry: string;
    role: string;
    company?: string;
    expertise: string[];
  };
  contentGoals: string[];
  targetAudience: {
    demographics: string[];
    interests: string[];
    painPoints: string[];
  };
  brandVoice: {
    tone: Tone;
    personality: string[];
    avoidTerms: string[];
  };
  performanceHistory: {
    topPerformingTopics: string[];
    bestPerformingTone: Tone;
    optimalLength: number;
    effectiveHashtags: string[];
  };
}

// Performance tracking types
export interface PerformanceMetrics {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
  reach?: number;
  saves?: number;
}

export interface PerformanceInput {
  postId: number;
  metrics: PerformanceMetrics;
  recordedAt?: Date;
  notes?: string;
  linkedinUrl?: string;
}

export interface PerformanceTrend {
  date: string;
  impressions: number;
  engagement: number;
  engagementRate: number;
  postCount: number;
}

export interface ContentAnalysis {
  wordCount: number;
  sentiment: "positive" | "neutral" | "negative";
  readabilityScore: number;
  topics: string[];
  entities: string[];
  hashtags: string[];
  hasCallToAction: boolean;
  hasQuestion: boolean;
  hasEmoji: boolean;
  estimatedReadTime: number;
}
