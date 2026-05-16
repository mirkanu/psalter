import { Skeleton } from '@/components/ui/skeleton'

export default function PsalmDetailLoading() {
  return (
    <div className="relative">
      {/* Top bar skeleton */}
      <header className="sticky top-0 z-30 h-12 md:h-14 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between gap-2 px-2 h-full">
          <Skeleton className="h-9 w-11 rounded-md" />
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-9 w-11 rounded-md" />
        </div>
      </header>
      {/* Sub bar skeleton */}
      <div className="sticky top-12 md:top-14 z-20 h-10 md:h-11 bg-muted/60 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-3 h-full">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 flex-1 max-w-[180px] rounded" />
        </div>
      </div>
      {/* Notation body skeleton */}
      <div className="overflow-x-hidden p-4 space-y-3" style={{ height: 'calc(100dvh - 88px)' }}>
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
      {/* FAB skeleton */}
      <div
        className="fixed right-4 z-40 h-14 w-14 rounded-full bg-muted shadow-lg"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      />
    </div>
  )
}
