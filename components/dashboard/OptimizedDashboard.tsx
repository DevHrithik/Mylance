"use client";

import { Suspense, lazy } from "react";
import { DashboardSkeleton } from "./DashboardSkeleton";
import type { DashboardData } from "@/lib/supabase/server-queries";

// Lazy load heavy components
const LazyContentCalendar = lazy(() =>
  import("./ContentCalendar").then((m) => ({ default: m.ContentCalendar }))
);
const LazyAILearningProgress = lazy(() => import("./AILearningProgress"));

interface OptimizedDashboardProps {
  initialData: DashboardData;
  userId: string;
}

export function OptimizedDashboard({
  initialData,
  userId,
}: OptimizedDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Critical stats - load immediately */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats cards - lightweight so load immediately */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900">
            {initialData.stats.completedPosts}
          </h3>
          <p className="text-sm text-gray-600">Completed Posts</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900">
            {initialData.stats.availablePrompts}
          </h3>
          <p className="text-sm text-gray-600">Available Prompts</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900">
            {initialData.stats.completionRate}%
          </h3>
          <p className="text-sm text-gray-600">Completion Rate</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900">1</h3>
          <p className="text-sm text-gray-600">Day Streak</p>
        </div>
      </div>

      {/* Calendar - lazy loaded */}
      <Suspense
        fallback={
          <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
        }
      >
        <LazyContentCalendar calendarData={{}} />
      </Suspense>

      {/* AI Learning Progress - lazy loaded */}
      <Suspense
        fallback={
          <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
        }
      >
        <LazyAILearningProgress />
      </Suspense>
    </div>
  );
}
