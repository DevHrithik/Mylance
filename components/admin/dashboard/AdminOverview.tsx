"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalPosts: number;
  activeUsers: number;
  newUsersThisWeek: number;
  promptsThisWeek: number;
  promptUsageRate: number;
}

interface WeeklyActivityData {
  name: string;
  posts: number;
  prompts: number;
}

interface SubscriptionBreakdown {
  name: string;
  value: number;
  color: string;
}

interface AdminOverviewProps {
  stats: AdminStats;
  weeklyActivity?: WeeklyActivityData[];
  subscriptionBreakdown?: SubscriptionBreakdown[];
  chartType?:
    | "userGrowth"
    | "subscription"
    | "weeklyActivity"
    | "keyMetrics"
    | "platformHealth"
    | "all";
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AdminOverview({
  stats,
  weeklyActivity,
  subscriptionBreakdown,
  chartType = "all",
}: AdminOverviewProps) {
  // Mock data for charts - in real implementation, this would come from database
  const userGrowthData = [
    { name: "Jan", users: Math.max(0, stats.totalUsers - 60) },
    { name: "Feb", users: Math.max(0, stats.totalUsers - 50) },
    { name: "Mar", users: Math.max(0, stats.totalUsers - 40) },
    { name: "Apr", users: Math.max(0, stats.totalUsers - 30) },
    { name: "May", users: Math.max(0, stats.totalUsers - 20) },
    { name: "Jun", users: Math.max(0, stats.totalUsers - 10) },
    { name: "Jul", users: stats.totalUsers },
  ];

  // Use real subscription data if provided, otherwise fall back to mock calculations
  const subscriptionData = subscriptionBreakdown || [
    {
      name: "Free",
      value: Math.max(1, stats.totalUsers - stats.activeSubscriptions),
      color: COLORS[0],
    },
    {
      name: "Monthly",
      value: stats.activeSubscriptions,
      color: COLORS[1],
    },
  ];

  // Use real weekly activity data if provided, otherwise fall back to mock calculations
  const activityData = weeklyActivity || [
    {
      name: "Mon",
      posts: Math.floor(stats.totalPosts * 0.1),
      prompts: Math.floor(stats.promptsThisWeek * 0.15),
    },
    {
      name: "Tue",
      posts: Math.floor(stats.totalPosts * 0.12),
      prompts: Math.floor(stats.promptsThisWeek * 0.12),
    },
    {
      name: "Wed",
      posts: Math.floor(stats.totalPosts * 0.15),
      prompts: Math.floor(stats.promptsThisWeek * 0.18),
    },
    {
      name: "Thu",
      posts: Math.floor(stats.totalPosts * 0.18),
      prompts: Math.floor(stats.promptsThisWeek * 0.2),
    },
    {
      name: "Fri",
      posts: Math.floor(stats.totalPosts * 0.14),
      prompts: Math.floor(stats.promptsThisWeek * 0.16),
    },
    {
      name: "Sat",
      posts: Math.floor(stats.totalPosts * 0.08),
      prompts: Math.floor(stats.promptsThisWeek * 0.1),
    },
    {
      name: "Sun",
      posts: Math.floor(stats.totalPosts * 0.06),
      prompts: Math.floor(stats.promptsThisWeek * 0.09),
    },
  ];

  // User Growth Chart Component
  const UserGrowthChart = () => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 h-[520px]">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
        User Growth Over Time
      </h3>
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="url(#blueGradient)"
              strokeWidth={3}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: "#3B82F6", strokeWidth: 2 }}
            />
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Subscription Chart Component
  const SubscriptionChart = () => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 h-[500px]">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-3"></div>
        Subscription Plans
      </h3>
      <div className="h-[400px] flex items-center">
        {/* Pie Chart on the Left */}
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {subscriptionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend on the Right */}
        <div className="w-1/2 h-full flex flex-col justify-center pl-6 space-y-4">
          {subscriptionData.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {entry.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  {entry.value > 0
                    ? `${(
                        (entry.value /
                          subscriptionData.reduce(
                            (sum, item) => sum + item.value,
                            0
                          )) *
                        100
                      ).toFixed(0)}%`
                    : "0%"}
                </div>
                <div className="text-xs text-gray-500">{entry.value} users</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Weekly Activity Chart Component
  const WeeklyActivityChart = () => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 h-[500px]">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3"></div>
        Weekly Activity
      </h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar
              dataKey="posts"
              fill="#8B5CF6"
              name="Posts Created"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="prompts"
              fill="#10B981"
              name="Prompts Generated"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Key Metrics Component
  const KeyMetricsCard = () => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 h-[400px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className="w-1 h-5 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full mr-3"></div>
        Key Metrics
      </h3>
      <div className="flex-1 space-y-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {stats.promptUsageRate}%
          </div>
          <div className="text-sm text-blue-700 font-medium">
            Prompt Usage Rate
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {stats.promptUsageRate >= 70
              ? "🚀 Excellent"
              : stats.promptUsageRate >= 50
              ? "✅ Good"
              : "⚠️ Needs Improvement"}
          </div>
        </div>

        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats.totalUsers > 0
              ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
              : 0}
            %
          </div>
          <div className="text-sm text-green-700 font-medium">
            User Activity Rate
          </div>
          <div className="text-xs text-green-600 mt-1">Last 7 days</div>
        </div>
      </div>
    </div>
  );

  // Platform Health Component
  const PlatformHealthCard = () => (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 h-[400px]">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full mr-3"></div>
        Platform Health
      </h3>
      <div className="space-y-6">
        <div className="text-center p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {stats.totalUsers > 0
              ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)
              : 0}
            %
          </div>
          <div className="text-sm font-semibold text-gray-700 mt-2">
            Conversion Rate
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Free to paid subscriptions
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {stats.newUsersThisWeek}
            </div>
            <div className="text-xs text-green-700">New Users</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {stats.promptsThisWeek}
            </div>
            <div className="text-xs text-purple-700">Prompts</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render based on chartType
  switch (chartType) {
    case "userGrowth":
      return <UserGrowthChart />;
    case "subscription":
      return <SubscriptionChart />;
    case "weeklyActivity":
      return <WeeklyActivityChart />;
    case "keyMetrics":
      return <KeyMetricsCard />;
    case "platformHealth":
      return <PlatformHealthCard />;
    case "all":
    default:
      // New improved layout
      return (
        <div className="space-y-8">
          <UserGrowthChart />
          {/* First row: Weekly Activity and Subscription Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WeeklyActivityChart />
            <SubscriptionChart />
          </div>
          {/* Second row: Platform Health and Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PlatformHealthCard />
            <KeyMetricsCard />
          </div>
        </div>
      );
  }
}
