import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function SetDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Set header skeleton */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Separator className="my-4" />
      {/* Action bar skeleton */}
      <div className="flex justify-between mb-4">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
      {/* Row skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  )
}
