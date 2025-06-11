"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/hooks/useDashboardData";

interface CalendarLegendItem {
  label: string;
  count: number;
  type: "completed" | "available" | "none";
}

interface CalendarLegendProps {
  stats: DashboardStats;
  className?: string;
}

export function CalendarLegend({ stats, className }: CalendarLegendProps) {
  const legendData: CalendarLegendItem[] = [
    {
      label: "Completed Posts",
      count: stats.completedPosts,
      type: "completed",
    },
    {
      label: "Available Prompts",
      count: stats.availablePrompts,
      type: "available",
    },
    {
      label: "No Activity",
      count: Math.max(0, 30 - stats.completedPosts - stats.availablePrompts), // Rough estimate for display
      type: "none",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-8 text-base">
          {legendData.map((item) => (
            <div key={item.type} className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-7 w-7 text-sm font-medium">
                {item.type === "completed" && (
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {item.count}
                  </div>
                )}
                {item.type === "available" && (
                  <div className="h-6 w-6 rounded-full border-2 border-cyan-400 flex items-center justify-center text-gray-900">
                    {item.count}
                  </div>
                )}
                {item.type === "none" && (
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-gray-400">
                    {item.count}
                  </div>
                )}
              </div>
              <span className="text-gray-700 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
