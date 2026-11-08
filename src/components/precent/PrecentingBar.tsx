'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PrecentingBarProps {
  setId: number
  pos: number
  total: number
}

export function PrecentingBar({ setId, pos, total }: PrecentingBarProps) {
  const router = useRouter()

  // Self-heal a stale page. Before the Task-2 fix Cloudflare served these
  // pages with `max-age=31536000`, so a browser could hold a year-old copy
  // of the set (counter "3 / 3", no Next arrow) after a psalm was added.
  // The server-rendered `total` is compared against the live item count and
  // the page refreshes itself when they disagree.
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch(`/api/precent/${setId}/items`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { count?: unknown }
        if (cancelled) return
        if (typeof data?.count === 'number' && data.count !== total) {
          router.refresh()
        }
      } catch {
        // Network/auth failure — leave the page exactly as rendered.
      }
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [setId, total, router])

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
