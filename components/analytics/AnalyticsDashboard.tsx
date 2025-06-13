"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EngagementChart } from "./EngagementChart";
import { PerformanceMetrics } from "./PerformanceMetrics";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Share,
  BarChart3,
  Lightbulb,
  Target,
  Clock,
  Users,
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Zap,
  BookOpen,
  Star,
  Award,
  Brain,
} from "lucide-react";
import { useMemo, useState } from "react";
import { InsightsRegenerationModal } from "./InsightsRegenerationModal";
import { toast } from "sonner";

interface LearningInsight {
  category: "working" | "improvement" | "opportunity";
  title: string;
  description: string;
  metric: string;
  impact: "high" | "medium" | "low";
  recommendation: string;
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  engagement_rate: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  posted_at: string;
  content_type: string;
}

interface AnalyticsDashboardProps {
  initialData: {
    stats: {
      totalPosts: number;
      totalImpressions: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      averageEngagementRate: number;
    };
    topPosts: any[];
    insights: any[];
  };
  userId: string;
}

export function AnalyticsDashboard({
  initialData,
  userId,
}: AnalyticsDashboardProps) {
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [regeneratingInsights, setRegeneratingInsights] = useState(false);
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);

  const { stats, topPosts, insights } = initialData;

  // Transform data to match expected format
  const transformedStats = {
    ...stats,
    totalEngagements:
      stats.totalLikes + stats.totalComments + stats.totalShares,
    impressionGrowth: 0, // We don't have historical data for growth calculations
    engagementGrowth: 0,
  };

  // Deduplicate insights based on insight_type to avoid showing the same insight multiple times
  const uniqueInsights = useMemo(() => {
    if (!insights || insights.length === 0) return [];

    const seen = new Set();
    return insights.filter((insight) => {
      if (seen.has(insight.insight_type)) {
        return false;
      }
      seen.add(insight.insight_type);
      return true;
    });
  }, [insights]);

  const handleRegenerateInsights = async () => {
    setShowRegenerationModal(true);
    setRegeneratingInsights(true);

    try {
      const response = await fetch("/api/analytics/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate insights");
      }

      const result = await response.json();
      toast.success(`Generated ${result.count || 0} new insights!`);

      // Small delay to show completion before refresh
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error regenerating insights:", error);
      toast.error("Failed to regenerate insights");
      setShowRegenerationModal(false);
    } finally {
      setRegeneratingInsights(false);
    }
  };

  // Generate learning insights based on performance data
  const learningInsights = useMemo((): LearningInsight[] => {
    // Use real insights from database instead of generic ones
    if (insights && insights.length > 0) {
      return insights.map((insight): LearningInsight => {
        const data = insight.insight_data || {};

        switch (insight.insight_type) {
          case "content_performance":
            return {
              category: "working",
              title: `${
                data.best_content_type?.charAt(0).toUpperCase() +
                data.best_content_type?.slice(1)
              } Content Performs Best`,
              description: `Your ${data.best_content_type} posts average ${data.avg_engagement}% engagement with ${data.post_count} posts analyzed`,
              metric: `${data.avg_engagement}%`,
              impact:
                insight.performance_impact > 15
                  ? "high"
                  : insight.performance_impact > 8
                  ? "medium"
                  : "low",
              recommendation:
                insight.recommendations?.[0] ||
                "Continue creating this type of content",
            };

          case "engagement_analysis":
            return {
              category:
                data.engagement_depth === "shallow" ? "improvement" : "working",
              title:
                data.engagement_depth === "shallow"
                  ? "Low Comment Engagement"
                  : "Strong Comment Engagement",
              description: `Comment rate: ${data.comment_rate}%, Like rate: ${data.like_rate}%`,
              metric: `${data.comment_rate}% comments`,
              impact:
                insight.performance_impact > 15
                  ? "high"
                  : insight.performance_impact > 8
                  ? "medium"
                  : "low",
              recommendation:
                insight.recommendations?.[0] ||
                "Continue your engagement strategy",
            };

          case "content_length_optimization":
            return {
              category: "opportunity",
              title: "Content Length Optimization",
              description: `Current average: ${data.current_avg_length} characters. Optimal range: ${data.optimal_range}`,
              metric: `${data.current_avg_length} chars`,
              impact:
                insight.performance_impact > 15
                  ? "high"
                  : insight.performance_impact > 8
                  ? "medium"
                  : "low",
              recommendation:
                insight.recommendations?.[0] || "Optimize your content length",
            };

          case "posting_consistency":
            return {
              category:
                data.consistency_score >= 80 ? "working" : "opportunity",
              title:
                data.consistency_score >= 80
                  ? "Great Posting Consistency"
                  : "Consistency Opportunity",
              description: `Current frequency: ${data.current_frequency} posts. Recommended: ${data.recommended_frequency}`,
              metric: `${data.current_frequency} posts`,
              impact:
                insight.performance_impact > 15
                  ? "high"
                  : insight.performance_impact > 8
                  ? "medium"
                  : "low",
              recommendation:
                insight.recommendations?.[0] ||
                "Maintain your posting schedule",
            };

          case "performance_stability":
            return {
              category: "opportunity",
              title: "Performance Variance Detected",
              description: `Engagement varies by ${data.engagement_variance}%. Your best post: ${data.best_performing_rate}%`,
              metric: `${data.engagement_variance}% variance`,
              impact:
                insight.performance_impact > 15
                  ? "high"
                  : insight.performance_impact > 8
                  ? "medium"
                  : "low",
              recommendation:
                insight.recommendations?.[0] ||
                "Analyze your top performing content",
            };

          case "engagement_depth":
            return {
              category: "improvement",
              title: "Engagement Depth Analysis",
              description: `${
                data.engagement_depth === "shallow"
                  ? "Mostly likes, few comments"
                  : "Good comment engagement"
              }`,
              metric: `${(parseFloat(data.comment_rate) || 0).toFixed(
                1
              )}% comments`,
              impact:
                insight.performance_impact > 15
                  ? "high"
                  : insight.performance_impact > 8
                  ? "medium"
                  : "low",
              recommendation:
                insight.recommendations?.[0] ||
                "Focus on driving more meaningful engagement",
            };

          default:
            return {
              category: "working",
              title: insight.insight_type
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
              description: "AI analysis of your content performance",
              metric: `${(insight.confidence_score * 100).toFixed(0)}%`,
              impact:
                insight.performance_impact > 15
                  ? "high"
                  : insight.performance_impact > 8
                  ? "medium"
                  : "low",
              recommendation:
                insight.recommendations?.[0] ||
                "Continue monitoring performance",
            };
        }
      });
    }

    // Fallback to basic analysis if no database insights
    if (!stats || !topPosts) return [];

    const fallbackInsights: LearningInsight[] = [];

    // Basic engagement analysis
    if (stats.averageEngagementRate > 2.5) {
      fallbackInsights.push({
        category: "working",
        title: "Strong Engagement Rate",
        description: `Your content is performing above industry average with ${stats.averageEngagementRate.toFixed(
          1
        )}% engagement`,
        metric: `${stats.averageEngagementRate.toFixed(1)}%`,
        impact: "high",
        recommendation:
          "Continue your current content strategy - it's resonating well with your audience!",
      });
    } else if (stats.averageEngagementRate < 1.5) {
      fallbackInsights.push({
        category: "improvement",
        title: "Engagement Below Average",
        description:
          "Your engagement rate could be improved with more interactive content",
        metric: `${stats.averageEngagementRate.toFixed(1)}%`,
        impact: "high",
        recommendation:
          "Try asking questions, sharing personal stories, or creating polls to boost engagement",
      });
    }

    // Content type analysis
    const contentTypes = topPosts.reduce((acc: any, post) => {
      const type = post.content_type || "general";
      if (!acc[type]) acc[type] = { count: 0, totalEngagement: 0 };
      acc[type].count++;
      acc[type].totalEngagement += post.engagement_rate;
      return acc;
    }, {});

    const bestType = Object.entries(contentTypes).reduce(
      (best: any, [type, data]: any) => {
        const avgEngagement = data.totalEngagement / data.count;
        return !best || avgEngagement > best.avgEngagement
          ? { type, avgEngagement, count: data.count }
          : best;
      },
      null
    );

    if (bestType && bestType.count >= 2) {
      fallbackInsights.push({
        category: "working",
        title: `${
          bestType.type.charAt(0).toUpperCase() + bestType.type.slice(1)
        } Content Performs Best`,
        description: `Your ${
          bestType.type
        } posts average ${bestType.avgEngagement.toFixed(1)}% engagement`,
        metric: `${bestType.avgEngagement.toFixed(1)}%`,
        impact: "medium",
        recommendation: `Create more ${bestType.type} content to maintain high engagement rates`,
      });
    }

    // Posting frequency analysis
    if (stats.totalPosts < 10) {
      fallbackInsights.push({
        category: "opportunity",
        title: "Build Content Library",
        description: "More content needed for better performance analysis",
        metric: `${stats.totalPosts} posts`,
        impact: "medium",
        recommendation:
          "Aim for 3-4 posts per week to build momentum and improve AI insights",
      });
    }

    return fallbackInsights;
  }, [insights, stats, topPosts]);

  const openPostDialog = (post: any) => {
    setSelectedPost({
      id: post.id,
      title:
        post.title || `${post.content?.substring(0, 50)}...` || "Untitled Post",
      content: post.content || "",
      engagement_rate: post.engagement_rate,
      impressions: post.impressions,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      posted_at: post.posted_at || "",
      content_type: post.content_type || "general",
    });
    setPostDialogOpen(true);
  };

  // Data is already loaded on the server, no need for loading states

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Impressions
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transformedStats?.totalImpressions?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {transformedStats?.impressionGrowth !== undefined && (
                <span
                  className={`flex items-center ${
                    transformedStats.impressionGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transformedStats.impressionGrowth >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(transformedStats.impressionGrowth).toFixed(1)}% from
                  last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Engagement
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transformedStats?.totalEngagements?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {transformedStats?.engagementGrowth !== undefined && (
                <span
                  className={`flex items-center ${
                    transformedStats.engagementGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transformedStats.engagementGrowth >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(transformedStats.engagementGrowth).toFixed(1)}% from
                  last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transformedStats?.averageEngagementRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {transformedStats?.averageEngagementRate && (
                <span
                  className={`flex items-center ${
                    transformedStats.averageEngagementRate >= 2.0
                      ? "text-green-600"
                      : transformedStats.averageEngagementRate >= 1.0
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {transformedStats.averageEngagementRate >= 2.0 ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Above average
                    </>
                  ) : transformedStats.averageEngagementRate >= 1.0 ? (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Average
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Below average
                    </>
                  )}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Posts Analyzed
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transformedStats?.totalPosts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {transformedStats?.totalPosts &&
              transformedStats.totalPosts > 0 ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  AI learning active
                </span>
              ) : (
                <span className="text-gray-500">No data yet</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Learning Insights
            <Badge variant="secondary" className="ml-2">
              What&apos;s Working & What&apos;s Not
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {learningInsights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {learningInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.category === "working"
                      ? "border-l-green-500 bg-green-50"
                      : insight.category === "improvement"
                      ? "border-l-red-500 bg-red-50"
                      : "border-l-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {insight.category === "working" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : insight.category === "improvement" ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                      )}
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                    </div>
                    <Badge
                      variant={
                        insight.impact === "high"
                          ? "destructive"
                          : insight.impact === "medium"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {insight.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {insight.metric}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {insight.category === "working"
                        ? "What's Working"
                        : insight.category === "improvement"
                        ? "Needs Work"
                        : "Opportunity"}
                    </Badge>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Recommendation:
                        </p>
                        <p className="text-xs text-gray-600">
                          {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No AI Insights Available Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {stats.totalPosts === 0
                  ? "Create and post some content to get personalized AI insights about what works best for your audience."
                  : stats.totalPosts < 3
                  ? "Keep posting content! We need at least 3 posts with performance data to generate meaningful insights."
                  : "Generate AI insights to understand what content performs best for your audience."}
              </p>
              <div className="space-y-4">
                {stats.totalPosts >= 3 && (
                  <Button
                    onClick={() => setShowRegenerationModal(true)}
                    disabled={regeneratingInsights}
                    className="mr-4"
                  >
                    {regeneratingInsights ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Insights...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate AI Insights
                      </>
                    )}
                  </Button>
                )}
                {stats.totalPosts === 0 && (
                  <Alert>
                    <BookOpen className="h-4 w-4" />
                    <AlertDescription>
                      Start by creating your first post in the{" "}
                      <a
                        href="/posts/create"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Post Creator
                      </a>{" "}
                      to begin getting personalized insights.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {learningInsights.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Want more personalized insights?
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerationModal(true)}
                  disabled={regeneratingInsights}
                >
                  {regeneratingInsights ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    "Regenerate Insights"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementChart data={topPosts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceMetrics data={topPosts} stats={transformedStats} />
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Top Performing Posts
            <Badge variant="secondary" className="ml-2">
              Click to view details
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts && topPosts.length > 0 ? (
            <div className="space-y-4">
              {topPosts.slice(0, 5).map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openPostDialog(post)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {post.content_type || "General"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {post.posted_at &&
                          new Date(post.posted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                      {post.title ||
                        `${post.content?.substring(0, 60)}...` ||
                        "Untitled Post"}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {post.content?.substring(0, 120)}...
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-green-600">
                      {post.engagement_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {post.impressions?.toLocaleString()} views
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <span>{post.likes} 👍</span>
                      <span>{post.comments} 💬</span>
                      <span>{post.shares} 🔄</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 ml-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Performance Data Yet
              </h3>
              <p className="text-gray-600">
                Add analytics to your posts to see which content performs best
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Powered Insights & Recommendations
              <Badge variant="secondary" className="ml-2">
                Personalized for you
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateInsights}
              disabled={regeneratingInsights}
              className={`text-purple-600 border-purple-200 hover:bg-purple-50 transition-all ${
                regeneratingInsights ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              <Zap
                className={`h-4 w-4 mr-1 ${
                  regeneratingInsights ? "animate-pulse" : ""
                }`}
              />
              {regeneratingInsights ? "Generating..." : "Regenerate Insights"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uniqueInsights && uniqueInsights.length > 0 ? (
            <div
              className={`space-y-6 transition-opacity ${
                regeneratingInsights ? "opacity-50" : ""
              }`}
            >
              {/* Quick Action Items */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">
                    🚀 Quick Wins - Take Action Today
                  </h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {uniqueInsights
                    .filter((insight) => insight.performance_impact > 20)
                    .slice(0, 2)
                    .map((insight, index) => (
                      <div
                        key={`quick-win-${insight.insight_type}-${insight.id}`}
                        className="p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-900 capitalize">
                            {insight.insight_type.replace("_", " ")}
                          </span>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            +{insight.performance_impact.toFixed(0)}% impact
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {insight.recommendations[0]}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          High confidence:{" "}
                          {Math.round(insight.confidence_score * 100)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Detailed Insights by Category */}
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {uniqueInsights.map((insight, index) => {
                  const insightData =
                    typeof insight.insight_data === "string"
                      ? JSON.parse(insight.insight_data)
                      : insight.insight_data;

                  return (
                    <div
                      key={`detailed-${insight.insight_type}-${insight.id}`}
                      className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {insight.insight_type === "content_performance" && (
                            <Target className="h-5 w-5 text-blue-600" />
                          )}
                          {insight.insight_type === "posting_time" && (
                            <Clock className="h-5 w-5 text-green-600" />
                          )}
                          {insight.insight_type === "audience_analysis" && (
                            <Users className="h-5 w-5 text-purple-600" />
                          )}
                          {insight.insight_type === "content_optimization" && (
                            <BookOpen className="h-5 w-5 text-orange-600" />
                          )}
                          {insight.insight_type === "audience_insights" && (
                            <Eye className="h-5 w-5 text-indigo-600" />
                          )}
                          {insight.insight_type === "growth_strategy" && (
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                          )}
                          {insight.insight_type === "content_gaps" && (
                            <Target className="h-5 w-5 text-red-600" />
                          )}
                          {insight.insight_type === "engagement_velocity" && (
                            <Zap className="h-5 w-5 text-yellow-600" />
                          )}
                          {insight.insight_type === "competitive_insights" && (
                            <BarChart3 className="h-5 w-5 text-cyan-600" />
                          )}
                          {insight.insight_type === "performance_forecast" && (
                            <Star className="h-5 w-5 text-pink-600" />
                          )}
                          <span className="font-semibold text-gray-900 capitalize">
                            {insight.insight_type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              insight.confidence_score > 0.9
                                ? "border-green-300 text-green-700"
                                : insight.confidence_score > 0.8
                                ? "border-yellow-300 text-yellow-700"
                                : "border-gray-300 text-gray-700"
                            }`}
                          >
                            {Math.round(insight.confidence_score * 100)}%
                            confident
                          </Badge>
                        </div>
                      </div>

                      {/* Key Insights Data */}
                      {insightData && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            📊 Key Findings:
                          </h4>
                          <div className="grid gap-2 text-sm">
                            {insight.insight_type === "content_performance" &&
                              insightData.top_topics && (
                                <div>
                                  <span className="text-gray-600">
                                    Top Topics:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {insightData.top_topics.join(", ")}
                                  </span>
                                </div>
                              )}
                            {insight.insight_type === "posting_time" &&
                              insightData.optimal_days && (
                                <div>
                                  <span className="text-gray-600">
                                    Best Days:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {insightData.optimal_days.join(", ")}
                                  </span>
                                </div>
                              )}
                            {insight.insight_type === "content_optimization" &&
                              insightData.best_performing_length && (
                                <div>
                                  <span className="text-gray-600">
                                    Optimal Length:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {insightData.best_performing_length}
                                  </span>
                                </div>
                              )}
                            {insight.insight_type === "audience_analysis" &&
                              insightData.primary_demographics && (
                                <div>
                                  <span className="text-gray-600">
                                    Target Industries:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {insightData.primary_demographics.industries?.join(
                                      ", "
                                    ) || "Various"}
                                  </span>
                                </div>
                              )}
                            {insight.insight_type === "growth_strategy" &&
                              insightData.follower_growth_rate && (
                                <div>
                                  <span className="text-gray-600">
                                    Growth Rate:{" "}
                                  </span>
                                  <span className="font-medium text-green-600">
                                    +{insightData.follower_growth_rate}% monthly
                                  </span>
                                </div>
                              )}
                            {insight.insight_type === "content_gaps" &&
                              insightData.missing_content_types && (
                                <div>
                                  <span className="text-gray-600">
                                    Missing Content:{" "}
                                  </span>
                                  <span className="font-medium text-red-600">
                                    {insightData.missing_content_types.join(
                                      ", "
                                    )}
                                  </span>
                                </div>
                              )}
                            {insight.insight_type === "engagement_velocity" &&
                              insightData.peak_engagement_window && (
                                <div>
                                  <span className="text-gray-600">
                                    Peak Window:{" "}
                                  </span>
                                  <span className="font-medium text-yellow-600">
                                    {insightData.peak_engagement_window.replace(
                                      "_",
                                      " "
                                    )}
                                  </span>
                                </div>
                              )}
                            {insight.insight_type === "competitive_insights" &&
                              insightData.trending_hashtags && (
                                <div>
                                  <span className="text-gray-600">
                                    Trending:{" "}
                                  </span>
                                  <span className="font-medium text-cyan-600">
                                    {insightData.trending_hashtags.join(", ")}
                                  </span>
                                </div>
                              )}
                            {insight.insight_type === "performance_forecast" &&
                              insightData.predicted_growth && (
                                <div>
                                  <span className="text-gray-600">
                                    Next Month:{" "}
                                  </span>
                                  <span className="font-medium text-green-600">
                                    +{insightData.predicted_growth.next_month}%
                                    growth predicted
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          💡 Action Items:
                        </h4>
                        {insight.recommendations.map(
                          (rec: string, recIndex: number) => (
                            <div
                              key={recIndex}
                              className="flex items-start gap-2 text-sm text-gray-700 p-2 bg-white rounded border-l-2 border-blue-200"
                            >
                              <span className="text-blue-600 font-bold text-xs mt-0.5">
                                {recIndex + 1}.
                              </span>
                              <span>{rec}</span>
                            </div>
                          )
                        )}
                      </div>

                      {/* Performance Impact */}
                      <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Potential Impact:
                          </span>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-green-700">
                              +{insight.performance_impact.toFixed(1)}%
                              engagement
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={Math.min(insight.performance_impact * 2, 100)}
                          className="h-2 mt-2"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Learning Progress */}
              {/* <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-900">
                    🧠 AI Learning Progress
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">
                      {uniqueInsights.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Insights</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        (uniqueInsights.reduce(
                          (sum, i) => sum + i.confidence_score,
                          0
                        ) /
                          uniqueInsights.length) *
                          100
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Avg Confidence</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      +
                      {Math.round(
                        uniqueInsights.reduce(
                          (sum, i) => sum + i.performance_impact,
                          0
                        )
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Total Potential</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-indigo-700">
                  💡 Your AI assistant is analyzing your content patterns and
                  audience behavior to provide personalized recommendations. The
                  more you post and engage, the smarter these insights become!
                </div>
              </div> */}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-6">
                <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  🤖 AI Assistant Warming Up
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your AI-powered insights are being generated! Post more
                  content with analytics to unlock personalized recommendations
                  that can boost your engagement by 20-40%.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto text-sm">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <div className="font-medium text-blue-900">
                    Content Optimization
                  </div>
                  <div className="text-blue-700">Best topics & formats</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <div className="font-medium text-green-900">
                    Timing Insights
                  </div>
                  <div className="text-green-700">Optimal posting schedule</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <div className="font-medium text-purple-900">
                    Audience Analysis
                  </div>
                  <div className="text-purple-700">Engagement patterns</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Detail Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Post Performance Details
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-6">
              {/* Post Header */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{selectedPost.content_type}</Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedPost.posted_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedPost.title}
                </h3>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Eye className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedPost.impressions.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700">Impressions</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Heart className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <div className="text-2xl font-bold text-green-900">
                    {selectedPost.likes}
                  </div>
                  <div className="text-xs text-green-700">Likes</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <MessageSquare className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                  <div className="text-2xl font-bold text-purple-900">
                    {selectedPost.comments}
                  </div>
                  <div className="text-xs text-purple-700">Comments</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Share className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                  <div className="text-2xl font-bold text-orange-900">
                    {selectedPost.shares}
                  </div>
                  <div className="text-xs text-orange-700">Shares</div>
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Engagement Rate
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      selectedPost.engagement_rate >= 3.0
                        ? "text-green-600"
                        : selectedPost.engagement_rate >= 1.5
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedPost.engagement_rate.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(selectedPost.engagement_rate * 10, 100)}
                  className="h-2"
                />
                <div className="text-xs text-gray-600 mt-1">
                  {selectedPost.engagement_rate >= 3.0
                    ? "Excellent performance!"
                    : selectedPost.engagement_rate >= 1.5
                    ? "Good performance"
                    : "Room for improvement"}
                </div>
              </div>

              {/* Post Content */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedPost.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Insights Regeneration Modal */}
      <InsightsRegenerationModal
        open={showRegenerationModal}
        onOpenChange={setShowRegenerationModal}
        isGenerating={regeneratingInsights}
      />
    </div>
  );
}
