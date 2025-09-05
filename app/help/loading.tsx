import { Card, CardContent } from "../../components/ui/card";

export default function HelpLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="h-8 w-64 mb-2 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="mb-6">
        <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center space-x-3">
                      <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 