"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  BarChart3,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Target,
  Lightbulb,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface HighPerformingPost {
  id: number;
  post_content: string;
  engagement_rate: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  performance_category: string;
  what_works: string[];
  insights: any;
  created_at: string;
  post_date?: string;
}

interface OverallInsights {
  total_posts: number;
  average_engagement: number;
  high_performing_posts: number;
  top_performing_content: Array<{
    content_preview: string;
    engagement_rate: number;
    what_works: string[];
  }>;
  overall_recommendations: string[];
}

interface WhatWorksInsightsProps {
  userId: string;
}

export function WhatWorksInsights({ userId }: WhatWorksInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highPerformingPosts, setHighPerformingPosts] = useState<
    HighPerformingPost[]
  >([]);
  const [overallInsights, setOverallInsights] =
    useState<OverallInsights | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchInsights = async (showRefreshing = false) => {
    // Check if we have cached data that's less than 5 minutes old
    const cacheKey = `what-works-insights-${userId}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);

    if (cachedData && cacheTimestamp && !showRefreshing) {
      const age = Date.now() - parseInt(cacheTimestamp);
      const fiveMinutes = 5 * 60 * 1000;

      if (age < fiveMinutes) {
        try {
          const parsed = JSON.parse(cachedData);
          setHighPerformingPosts(parsed.high_performing_posts || []);
          setOverallInsights(parsed.overall_insights);
          setLoading(false);
          return;
        } catch (error) {
          console.log("Cache parse error, fetching fresh data");
        }
      }
    }

    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      console.log("Fetching insights from API...");
      const response = await fetch("/api/sample-posts/analytics", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `Failed to fetch insights: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("API Result:", result);

      if (result.success) {
        setHighPerformingPosts(result.data.high_performing_posts || []);
        setOverallInsights(result.data.overall_insights);

        // Cache the successful result
        const cacheKey = `what-works-insights-${userId}`;
        localStorage.setItem(cacheKey, JSON.stringify(result.data));
        localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
      } else {
        throw new Error(result.error || "API returned unsuccessful response");
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error(
        `Failed to load insights: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const deletePost = async (postId: number) => {
    setDeleting(postId);
    try {
      const response = await fetch(`/api/sample-posts/analytics?id=${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      // Remove from local state
      setHighPerformingPosts((prev) =>
        prev.filter((post) => post.id !== postId)
      );

      // Clear cache to force refresh on next load
      const cacheKey = `what-works-insights-${userId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}-timestamp`);

      // Refresh insights to update counts
      fetchInsights(true);

      toast.success("Sample post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setDeleting(null);
    }
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 10) return "text-green-600 bg-green-50 border-green-200";
    if (rate >= 5) return "text-blue-600 bg-blue-50 border-blue-200";
    if (rate >= 2) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getPerformanceIcon = (category: string) => {
    if (!category) return <BarChart3 className="h-4 w-4 text-yellow-600" />;

    switch (category.toLowerCase()) {
      case "excellent":
        return <Sparkles className="h-4 w-4 text-green-600" />;
      case "good":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            What Works on LinkedIn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!overallInsights || overallInsights.total_posts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            What Works on LinkedIn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">
              No Performance Data Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add sample posts with analytics to see what content works best for
              you
            </p>
            <Button variant="outline" size="sm">
              <Lightbulb className="h-4 w-4 mr-2" />
              Learn About Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              What Works on LinkedIn
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInsights(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {overallInsights.total_posts}
              </div>
              <div className="text-sm text-blue-700">Sample Posts</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {overallInsights.average_engagement.toFixed(1)}%
              </div>
              <div className="text-sm text-green-700">Avg Engagement</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {overallInsights.high_performing_posts}
              </div>
              <div className="text-sm text-purple-700">High Performers</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Key Recommendations
            </h4>
            <ul className="space-y-2">
              {overallInsights.overall_recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* High-Performing Posts */}
      {highPerformingPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your High-Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highPerformingPosts.slice(0, 5).map((post, index) => (
                <div
                  key={post.id}
                  className={`p-4 rounded-lg border ${getEngagementColor(
                    post.engagement_rate
                  )}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPerformanceIcon(
                        post.performance_category || "average"
                      )}
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {post.engagement_rate.toFixed(1)}% engagement
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {post.performance_category || "average"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.post_date && (
                        <span className="text-xs text-gray-500">
                          {new Date(post.post_date).toLocaleDateString()}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePost(post.id)}
                        disabled={deleting === post.id}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                      >
                        {deleting === post.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {post.post_content.length > 200
                      ? `${post.post_content.substring(0, 200)}...`
                      : post.post_content}
                  </p>

                  <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="h-3 w-3" />
                      {post.impressions?.toLocaleString() || 0}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Heart className="h-3 w-3" />
                      {post.likes || 0}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments || 0}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Share className="h-3 w-3" />
                      {post.shares || 0}
                    </div>
                  </div>

                  {post.what_works && post.what_works.length > 0 && (
                    <div className="border-t pt-2">
                      <div className="text-xs font-medium text-green-700 mb-1">
                        Why this worked:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {post.what_works.map((insight, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs text-green-700 border-green-300"
                          >
                            {insight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Content Patterns */}
      {overallInsights.top_performing_content.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Content Patterns That Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overallInsights.top_performing_content.map((content, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Pattern #{index + 1}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {content.engagement_rate.toFixed(1)}% engagement
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {content.content_preview}
                  </p>
                  {content.what_works && content.what_works.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {content.what_works.map((insight, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs text-green-700 border-green-300"
                        >
                          {insight}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
