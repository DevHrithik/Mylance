export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="flex space-x-3">
          <div className="h-9 bg-gray-200 rounded w-20"></div>
          <div className="h-9 bg-gray-200 rounded w-36"></div>
        </div>
      </div>

      {/* Stats overview skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border-0 shadow-sm bg-white rounded-lg">
            <div className="p-4">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar legend skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="flex space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>

      {/* AI Learning Progress skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}
