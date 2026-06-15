'use client'

interface PrecentingBarProps {
  pos: number
  total: number
}

export function PrecentingBar({ pos, total }: PrecentingBarProps) {
  return (
    <div className="h-8 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 flex items-center justify-center px-4">
      <span className="text-xs font-medium text-amber-800 dark:text-amber-200 tracking-wide">
        Precenting Mode — {pos} / {total}
      </span>
    </div>
  )
}
