import { Skeleton } from '@/components/ui/skeleton'

export function PsalmDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <Skeleton className="h-4 w-16 mb-2" />
      <Skeleton className="h-9 w-2/3 mb-6" />

      {/* Tab bar — 8 pills on mobile (Tune tab visible), 7 on desktop */}
      {/* Mobile: show 8 skeletons */}
      <div className="flex gap-2 mb-6 flex-wrap md:hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-md" />
        ))}
      </div>
      {/* Desktop: show 7 skeletons (no Tune tab) */}
      <div className="hidden md:flex gap-2 mb-6 flex-wrap">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      {/* Tab content area */}
      <div className="space-y-3 mb-8">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Below-tabs two-column section (D-01 / D-02):
          Left: lyrics + notation player
          Right: SoundCloud (hidden on mobile — per D-03, SoundCloud moves to Tune tab on mobile) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
        {/* Left: lyrics heading + stanza skeletons + score area */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          {/* Score area */}
          <Skeleton className="h-52 w-full rounded-md mt-4" />
          {/* Toggle + nav controls */}
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        {/* Right: SoundCloud — hidden on mobile (D-03) */}
        <div className="hidden md:block">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
