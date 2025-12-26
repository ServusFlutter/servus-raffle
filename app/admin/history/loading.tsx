import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for the history page
 * Displayed while the page is loading via Next.js Suspense
 */
export default function HistoryLoading() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-9 w-48" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-4 mt-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
