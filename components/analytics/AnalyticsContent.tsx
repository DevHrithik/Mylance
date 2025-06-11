"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Users,
  Zap,
  Award,
  Brain,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsContentProps {
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

export function AnalyticsContent({
  initialData,
  userId,
}: AnalyticsContentProps) {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [regeneratingInsights, setRegeneratingInsights] = useState(false);

  const { stats, topPosts, insights } = initialData;

  // Generate learning insights based on performance data
  const learningInsights = useMemo(() => {
    const insights: any[] = [];

    // What's working well
    if (stats.averageEngagementRate > 2.5) {
      insights.push({
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
    }

    // Growth opportunities
    if (stats.totalPosts < 10) {
      insights.push({
        category: "opportunity",
        title: "Consistency Opportunity",
        description:
          "More consistent posting could significantly improve your reach",
        metric: `${stats.totalPosts} posts`,
        impact: "medium",
        recommendation:
          "Aim to post 3-4 times per week to build audience engagement",
      });
    }

    return insights;
  }, [stats]);

  const handleRegenerateInsights = async () => {
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

      toast.success("Insights regenerated successfully!");
      // Optionally trigger a revalidation here
    } catch (error) {
      console.error("Error regenerating insights:", error);
      toast.error("Failed to regenerate insights");
    } finally {
      setRegeneratingInsights(false);
    }
  };

  const openPostDialog = (post: any) => {
    setSelectedPost(post);
    setPostDialogOpen(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              Content published to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Impressions
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.totalImpressions)}
            </div>
            <p className="text-xs text-muted-foreground">People reached</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(stats.averageEngagementRate)}
            </div>
            <p className="text-xs text-muted-foreground">Average engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Interactions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(
                stats.totalLikes + stats.totalComments + stats.totalShares
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Likes, comments & shares
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length > 0 ? (
            <div className="space-y-4">
              {topPosts.slice(0, 5).map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openPostDialog(post)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-2">
                      {post.title || post.content.substring(0, 100) + "..."}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(post.analytics_data?.impressions || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(post.analytics_data?.likes || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {formatNumber(post.analytics_data?.comments || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2">
                      #{index + 1}
                    </Badge>
                    <p className="text-sm font-medium text-green-600">
                      {formatPercentage(
                        post.analytics_data?.engagement_rate || 0
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No analytics data available yet</p>
              <p className="text-sm">
                Add performance data to your posts to see insights
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Learning Insights
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateInsights}
            disabled={regeneratingInsights}
          >
            <Zap className="h-4 w-4 mr-2" />
            {regeneratingInsights ? "Regenerating..." : "Regenerate"}
          </Button>
        </CardHeader>
        <CardContent>
          {insights.length > 0 || learningInsights.length > 0 ? (
            <div className="space-y-4">
              {learningInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.category === "working"
                      ? "border-green-500 bg-green-50"
                      : insight.category === "improvement"
                      ? "border-orange-500 bg-orange-50"
                      : "border-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {insight.category === "working" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : insight.category === "improvement" ? (
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                        )}
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge
                          variant={
                            insight.impact === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {insight.description}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        💡 {insight.recommendation}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">
                        {insight.metric}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {insights.map((insight, index) => (
                <div
                  key={insight.id || index}
                  className="p-4 border rounded-lg"
                >
                  <h4 className="font-medium mb-2">{insight.insight_type}</h4>
                  <p className="text-sm text-gray-700">{insight.content}</p>
                  {insight.confidence_score && (
                    <div className="mt-2">
                      <Badge variant="outline">
                        {Math.round(insight.confidence_score * 100)}% confidence
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No insights available yet</p>
              <p className="text-sm">
                Insights will appear as you create and analyze more content
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Detail Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Performance Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-2xl font-bold">
                    {formatNumber(
                      selectedPost.analytics_data?.impressions || 0
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Impressions</p>
                </div>
                <div className="text-center">
                  <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">
                    {formatNumber(selectedPost.analytics_data?.likes || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Likes</p>
                </div>
                <div className="text-center">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">
                    {formatNumber(selectedPost.analytics_data?.comments || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Comments</p>
                </div>
                <div className="text-center">
                  <Share className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">
                    {formatNumber(selectedPost.analytics_data?.shares || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Shares</p>
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Engagement Rate</p>
                <p className="text-3xl font-bold text-blue-700">
                  {formatPercentage(
                    selectedPost.analytics_data?.engagement_rate || 0
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
