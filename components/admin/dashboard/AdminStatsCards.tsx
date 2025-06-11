"use client";

import {
  Users,
  CreditCard,
  FileText,
  TrendingUp,
  Target,
  Activity,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalPosts: number;
  activeUsers: number;
  newUsersThisWeek: number;
  promptsThisWeek: number;
  promptUsageRate: number;
}

interface AdminStatsCardsProps {
  stats: AdminStats;
}

interface StatCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period: string;
  };
  icon: React.ReactNode;
  color: string;
  tooltip: string;
}

export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const statCards: StatCard[] = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="h-7 w-7" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      tooltip: "Total number of registered users on the platform",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: <CreditCard className="h-7 w-7" />,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      tooltip: "Users with active paid subscriptions",
    },
    {
      title: "Total Posts",
      value: stats.totalPosts,
      icon: <FileText className="h-7 w-7" />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      tooltip: "Total content posts created by all users",
    },
    {
      title: "Active Users (7d)",
      value: stats.activeUsers,
      icon: <Activity className="h-7 w-7" />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      tooltip: "Users who have been active in the last 7 days",
    },
    {
      title: "New Users This Week",
      value: stats.newUsersThisWeek,
      change: {
        value: stats.newUsersThisWeek,
        type: "increase",
        period: "this week",
      },
      icon: <TrendingUp className="h-7 w-7" />,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      tooltip: "New user registrations in the current week",
    },
    {
      title: "Prompts Generated",
      value: stats.promptsThisWeek,
      change: {
        value: stats.promptsThisWeek,
        type: "increase",
        period: "this week",
      },
      icon: <Zap className="h-7 w-7" />,
      color: "bg-gradient-to-br from-pink-500 to-pink-600",
      tooltip: "AI-generated content prompts created this week",
    },
    {
      title: "Prompt Usage Rate",
      value: `${stats.promptUsageRate}%`,
      icon: <Target className="h-7 w-7" />,
      color: "bg-gradient-to-br from-teal-500 to-teal-600",
      tooltip: "Percentage of generated prompts that users have used",
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* First Row - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.slice(0, 4).map((card, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-help">
                  <div className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-2">
                          {card.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                          {card.value}
                        </p>
                        {card.change && (
                          <div className="flex items-center text-sm">
                            <span
                              className={`font-semibold ${
                                card.change.type === "increase"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {card.change.type === "increase" ? "+" : ""}
                              {card.change.value}
                            </span>
                            <span className="text-gray-500 ml-1">
                              {card.change.period}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`${card.color} p-4 rounded-xl text-white shadow-lg`}
                      >
                        {card.icon}
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{card.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Second Row - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.slice(4).map((card, index) => (
            <Tooltip key={index + 4}>
              <TooltipTrigger asChild>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-help">
                  <div className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-2">
                          {card.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                          {card.value}
                        </p>
                        {card.change && (
                          <div className="flex items-center text-sm">
                            <span
                              className={`font-semibold ${
                                card.change.type === "increase"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {card.change.type === "increase" ? "+" : ""}
                              {card.change.value}
                            </span>
                            <span className="text-gray-500 ml-1">
                              {card.change.period}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`${card.color} p-4 rounded-xl text-white shadow-lg`}
                      >
                        {card.icon}
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{card.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
