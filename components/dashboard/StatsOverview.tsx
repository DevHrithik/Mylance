"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Lightbulb, Target, Calendar } from "lucide-react";
import { DashboardStats } from "@/hooks/useDashboardData";

interface StatsOverviewProps {
  stats: DashboardStats;
  className?: string;
}

interface StatItem {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}

export function StatsOverview({ stats, className }: StatsOverviewProps) {
  const statItems: StatItem[] = [
    {
      title: "Completed Posts",
      value: stats.completedPosts.toString(),
      color: "text-[#537FFF]",
      icon: FileText,
      tooltip: "Posts you've created and published",
    },
    {
      title: "Available Prompts",
      value: stats.availablePrompts.toString(),
      color: "text-[#F8CC46]",
      icon: Lightbulb,
      tooltip: "Ready-to-use content prompts in your calendar",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      color: "text-[#537FFF]",
      icon: Target,
      tooltip: "Percentage of scheduled prompts you've completed",
    },
    {
      title: "Day Streak",
      value: stats.dayStreak.toString(),
      color: "text-[#F8CC46]",
      icon: Calendar,
      tooltip: "Consecutive days with content activity",
    },
  ];

  return (
    <TooltipProvider>
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${className}`}
      >
        {statItems.map((stat) => (
          <Tooltip key={stat.title}>
            <TooltipTrigger asChild>
              <Card className="border-0 shadow-sm cursor-help hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs font-medium text-gray-600">
                        {stat.title}
                      </div>
                    </div>
                    <stat.icon
                      className={`h-6 w-6 ${
                        stat.color === "text-[#537FFF]"
                          ? "text-[#537FFF]/30"
                          : "text-[#F8CC46]/30"
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stat.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
