export function CreatePostSkeleton() {
  return (
    <div className="h-[90vh] bg-gray-50 overflow-hidden flex flex-col">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Panel Skeleton */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6 min-h-0">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex-1 min-h-0">
                <div className="h-full bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel Skeleton */}
        <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col border-b">
          <div className="flex-1 px-6 pt-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Form Field Skeletons */}
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
              <div className="pt-4">
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
