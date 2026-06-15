'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PrecentingBarProps {
  setId: number
  pos: number
  total: number
}

export function PrecentingBar({ setId, pos, total }: PrecentingBarProps) {
  return (
    <div className="h-9 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 grid grid-cols-3 items-center px-3">
      <Link
        href={`/precent/${setId}`}
        className="inline-flex items-center gap-0.5 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to Set
      </Link>
      <span className="text-xs font-medium text-amber-800 dark:text-amber-200 tracking-wide text-center">
        Precenting Mode
      </span>
      <span className="text-xs font-medium text-amber-800 dark:text-amber-200 text-right tabular-nums">
        {pos} / {total}
      </span>
    </div>
  )
}
