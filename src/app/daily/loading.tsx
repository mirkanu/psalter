import { Skeleton } from "@/components/ui/skeleton"

export default function DailyLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-32 w-full rounded-lg mb-4" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
