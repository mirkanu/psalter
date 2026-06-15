import { Skeleton } from '@/components/ui/skeleton'

export default function PrecentSingLoading() {
  return (
    <div className="relative">
      {/* PrecentingBar skeleton — amber tint */}
      <div className="h-10 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-700 animate-pulse" />
      {/* Top bar skeleton — single row */}
      <header className="sticky top-14 z-30 h-12 md:h-14 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between gap-2 px-2 h-full">
          <Skeleton className="h-9 w-11 rounded-md" />
          <div className="flex-1 flex justify-center items-center gap-2">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="h-9 w-11 rounded-md" />
        </div>
      </header>
      {/* Notation body skeleton */}
      <div
        className="overflow-x-hidden p-4 space-y-3"
        style={{ height: 'calc(100dvh - 114px)', paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}
      >
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
      {/* Glass bottom bar skeleton */}
      <div
        data-glass-bottom-bar-skeleton
        className="fixed bottom-0 inset-x-0 z-40 h-14 md:h-15 bg-muted/60 backdrop-blur-md border-t border-border/50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      />
    </div>
  )
}
