export default function ExploreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* h1 block */}
      <div className="mb-4">
        <div className="h-9 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-5 w-72 bg-muted animate-pulse rounded" />
      </div>

      {/* Anchor nav skeleton */}
      <div className="h-10 w-full bg-muted animate-pulse rounded mb-8" />

      <div className="mt-8 space-y-0">
        {/* Section 1: When you're feeling */}
        <section>
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </section>

        <div className="my-8 h-px bg-muted" />

        {/* Section 2: By Theme */}
        <section>
          <div className="h-6 w-28 bg-muted animate-pulse rounded mb-4" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2 mt-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
          <div className="h-4 w-16 bg-muted animate-pulse rounded mb-2 mt-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
          <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2 mt-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </section>

        <div className="my-8 h-px bg-muted" />

        {/* Section 3: In the NT */}
        <section>
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-5 w-56 bg-muted animate-pulse rounded mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
          <div className="my-4 h-px bg-muted" />
          <div className="h-5 w-40 bg-muted animate-pulse rounded mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </section>

        <div className="my-8 h-px bg-muted" />

        {/* Section 4: Other Topics */}
        <section>
          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </section>

        <div className="my-8 h-px bg-muted" />

        {/* Section 5: Authors */}
        <section>
          <div className="h-6 w-20 bg-muted animate-pulse rounded mb-4" />
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full" />
            ))}
          </div>
          <div className="rounded-md border border-border overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse border-b border-border last:border-0" />
            ))}
          </div>
        </section>

        <div className="my-8 h-px bg-muted" />

        {/* Section 6: Heidelberg Catechism */}
        <section>
          <div className="h-6 w-52 bg-muted animate-pulse rounded mb-4" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
