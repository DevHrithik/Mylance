import { type Database } from "@/lib/supabase/database.types";
import { type ContentType, type Tone } from "./posts";

// Database types
export type AIInsight = Database["public"]["Tables"]["ai_insights"]["Row"];
export type AIInsightInsert =
  Database["public"]["Tables"]["ai_insights"]["Insert"];
export type AIInsightUpdate =
  Database["public"]["Tables"]["ai_insights"]["Update"];

// Analytics dashboard types
export interface AnalyticsSummary {
  totalPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  averageEngagementRate: number;
  topPerformingPost: {
    id: number;
    content: string;
    engagementRate: number;
  };
  lastPeriodComparison: {
    postsChange: number;
    impressionsChange: number;
    engagementChange: number;
    engagementRateChange: number;
  };
}

export interface PerformanceChart {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
  }[];
}

export interface ContentTypePerformance {
  contentType: ContentType;
  postCount: number;
  avgEngagementRate: number;
  totalImpressions: number;
  totalEngagement: number;
  trend: "up" | "down" | "stable";
}

export interface TonePerformance {
  tone: Tone;
  postCount: number;
  avgEngagementRate: number;
  totalImpressions: number;
  totalEngagement: number;
  audienceReception: "excellent" | "good" | "average" | "poor";
}

export interface TopicAnalysis {
  topic: string;
  frequency: number;
  avgEngagementRate: number;
  totalImpressions: number;
  sentiment: "positive" | "neutral" | "negative";
  suggestedActions: string[];
}

export interface HashtagPerformance {
  hashtag: string;
  usageCount: number;
  avgEngagementRate: number;
  reach: number;
  trending: boolean;
  difficulty: "low" | "medium" | "high";
}

export interface AudienceInsights {
  demographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
    industries: Record<string, number>;
    jobTitles: Record<string, number>;
  };
  behavior: {
    peakEngagementTimes: string[];
    preferredContentTypes: ContentType[];
    avgSessionDuration: number;
    bounceRate: number;
  };
  interests: {
    primaryTopics: string[];
    emergingTopics: string[];
    contentPreferences: string[];
  };
}

// AI Insights types
export interface ContentInsight {
  type:
    | "content_optimization"
    | "audience_analysis"
    | "performance_pattern"
    | "trend_analysis";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  recommendations: string[];
  data: Record<string, unknown>;
  actionable: boolean;
  priority: number;
}

export interface LearningProgress {
  totalInsights: number;
  implementedRecommendations: number;
  performanceImprovement: number;
  confidenceScore: number;
  learningAreas: {
    contentOptimization: number;
    audienceTargeting: number;
    timingOptimization: number;
    formatOptimization: number;
  };
  nextMilestones: string[];
}

export interface PredictiveAnalytics {
  nextPostPrediction: {
    estimatedEngagementRate: number;
    confidence: number;
    recommendedTone: Tone;
    recommendedContentType: ContentType;
    optimalPostingTime: string;
  };
  trendPredictions: {
    risingTopics: string[];
    decliningTopics: string[];
    emergingHashtags: string[];
    seasonalTrends: Record<string, number>;
  };
  audienceGrowthPrediction: {
    estimatedGrowthRate: number;
    targetDemographics: string[];
    recommendedActions: string[];
  };
}

// Analytics filters and options
export interface AnalyticsFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  contentTypes?: ContentType[];
  tones?: Tone[];
  performanceThreshold?: number;
  includeArchived?: boolean;
}

export interface AnalyticsExport {
  format: "csv" | "pdf" | "json";
  includeCharts: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  sections: {
    summary: boolean;
    contentPerformance: boolean;
    audienceInsights: boolean;
    aiRecommendations: boolean;
    trends: boolean;
  };
}

// Benchmark and comparison types
export interface IndustryBenchmark {
  industry: string;
  avgEngagementRate: number;
  avgImpressions: number;
  topContentTypes: ContentType[];
  bestPerformingTones: Tone[];
  optimalPostingFrequency: number;
}

export interface CompetitorAnalysis {
  competitorId: string;
  competitorName: string;
  followersCount: number;
  avgEngagementRate: number;
  topPerformingContentTypes: ContentType[];
  postingFrequency: number;
  hashtagStrategy: string[];
  contentThemes: string[];
}

// Real-time analytics types
export interface RealTimeMetrics {
  activeUsers: number;
  recentEngagement: {
    likes: number;
    comments: number;
    shares: number;
    timestamp: Date;
  }[];
  trendingPosts: {
    postId: number;
    engagementVelocity: number;
    currentEngagement: number;
  }[];
  alertsAndNotifications: {
    type: "high_performance" | "low_performance" | "trending" | "milestone";
    message: string;
    timestamp: Date;
    postId?: number;
  }[];
}

// Define proper type instead of any
export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface ChartData {
  [key: string]: TimeSeriesData[];
}
