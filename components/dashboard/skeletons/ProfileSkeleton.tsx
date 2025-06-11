import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-80 mb-3" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-8">
          <div className="grid w-full grid-cols-4 lg:w-1/2 bg-white/70 backdrop-blur border shadow-lg rounded-lg p-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>

          {/* Personal Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Photo Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-6">
                <Skeleton className="h-6 w-32 bg-white/20" />
              </div>
              <CardContent className="p-8 text-center space-y-6">
                <div className="relative inline-block">
                  <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40 mx-auto" />
                  <Skeleton className="h-4 w-48 mx-auto" />
                  <Skeleton className="h-6 w-24 mx-auto" />
                </div>
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information Card */}
            <Card className="lg:col-span-2 shadow-xl border-0 bg-white/80 backdrop-blur">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg p-6">
                <Skeleton className="h-6 w-40 bg-white/20" />
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                  <div className="md:col-span-2 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <Card
                key={i}
                className="shadow-xl border-0 bg-white/80 backdrop-blur"
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg p-6">
                  <Skeleton className="h-6 w-32 bg-white/20" />
                </div>
                <CardContent className="p-8 space-y-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Writing Profile Link */}
          <Card className="shadow-xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32 bg-white/20" />
                  <Skeleton className="h-4 w-96 bg-white/20" />
                </div>
                <Skeleton className="h-10 w-40 bg-white/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
