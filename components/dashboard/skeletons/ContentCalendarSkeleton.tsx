import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ContentCalendarSkeleton() {
  return (
    <div className="w-full space-y-6">
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-32" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-3 gap-6 h-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-4">
                {/* Day Header */}
                <div className="text-center py-4 bg-gray-50 rounded border">
                  <Skeleton className="h-5 w-20 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>

                {/* Prompts Skeleton */}
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <Card
                      key={j}
                      className="border-dashed border-2 border-gray-200"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center space-x-2 pt-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
