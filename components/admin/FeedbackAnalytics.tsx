"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";

interface FeedbackStats {
  totalFeedback: number;
  avgRating: number;
  responseRate: number;
  satisfactionScore: number;
  feedbackByType: Array<{ type: string; count: number; percentage: number }>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  topIssues: Array<{
    issue: string;
    count: number;
    severity: "high" | "medium" | "low";
  }>;
  improvementSuggestions: Array<{
    suggestion: string;
    frequency: number;
    impact: "high" | "medium" | "low";
  }>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export function FeedbackAnalytics() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();

  useEffect(() => {
    fetchFeedbackStats();
  }, []);

  const fetchFeedbackStats = async () => {
    try {
      setLoading(true);

      // Fetch post feedback data
      const { data: postFeedback, error: postError } = await supabase.from(
        "post_feedback"
      ).select(`
          *,
          profiles(full_name, email)
        `);

      if (postError) {
        console.error("Error fetching post feedback:", postError);
      }

      // Fetch user feedback data
      const { data: userFeedback, error: userError } = await supabase.from(
        "user_feedback"
      ).select(`
          *,
          profiles(full_name, email)
        `);

      if (userError) {
        console.error("Error fetching user feedback:", userError);
      }

      const allFeedback = [
        ...(postFeedback || []).map((f) => ({ ...f, source: "post" })),
        ...(userFeedback || []).map((f) => ({ ...f, source: "user" })),
      ];

      if (allFeedback.length === 0) {
        setStats({
          totalFeedback: 0,
          avgRating: 0,
          responseRate: 0,
          satisfactionScore: 0,
          feedbackByType: [],
          ratingDistribution: [],
          topIssues: [],
          improvementSuggestions: [],
          sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
        });
        return;
      }

      // Calculate real statistics from actual data
      const totalFeedback = allFeedback.length;
      const feedbackWithRatings = allFeedback.filter(
        (f) => f.rating && f.rating > 0
      );
      const ratingsSum = feedbackWithRatings.reduce(
        (sum, f) => sum + (f.rating || 0),
        0
      );
      const avgRating =
        feedbackWithRatings.length > 0
          ? ratingsSum / feedbackWithRatings.length
          : 0;

      const resolvedCount = allFeedback.filter((f) => f.is_resolved).length;
      const responseRate =
        totalFeedback > 0 ? (resolvedCount / totalFeedback) * 100 : 0;

      // Feedback by type (real data)
      const postCount = postFeedback?.length || 0;
      const userCount = userFeedback?.length || 0;
      const feedbackByType = [
        {
          type: "Post Feedback",
          count: postCount,
          percentage: totalFeedback > 0 ? (postCount / totalFeedback) * 100 : 0,
        },
        {
          type: "User Feedback",
          count: userCount,
          percentage: totalFeedback > 0 ? (userCount / totalFeedback) * 100 : 0,
        },
      ].filter((type) => type.count > 0);

      // Rating distribution (real data)
      const ratingCounts: { [key: number]: number } = {};
      feedbackWithRatings.forEach((f) => {
        if (f.rating) {
          ratingCounts[f.rating] = (ratingCounts[f.rating] || 0) + 1;
        }
      });

      const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
        const rating = i + 1;
        const count = ratingCounts[rating] || 0;
        return {
          rating,
          count,
          percentage:
            feedbackWithRatings.length > 0
              ? (count / feedbackWithRatings.length) * 100
              : 0,
        };
      }).filter((r) => r.count > 0);

      // Analyze real issues from disliked_aspects
      const allDislikes: string[] = [];
      allFeedback.forEach((f) => {
        if (f.disliked_aspects && Array.isArray(f.disliked_aspects)) {
          allDislikes.push(...f.disliked_aspects);
        }
      });

      const dislikeFrequency: { [key: string]: number } = {};
      allDislikes.forEach((issue) => {
        dislikeFrequency[issue] = (dislikeFrequency[issue] || 0) + 1;
      });

      const topIssues = Object.entries(dislikeFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([issue, count]) => ({
          issue,
          count,
          severity: (count > 5 ? "high" : count > 2 ? "medium" : "low") as
            | "high"
            | "medium"
            | "low",
        }));

      // Analyze real improvement suggestions
      const suggestions = allFeedback
        .filter((f) => f.improvement_suggestions)
        .map((f) => f.improvement_suggestions)
        .filter((suggestion): suggestion is string => Boolean(suggestion));

      const suggestionFrequency: { [key: string]: number } = {};
      suggestions.forEach((suggestion) => {
        const key = suggestion.toLowerCase().trim();
        if (key) {
          suggestionFrequency[key] = (suggestionFrequency[key] || 0) + 1;
        }
      });

