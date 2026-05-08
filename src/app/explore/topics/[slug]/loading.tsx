export default function TopicLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="h-4 w-40 bg-muted animate-pulse rounded mb-4" />
      <div className="h-9 w-64 bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-20 bg-muted animate-pulse rounded mb-6" />
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-3 flex items-center gap-4">
            <div className="w-10 h-4 bg-muted animate-pulse rounded shrink-0" />
            <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
            <div className="w-12 h-5 bg-muted animate-pulse rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
