import { Skeleton } from '@/components/ui/skeleton'

export default function TuneDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <Skeleton className="h-9 w-1/2 mb-2" />
      <Skeleton className="h-5 w-20 mb-6" />
      <Skeleton className="h-48 w-full rounded-md mb-6" />
      <Skeleton className="h-5 w-32 mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}
