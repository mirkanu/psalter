import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <div className="h-9 w-24 bg-muted animate-pulse rounded mb-2" />
        <div className="h-5 w-80 bg-muted animate-pulse rounded mb-6" />
      </div>
      {/* Search form skeleton */}
      <div className="flex gap-2 mb-8">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="w-24 h-10" />
      </div>
      {/* 5 result row skeletons */}
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-4 flex items-start gap-4">
            <Skeleton className="w-10 h-4 shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-12 h-5 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
