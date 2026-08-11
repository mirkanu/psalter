import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero placeholder — matches the bg-muted border-l-4 border-l-primary card */}
      <div className="bg-muted border border-border rounded-lg border-l-4 border-l-primary p-6 mb-8">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-6 w-64 mt-2 mb-1" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-9 w-40 mt-4 rounded-md" />
      </div>

      {/* Two-column grid */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* DailyTodayCard placeholder */}
        <div className="rounded-lg border border-border p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-10 w-32 mt-2 rounded-md" />
        </div>

        {/* PsalmSearchWidget placeholder */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
