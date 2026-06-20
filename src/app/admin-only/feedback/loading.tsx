export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
