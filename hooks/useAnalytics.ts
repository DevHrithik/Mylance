"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  getAnalyticsStats,
  getTopPosts,
  getAIInsights,
  getEngagementOverTime,
  getPostPerformanceData,
  generateAndSaveInsights,
  type AnalyticsStats,
  type TopPost,
  type AIInsight,
  type PostPerformance,
} from "@/lib/analytics";

interface UseAnalyticsReturn {
  stats: AnalyticsStats | null;
  topPosts: TopPost[];
  insights: AIInsight[];
  engagementData: { date: string; engagement: number; impressions: number }[];
  postPerformance: PostPerformance[];
  performanceData: PostPerformance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  regenerateInsights: () => Promise<void>;
}

export function useAnalytics(): UseAnalyticsReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [engagementData, setEngagementData] = useState<
    { date: string; engagement: number; impressions: number }[]
  >([]);
  const [performanceData, setPerformanceData] = useState<PostPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const [
        statsData,
        postsData,
        insightsData,
        engagementTimeData,
        performanceMetrics,
      ] = await Promise.all([
        getAnalyticsStats(user.id),
        getTopPosts(user.id, 5),
        getAIInsights(user.id),
        getEngagementOverTime(user.id, 30),
        getPostPerformanceData(user.id),
      ]);

      setStats(statsData);
      setTopPosts(postsData);
      setInsights(insightsData);
      setEngagementData(engagementTimeData);
      setPerformanceData(performanceMetrics);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const regenerateInsights = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      console.log("Regenerating insights...");

      // Show loading state for insights only
      const newInsights = await generateAndSaveInsights(user.id);
      setInsights(newInsights);

      console.log("Insights regenerated successfully");
    } catch (err) {
      console.error("Error regenerating insights:", err);
      setError("Failed to regenerate insights. Please try again.");
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user?.id]);

  return {
    stats,
    topPosts,
    insights,
    engagementData,
    postPerformance: performanceData,
    performanceData,
    loading,
    error,
    refetch: fetchAnalyticsData,
    regenerateInsights,
  };
}
