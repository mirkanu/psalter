'use client'

import Link from "@/components/Link"
import { ChevronLeft } from 'lucide-react'

interface PrecentingBarProps {
  setId: number
  pos: number
  total: number
}

export function PrecentingBar({ setId, pos, total }: PrecentingBarProps) {
  return (
    <div className="h-9 bg-green-100 dark:bg-green-900/30 border-b border-green-200 dark:border-green-700 grid grid-cols-3 items-center px-3">
      <Link
        href={`/precent/${setId}`}
        className="inline-flex items-center gap-0.5 text-xs text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors active:bg-muted active:translate-y-px transition-all duration-75"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to Set
      </Link>
      <span className="text-xs font-medium text-green-800 dark:text-green-200 tracking-wide text-center">
        Precenting Mode
      </span>
      <span className="text-xs font-medium text-green-800 dark:text-green-200 text-right tabular-nums">
        {pos} / {total}
      </span>
    </div>
  )
}
