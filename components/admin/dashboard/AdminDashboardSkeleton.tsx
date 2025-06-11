import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-80 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Activity Feed Skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 p-3 border rounded"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-64 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Users Skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-20 mb-1" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
