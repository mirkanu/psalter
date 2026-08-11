/**
 * Skeleton for the /daily route.
 *
 * Note: /search has NO loading.tsx by design — search is implemented as a
 * Dialog mounted globally in <SiteHeader>, not as a route. Its in-flight
 * state ("Searching…") and empty state ("No results found") live inside
 * <GlobalSearch /> (src/components/GlobalSearch.tsx). See UI-SPEC §3.
 */
export default function DailyLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* H1 block */}
      <div className="mb-4">
        <div className="h-9 w-48 bg-muted animate-pulse rounded mb-1" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded" />
      </div>

      {/* Today card */}
      <div className="h-40 w-full rounded-lg bg-muted animate-pulse mb-4" />

      {/* Day list — 30 rows */}
      <div className="space-y-1">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  )
}
