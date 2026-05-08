export default function ExploreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="h-9 w-32 bg-muted animate-pulse rounded mb-2" />
      <div className="h-5 w-72 bg-muted animate-pulse rounded mb-8" />
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="mb-10">
          <div className="h-6 w-28 bg-muted animate-pulse rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
