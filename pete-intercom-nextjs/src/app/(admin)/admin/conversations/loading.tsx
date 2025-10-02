import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6 px-6 pt-6">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-muted animate-pulse rounded" />
          <div className="h-5 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Global Filter Bar Skeleton */}
      <div className="bg-muted/30 border-b p-4 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 h-10 bg-muted animate-pulse rounded" />
            <div className="w-40 h-10 bg-muted animate-pulse rounded" />
            <div className="w-36 h-10 bg-muted animate-pulse rounded" />
            <div className="w-36 h-10 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6">
        {/* KPI Scorecards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-9 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded" />
            </CardHeader>
            <CardContent className="flex justify-center items-center h-64">
              <div className="w-48 h-48 bg-muted rounded-full" />
            </CardContent>
          </Card>

          <Card className="md:col-span-2 animate-pulse">
            <CardHeader>
              <div className="h-6 w-64 bg-muted rounded" />
              <div className="h-4 w-96 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>

        {/* Table Skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-7 w-56 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-24 bg-muted rounded" />
                  <div className="h-10 flex-1 bg-muted rounded" />
                  <div className="h-10 w-32 bg-muted rounded" />
                  <div className="h-10 w-24 bg-muted rounded" />
                  <div className="h-10 w-24 bg-muted rounded" />
                  <div className="h-10 w-24 bg-muted rounded" />
                  <div className="h-10 w-32 bg-muted rounded" />
                  <div className="h-10 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}