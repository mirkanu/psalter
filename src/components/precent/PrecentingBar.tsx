'use client'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PrecentingBarProps {
  setId: number
  pos: number    // 1-based current position
  total: number
}

export function PrecentingBar({ setId, pos, total }: PrecentingBarProps) {
  const prevHref = `/precent/${setId}/sing/${pos - 1}`
  const nextHref = `/precent/${setId}/sing/${pos + 1}`

  return (
    <div className="h-10 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 flex items-center justify-between px-4">
      {/* Left arrow — invisible on pos=1 to preserve layout width */}
      <Link
        href={prevHref}
        aria-label="Previous psalm"
        className={`p-2.5 text-amber-700 dark:text-amber-300 active:scale-[0.97] transition-transform duration-75 ${pos === 1 ? 'invisible pointer-events-none' : ''}`}
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-amber-700 dark:text-amber-300 uppercase tracking-wide">
          Precenting Mode
        </span>
        <span className="text-sm font-semibold tabular-nums text-amber-900 dark:text-amber-200">
          {pos} / {total}
        </span>
      </div>

      {/* Right arrow — invisible on last position */}
      <Link
        href={nextHref}
        aria-label="Next psalm"
        className={`p-2.5 text-amber-700 dark:text-amber-300 active:scale-[0.97] transition-transform duration-75 ${pos === total ? 'invisible pointer-events-none' : ''}`}
      >
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  )
}
