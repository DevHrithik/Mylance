"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EngagementData {
  date: string;
  engagement: number;
  impressions: number;
}

interface Post {
  id: string;
  engagement_rate: number;
  posted_at?: string;
  impressions?: number;
}

interface EngagementChartProps {
  data: Post[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  // Transform the posts data into engagement data
  const engagementData: EngagementData[] = data
    .filter((post) => post.posted_at && post.engagement_rate)
    .map((post) => ({
      date: post.posted_at!,
      engagement: post.engagement_rate,
      impressions: post.impressions || 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!engagementData || engagementData.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
        <div className="text-center text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No engagement data available</p>
          <p className="text-sm">Start posting to see your engagement trends</p>
        </div>
      </div>
    );
  }

  // Calculate trend
  const firstValue = engagementData[0]?.engagement || 0;
  const lastValue = engagementData[engagementData.length - 1]?.engagement || 0;
  const trend =
    lastValue > firstValue ? "up" : lastValue < firstValue ? "down" : "stable";
  const trendPercentage =
    firstValue !== 0
      ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
      : "0";

  // Find min and max for scaling
  const maxEngagement = Math.max(...engagementData.map((d) => d.engagement));
  const minEngagement = Math.min(...engagementData.map((d) => d.engagement));
  const range = maxEngagement - minEngagement || 1;

  // Create SVG path for the chart
  const width = 100;
  const height = 60;
  const padding = 5;

  const points = engagementData
    .map((point, index) => {
      const x =
        engagementData.length > 1
          ? padding +
            (index / (engagementData.length - 1)) * (width - 2 * padding)
          : width / 2; // Center single point
      const y =
        height -
        padding -
        ((point.engagement - minEngagement) / range) * (height - 2 * padding);

      // Ensure values are valid numbers
      const validX = isNaN(x) ? width / 2 : x;
      const validY = isNaN(y) ? height / 2 : y;

      return `${validX},${validY}`;
    })
    .join(" ");

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
      ? "text-red-600"
      : "text-gray-600";

  return (
    <div className="space-y-4">
      {/* Trend indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Last 30 Days</span>
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          {trendPercentage}%
        </div>
      </div>

      {/* Simple SVG Chart */}
      <div className="h-48 bg-gray-50 rounded-lg p-4 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Chart line */}
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {engagementData.map((point, index) => {
            const x =
              engagementData.length > 1
                ? padding +
                  (index / (engagementData.length - 1)) * (width - 2 * padding)
                : width / 2; // Center single point
            const y =
              height -
              padding -
              ((point.engagement - minEngagement) / range) *
                (height - 2 * padding);

            // Ensure values are valid numbers
            const validX = isNaN(x) ? width / 2 : x;
            const validY = isNaN(y) ? height / 2 : y;

            return (
              <circle
                key={index}
                cx={validX}
                cy={validY}
                r="2"
                fill="#3b82f6"
                className="drop-shadow-sm"
              />
            );
          })}
        </svg>
      </div>

      {/* Chart summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {engagementData.length}
          </p>
          <p className="text-sm text-gray-600">Data Points</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {maxEngagement.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Peak Engagement</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {(
              engagementData.reduce((sum, d) => sum + d.engagement, 0) /
              engagementData.length
            ).toFixed(1)}
            %
          </p>
          <p className="text-sm text-gray-600">Average</p>
        </div>
      </div>

      {/* Recent data points */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Recent Activity
        </h4>
        <div className="space-y-2">
          {engagementData
            .slice(-3)
            .reverse()
            .map((point, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-600">
                  {new Date(point.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium">
                    {point.engagement.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">
                    ({point.impressions.toLocaleString()} views)
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
