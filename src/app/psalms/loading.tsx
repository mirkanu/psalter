import { Skeleton } from "@/components/ui/skeleton"

export default function PsalmsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <div className="h-9 w-24 bg-muted animate-pulse rounded mb-1" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded" />
      </div>
      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full rounded-md mb-2" />
      {/* Dense psalm grid skeleton — 72 boxes, no Advanced panel (collapsed) */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mt-4">
        {Array.from({ length: 72 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
