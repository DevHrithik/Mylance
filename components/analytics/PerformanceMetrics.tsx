"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Target,
  Heart,
  MessageSquare,
  Share,
} from "lucide-react";

interface Post {
  id: string;
  title?: string;
  content?: string;
  content_type?: string;
  engagement_rate: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
}

interface Stats {
  totalPosts: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
}

interface PerformanceMetricsProps {
  data: Post[];
  stats: Stats;
}

export function PerformanceMetrics({ data, stats }: PerformanceMetricsProps) {
  const postPerformance = data;

  if (!postPerformance || postPerformance.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p>No performance data available</p>
        <p className="text-sm">Publish posts to see detailed metrics</p>
      </div>
    );
  }

  // Calculate aggregated metrics from passed stats
  const totalPosts = stats.totalPosts;
  const totalImpressions = stats.totalImpressions;
  const totalLikes = stats.totalLikes;
  const totalComments = stats.totalComments;
  const totalShares = stats.totalShares;
  const avgEngagement = stats.averageEngagementRate;

  // Best performing post
  const bestPost = postPerformance.reduce((best, current) =>
    (current.engagement_rate || 0) > (best.engagement_rate || 0)
      ? current
      : best
  );

  // Engagement breakdown (removed clicks since we removed it from database)
  const engagementBreakdown = [
    {
      label: "Likes",
      value: totalLikes,
      percentage:
        totalImpressions > 0 ? (totalLikes / totalImpressions) * 100 : 0,
      icon: Heart,
      color: "bg-red-500",
    },
    {
      label: "Comments",
      value: totalComments,
      percentage:
        totalImpressions > 0 ? (totalComments / totalImpressions) * 100 : 0,
      icon: MessageSquare,
      color: "bg-blue-500",
    },
    {
      label: "Shares",
      value: totalShares,
      percentage:
        totalImpressions > 0 ? (totalShares / totalImpressions) * 100 : 0,
      icon: Share,
      color: "bg-green-500",
    },
  ];

  // Content type performance
  const contentTypeStats = postPerformance.reduce((acc, post) => {
    const type = post.content_type || "post";
    if (!acc[type]) {
      acc[type] = { count: 0, totalEngagement: 0, totalImpressions: 0 };
    }
    acc[type].count += 1;
    acc[type].totalEngagement += post.engagement_rate || 0;
    acc[type].totalImpressions += post.impressions;
    return acc;
  }, {} as Record<string, { count: number; totalEngagement: number; totalImpressions: number }>);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="engagement">Engagement</TabsTrigger>
        <TabsTrigger value="content">Content Types</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{totalPosts}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(totalImpressions)}
            </div>
            <div className="text-sm text-gray-600">Impressions</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {avgEngagement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg. Engagement</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(totalLikes + totalComments + totalShares)}
            </div>
            <div className="text-sm text-gray-600">Total Interactions</div>
          </div>
        </div>

        {/* Best Performing Post */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Best Performing Post
            </span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {(bestPost.engagement_rate || 0).toFixed(1)}% engagement
            </Badge>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">
            {bestPost.title ||
              `${bestPost.content?.substring(0, 60)}...` ||
              "Untitled Post"}
          </h4>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{formatNumber(bestPost.impressions)} views</span>
            <span>{bestPost.likes} likes</span>
            <span>{bestPost.comments} comments</span>
            <span>{bestPost.shares} shares</span>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="engagement" className="space-y-6">
        {/* Engagement Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Engagement Breakdown</h4>
          {engagementBreakdown.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatNumber(item.value)} ({item.percentage.toFixed(2)}%)
                </div>
              </div>
              <Progress value={item.percentage * 10} className="h-2" />
            </div>
          ))}
        </div>

        {/* Engagement Trends */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            Performance Insights
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>
                Your average engagement rate is{" "}
                <span className="font-medium">
                  {avgEngagement > 2
                    ? "above"
                    : avgEngagement > 1
                    ? "at"
                    : "below"}
                </span>{" "}
                industry average ({avgEngagement.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span>
                Best performing content type:{" "}
                <span className="font-medium">
                  {
                    Object.entries(contentTypeStats).reduce(
                      (best, [type, stats]) =>
                        stats.totalEngagement / stats.count >
                        (best.avgEngagement || 0)
                          ? {
                              type,
                              avgEngagement:
                                stats.totalEngagement / stats.count,
                            }
                          : best,
                      { type: "none", avgEngagement: 0 }
                    ).type
                  }
                </span>
              </span>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="content" className="space-y-6">
        {/* Content Type Performance */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            Content Type Performance
          </h4>
          {Object.entries(contentTypeStats).map(([type, stats]) => (
            <div
              key={type}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium text-gray-900 capitalize">
                    {type}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {stats.count} post{stats.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <Badge variant="outline">
                  {(stats.totalEngagement / stats.count).toFixed(1)}% avg
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Impressions:</span>
                  <span className="ml-2 font-medium">
                    {formatNumber(stats.totalImpressions)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Engagement:</span>
                  <span className="ml-2 font-medium">
                    {stats.totalEngagement.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
