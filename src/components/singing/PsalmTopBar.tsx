'use client'
import { useEffect, useLayoutEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  prev: string | null
  next: string | null
  currentSlug: string
  psalmId: number
  tuneName?: string | null
  onOpenPsalmSelector: () => void
  onOpenTuneSwitcher?: () => void
}

function isEditableTarget(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

const ICON_BTN =
  'min-h-11 min-w-11 rounded-md inline-flex items-center justify-center active:scale-[0.97] transition-transform motion-reduce:transition-none'
const DISABLED = 'opacity-40 pointer-events-none'

export function PsalmTopBar({
  prev,
  next,
  currentSlug,
  psalmId,
  tuneName,
  onOpenPsalmSelector,
  onOpenTuneSwitcher,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [narrow, setNarrow] = useState(false)
  void currentSlug // accepted for API parity / future deep-link callbacks

  useLayoutEffect(() => {
    const update = () => setNarrow(window.innerWidth < 360)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (isEditableTarget(document.activeElement)) return
      if (e.key === 'ArrowLeft' && prev) {
        startTransition(() => router.push(`/psalms/${prev}`))
      } else if (e.key === 'ArrowRight' && next) {
        startTransition(() => router.push(`/psalms/${next}`))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, router])

  const label = narrow && psalmId >= 100 ? `Ps ${psalmId}` : `Psalm ${psalmId}`

  return (
    <header
      data-singing-topbar
      className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b"
    >
      <div className="relative flex items-center justify-between gap-2 px-2 h-12 md:h-14 landscape:h-10">
        {isPending && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-foreground" aria-hidden />
        )}
        {prev ? (
          <Link
            href={`/psalms/${prev}`}
            rel="prev"
            aria-label="Previous psalm"
            data-tour-target="prev-next"
            onClick={(e) => {
              // Preserve modifier-key / middle-click "open in new tab" behavior.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
              e.preventDefault()
              startTransition(() => router.push(`/psalms/${prev}`))
            }}
            className={ICON_BTN}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            aria-label="Already at Psalm 1"
            data-tour-target="prev-next"
            className={cn(ICON_BTN, DISABLED)}
          >
            <ChevronLeft className="h-5 w-5" />
          </span>
        )}
        <div className="flex-1 flex justify-center items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenPsalmSelector}
            aria-label={`Choose psalm (currently Psalm ${psalmId})`}
            data-tour-target="psalm-label"
            className="text-base font-semibold active:scale-[0.95] transition-transform motion-reduce:transition-none whitespace-nowrap"
          >
            {label}
          </button>
          {onOpenTuneSwitcher ? (
            <button
              type="button"
              onClick={onOpenTuneSwitcher}
              aria-label={tuneName ? `${tuneName} — tap to switch tune` : 'No tune — tap to choose'}
              data-tour-target="tune-name"
              data-singing-tune-slot
              className="flex items-center gap-1 text-sm font-normal text-muted-foreground active:scale-[0.95] transition-transform motion-reduce:transition-none max-w-[40vw] truncate cursor-pointer hover:text-foreground transition-colors"
            >
              <span aria-hidden>♩</span>
              <span className="truncate">{tuneName || '—'}</span>
            </button>
          ) : (
            <span
              data-singing-tune-slot
              className="flex items-center gap-1 text-sm font-normal text-muted-foreground max-w-[40vw] truncate"
            >
              <span aria-hidden>♩</span>
              <span className="truncate">{tuneName || '—'}</span>
            </span>
          )}
        </div>
        {next ? (
          <Link
            href={`/psalms/${next}`}
            rel="next"
            aria-label="Next psalm"
            onClick={(e) => {
              // Preserve modifier-key / middle-click "open in new tab" behavior.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
              e.preventDefault()
              startTransition(() => router.push(`/psalms/${next}`))
            }}
            className={ICON_BTN}
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <span aria-disabled="true" aria-label="Already at Psalm 150" className={cn(ICON_BTN, DISABLED)}>
            <ChevronRight className="h-5 w-5" />
          </span>
        )}
      </div>
    </header>
  )
}
