"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";

interface TrendData {
  date: string;
  avgRating: number;
  feedbackCount: number;
  resolvedCount: number;
  resolutionRate: number;
}

interface TrendStats {
  weeklyTrends: TrendData[];
  ratingTrend: number;
  volumeTrend: number;
  resolutionTrend: number;
  topCategories: Array<{ category: string; count: number }>;
  responseMetrics: {
    avgResponseTime: number;
    resolutionRate: number;
    customerSatisfaction: number;
  };
  hasInsufficientData: boolean;
}

export function FeedbackTrends() {
  const [trends, setTrends] = useState<TrendStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const supabase = useSupabaseClient();

  useEffect(() => {
    fetchTrendData();
  }, [timeRange]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);

      // Fetch post feedback with dates
      const { data: postFeedback, error: postError } = await supabase
        .from("post_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (postError) {
        console.error("Error fetching post feedback:", postError);
      }

      // Fetch user feedback with dates
      const { data: userFeedback, error: userError } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (userError) {
        console.error("Error fetching user feedback:", userError);
      }

      const allFeedback = [
        ...(postFeedback || []).map((f) => ({ ...f, source: "post" })),
        ...(userFeedback || []).map((f) => ({ ...f, source: "user" })),
      ];

      // If we don't have enough data for meaningful trends
      if (allFeedback.length < 2) {
        setTrends({
          weeklyTrends: [],
          ratingTrend: 0,
          volumeTrend: 0,
          resolutionTrend: 0,
          topCategories: [],
          responseMetrics: {
            avgResponseTime: 0,
            resolutionRate: 0,
            customerSatisfaction: 0,
          },
          hasInsufficientData: true,
        });
        return;
      }

      // Calculate date range
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Filter feedback within the selected time range
      const recentFeedback = allFeedback.filter((f) => {
        if (!f.created_at) return false;
        const feedbackDate = new Date(f.created_at);
        return feedbackDate >= cutoffDate;
      });

      // Group feedback by day for the last 7 days (for weekly trends)
      const weeklyTrends: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayFeedback = recentFeedback.filter((f) => {
          if (!f.created_at) return false;
          const feedbackDate = new Date(f.created_at);
          return feedbackDate >= dayStart && feedbackDate <= dayEnd;
        });

        const feedbackWithRatings = dayFeedback.filter(
          (f) => f.rating && f.rating > 0
        );
        const avgRating =
          feedbackWithRatings.length > 0
            ? feedbackWithRatings.reduce((sum, f) => sum + (f.rating || 0), 0) /
              feedbackWithRatings.length
            : 0;

        const resolvedCount = dayFeedback.filter((f) => f.is_resolved).length;
        const resolutionRate =
          dayFeedback.length > 0
            ? (resolvedCount / dayFeedback.length) * 100
            : 0;

        weeklyTrends.push({
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          avgRating,
          feedbackCount: dayFeedback.length,
          resolvedCount,
          resolutionRate,
        });
      }

      // Calculate trends (comparing first half vs second half of the period)
      const midPoint = Math.floor(weeklyTrends.length / 2);
      const firstHalf = weeklyTrends.slice(0, midPoint);
      const secondHalf = weeklyTrends.slice(midPoint);

      const firstHalfAvgRating =
        firstHalf.length > 0
          ? firstHalf.reduce((sum, d) => sum + d.avgRating, 0) /
            firstHalf.length
          : 0;
      const secondHalfAvgRating =
        secondHalf.length > 0
          ? secondHalf.reduce((sum, d) => sum + d.avgRating, 0) /
            secondHalf.length
          : 0;

      const ratingTrend =
        firstHalfAvgRating > 0
          ? ((secondHalfAvgRating - firstHalfAvgRating) / firstHalfAvgRating) *
            100
          : 0;

      const firstHalfVolume = firstHalf.reduce(
        (sum, d) => sum + d.feedbackCount,
        0
      );
      const secondHalfVolume = secondHalf.reduce(
        (sum, d) => sum + d.feedbackCount,
        0
      );
      const volumeTrend =
        firstHalfVolume > 0
          ? ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100
          : 0;

      const firstHalfResolution =
        firstHalf.length > 0
          ? firstHalf.reduce((sum, d) => sum + d.resolutionRate, 0) /
            firstHalf.length
          : 0;
      const secondHalfResolution =
        secondHalf.length > 0
          ? secondHalf.reduce((sum, d) => sum + d.resolutionRate, 0) /
            secondHalf.length
          : 0;
      const resolutionTrend =
        firstHalfResolution > 0
          ? ((secondHalfResolution - firstHalfResolution) /
              firstHalfResolution) *
            100
          : 0;

      // Analyze real feedback categories
      const categoryCount: { [key: string]: number } = {};
      recentFeedback.forEach((f) => {
        const category = f.feedback_type || f.source || "general";
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({
          category,
          count,
        }));

      // Calculate real response metrics
      const totalResolved = recentFeedback.filter((f) => f.is_resolved).length;
      const resolutionRate =
        recentFeedback.length > 0
          ? (totalResolved / recentFeedback.length) * 100
          : 0;

      const feedbackWithRatings = recentFeedback.filter(
        (f) => f.rating && f.rating > 0
      );
      const avgRating =
        feedbackWithRatings.length > 0
          ? feedbackWithRatings.reduce((sum, f) => sum + (f.rating || 0), 0) /
            feedbackWithRatings.length
          : 0;
      const customerSatisfaction = avgRating > 0 ? (avgRating / 5) * 100 : 0;

      const responseMetrics = {
        avgResponseTime: 0, // This would need to be calculated from actual response timestamps
        resolutionRate,
        customerSatisfaction,
      };

      setTrends({
        weeklyTrends,
        ratingTrend,
        volumeTrend,
        resolutionTrend,
        topCategories,
        responseMetrics,
        hasInsufficientData: false,
      });
    } catch (error) {
      console.error("Error fetching trend data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-40 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!trends || trends.hasInsufficientData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Calendar className="h-12 w-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Insufficient Data for Trends
              </h3>
              <p className="text-gray-500 mt-1">
                Not enough feedback data to show meaningful trends. At least 2
                feedback entries are needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (Math.abs(trend) < 1) return null;
    return trend > 0 ? (
      <ArrowUp className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (trend: number) => {
    if (Math.abs(trend) < 1) return "text-gray-500";
    return trend > 0 ? "text-green-600" : "text-red-600";
  };

  const hasWeeklyData = trends.weeklyTrends.some(
    (day) => day.feedbackCount > 0
  );

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feedback Trends</h2>
          <p className="text-gray-600">
            Track patterns and improvements over time
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(value: "7d" | "30d" | "90d") => setTimeRange(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Rating Trend
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p
                    className={`text-2xl font-bold ${getTrendColor(
                      trends.ratingTrend
                    )}`}
                  >
                    {Math.abs(trends.ratingTrend) < 0.1
                      ? "0.0"
                      : trends.ratingTrend > 0
                      ? "+"
                      : ""}
                    {trends.ratingTrend.toFixed(1)}%
                  </p>
                  {getTrendIcon(trends.ratingTrend)}
                </div>
                <p className="text-xs text-gray-500 mt-1">vs previous period</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Volume Trend
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p
                    className={`text-2xl font-bold ${getTrendColor(
                      trends.volumeTrend
                    )}`}
                  >
                    {Math.abs(trends.volumeTrend) < 0.1
                      ? "0.0"
                      : trends.volumeTrend > 0
                      ? "+"
                      : ""}
                    {trends.volumeTrend.toFixed(1)}%
                  </p>
                  {getTrendIcon(trends.volumeTrend)}
                </div>
                <p className="text-xs text-gray-500 mt-1">feedback volume</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Resolution Trend
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p
                    className={`text-2xl font-bold ${getTrendColor(
                      trends.resolutionTrend
                    )}`}
                  >
                    {Math.abs(trends.resolutionTrend) < 0.1
                      ? "0.0"
                      : trends.resolutionTrend > 0
                      ? "+"
                      : ""}
                    {trends.resolutionTrend.toFixed(1)}%
                  </p>
                  {getTrendIcon(trends.resolutionTrend)}
                </div>
                <p className="text-xs text-gray-500 mt-1">resolution rate</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Performance Summary - only show if we have data */}
      {hasWeeklyData && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {trends.weeklyTrends.map((day, index) => (
                <div key={index} className="text-center p-3 border rounded-lg">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    {day.date}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-lg font-bold">
                        {day.avgRating > 0 ? day.avgRating.toFixed(1) : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {day.feedbackCount}
                      </div>
                      <div className="text-xs text-gray-500">Feedback</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {day.feedbackCount > 0
                          ? day.resolutionRate.toFixed(0) + "%"
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">Resolved</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories and Response Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories - only show if we have data */}
        {trends.topCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Feedback Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trends.topCategories.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="font-medium capitalize">
                        {category.category}
                      </span>
                    </div>
                    <Badge variant="outline">{category.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Response Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Avg Response Time</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">N/A</p>
                  <p className="text-xs text-gray-500">Not tracked yet</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Resolution Rate</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {trends.responseMetrics.resolutionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">Target: &gt; 85%</p>
                  <Progress
                    value={trends.responseMetrics.resolutionRate}
                    className="h-2 mt-1 w-20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Satisfaction</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {trends.responseMetrics.customerSatisfaction > 0
                      ? trends.responseMetrics.customerSatisfaction.toFixed(1) +
                        "%"
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {trends.responseMetrics.customerSatisfaction > 0
                      ? "Target: > 80%"
                      : "No ratings yet"}
                  </p>
                  {trends.responseMetrics.customerSatisfaction > 0 && (
                    <Progress
                      value={trends.responseMetrics.customerSatisfaction}
                      className="h-2 mt-1 w-20"
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