      const improvementSuggestions = Object.entries(suggestionFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([suggestion, frequency]) => ({
          suggestion,
          frequency,
          impact: (frequency > 3
            ? "high"
            : frequency > 1
            ? "medium"
            : "low") as "high" | "medium" | "low",
        }));

      // Sentiment analysis based on real ratings
      const positive = feedbackWithRatings.filter(
        (f) => (f.rating || 0) >= 4
      ).length;
      const negative = feedbackWithRatings.filter(
        (f) => (f.rating || 0) <= 2
      ).length;
      const neutral = feedbackWithRatings.length - positive - negative;

      const sentimentAnalysis = {
        positive:
          feedbackWithRatings.length > 0
            ? (positive / feedbackWithRatings.length) * 100
            : 0,
        neutral:
          feedbackWithRatings.length > 0
            ? (neutral / feedbackWithRatings.length) * 100
            : 0,
        negative:
          feedbackWithRatings.length > 0
            ? (negative / feedbackWithRatings.length) * 100
            : 0,
      };

      const satisfactionScore = avgRating > 0 ? (avgRating / 5) * 100 : 0;

      setStats({
        totalFeedback,
        avgRating,
        responseRate,
        satisfactionScore,
        feedbackByType,
        ratingDistribution,
        topIssues,
        improvementSuggestions,
        sentimentAnalysis,
      });
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || stats.totalFeedback === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <MessageSquare className="h-12 w-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                No Feedback Data
              </h3>
              <p className="text-gray-500 mt-1">
                No feedback has been collected yet. Once users start providing
                feedback, analytics will appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Feedback
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalFeedback}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All feedback received
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average Rating
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
                  </p>
                  {stats.avgRating > 0 && (
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(stats.avgRating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.avgRating > 0 ? "Out of 5 stars" : "No ratings yet"}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Response Rate
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.responseRate.toFixed(0)}%
                </p>
                <div className="mt-2">
                  <Progress value={stats.responseRate} className="h-2" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Feedback responded to
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Satisfaction Score
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.satisfactionScore > 0
                    ? stats.satisfactionScore.toFixed(0) + "%"
                    : "N/A"}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.satisfactionScore >= 70 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : stats.satisfactionScore > 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : null}
                  <p className="text-xs text-gray-500">
                    {stats.satisfactionScore > 0
                      ? "Overall satisfaction"
                      : "No data yet"}
                  </p>
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditional sections based on data availability */}
      {stats.ratingDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.ratingDistribution.map((rating) => (
                <div key={rating.rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-20">
                    <span className="font-medium">{rating.rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1">
                    <Progress value={rating.percentage} className="h-2" />
                  </div>
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {rating.count} ({rating.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Analysis - only show if we have ratings */}
      {stats.avgRating > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.sentimentAnalysis.positive.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Positive Feedback</div>
                <Progress
                  value={stats.sentimentAnalysis.positive}
                  className="h-2 mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.sentimentAnalysis.neutral.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Neutral Feedback</div>
                <Progress
                  value={stats.sentimentAnalysis.neutral}
                  className="h-2 mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.sentimentAnalysis.negative.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Negative Feedback</div>
                <Progress
                  value={stats.sentimentAnalysis.negative}
                  className="h-2 mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues and Suggestions - only show if we have data */}
      {(stats.topIssues.length > 0 ||
        stats.improvementSuggestions.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Top Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topIssues.length > 0 ? (
                  stats.topIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            issue.severity === "high"
                              ? "destructive"
                              : issue.severity === "medium"
                              ? "default"
                              : "outline"
                          }
                        >
                          {issue.severity}
                        </Badge>
                        <span className="text-sm capitalize">
                          {issue.issue}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {issue.count} report{issue.count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No issues reported yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-500" />
                Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.improvementSuggestions.length > 0 ? (
                  stats.improvementSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm">{suggestion.suggestion}</p>
                        <Badge
                          variant={
                            suggestion.impact === "high"
                              ? "default"
                              : suggestion.impact === "medium"
                              ? "outline"
                              : "secondary"
                          }
                          className="mt-1"
                        >
                          {suggestion.impact} impact
                        </Badge>
                      </div>
                      <Badge variant="outline">{suggestion.frequency}x</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No suggestions available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Type Distribution */}
      {stats.feedbackByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.feedbackByType.map((type, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{type.type}</h3>
                    <Badge variant="outline">{type.count}</Badge>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {type.percentage.toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
