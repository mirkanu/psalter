import { Skeleton } from "@/components/ui/skeleton"

export default function TunesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <div className="h-9 w-24 bg-muted animate-pulse rounded mb-3" />
      </div>
      {/* Filter row skeleton — two Selects */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="w-48 h-10" />
        <Skeleton className="w-48 h-10" />
      </div>
      {/* Tune card grid skeleton — 12 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
