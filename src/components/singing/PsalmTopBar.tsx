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
  /** Verse range for individual Psalm 119 (etc) versifications, e.g. "45-85". When
   *  set, the label becomes "Ps {id}:{range}" (260517-cm0 #3). */
  versePartLabel?: string | null
  tuneName?: string | null
  onOpenPsalmSelector: () => void
  onOpenTuneSwitcher?: () => void
  /** When in precenting mode, override the left arrow href. Null = disabled. */
  precentingPrevHref?: string | null
  /** When in precenting mode, override the right arrow href. Null = disabled. */
  precentingNextHref?: string | null
  /** Precenting mode: verse range from the set item (e.g. "1-6"), shown between psalm label and tune. */
  precentingVerseRange?: string | null
  /** For multi-version psalms (a/b), all versions with slugs and current marker. */
  versionSiblings?: { slug: string; displayLabel: string; isCurrent: boolean }[]
  /** Task 3 (04.9.14-01): scroll-hide navigation. When true, the bar slides
   *  up and fades out; scrolling back up restores it. Purely visual — the
   *  bar stays mounted so its sticky positioning/measurements don't reset. */
  hidden?: boolean
}

function isEditableTarget(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

const ICON_BTN =
  'min-h-11 min-w-11 rounded-md inline-flex items-center justify-center active:bg-muted active:scale-[0.98] transition-transform duration-75 motion-reduce:transition-none'
const DISABLED = 'opacity-40 pointer-events-none'

export function PsalmTopBar({
  prev,
  next,
  currentSlug,
  psalmId,
  versePartLabel,
  tuneName,
  onOpenPsalmSelector,
  onOpenTuneSwitcher,
  precentingPrevHref,
  precentingNextHref,
  precentingVerseRange,
  versionSiblings,
  hidden = false,
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
      if (e.key === 'ArrowLeft') {
        const href = precentingPrevHref !== undefined ? precentingPrevHref : (prev ? `/psalms/${prev}` : null)
        if (href) startTransition(() => router.push(href))
      } else if (e.key === 'ArrowRight') {
        const href = precentingNextHref !== undefined ? precentingNextHref : (next ? `/psalms/${next}` : null)
        if (href) startTransition(() => router.push(href))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, precentingPrevHref, precentingNextHref, router])

  // 260517-cm0 #3: when versePartLabel is provided, the title becomes "Ps {id}:{range}".
  // Long ranges (e.g. "Ps 119:105-123") downsize to text-sm to avoid wrapping.
  const currentVersion = versionSiblings?.find((v) => v.isCurrent)
  const versionSuffix = currentVersion ? currentVersion.displayLabel.replace(String(psalmId), '') : ''
  const label = versePartLabel
    ? `Ps ${psalmId}:${versePartLabel}`
    : narrow && psalmId >= 100
      ? `Ps ${psalmId}${versionSuffix}`
      : `Psalm ${psalmId}${versionSuffix}`
  const labelSizeClass = label.length >= 12 ? 'text-sm' : 'text-base'

  return (
    <header
      data-singing-topbar
      data-tour-target="top-bar"
      data-scroll-hidden={hidden ? '' : undefined}
      className={cn(
        'sticky top-14 z-30 bg-background/95 backdrop-blur border-b',
        'transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none',
        hidden ? '-translate-y-[calc(100%_+_3.5rem)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100',
      )}
    >
      <div className="max-w-4xl mx-auto relative flex items-center justify-between gap-2 px-2 h-12 md:h-14 landscape:h-10">
        {isPending && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-foreground" aria-hidden />
        )}
        {(() => {
          const isPrecenting = precentingPrevHref !== undefined
          const href = isPrecenting ? precentingPrevHref : (prev ? `/psalms/${prev}` : null)
          const amberClass = isPrecenting ? ' text-green-600 dark:text-green-400' : ''
          return href ? (
            <Link
              href={href}
              rel="prev"
              aria-label="Previous psalm"
              data-tour-target="prev-next"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                e.preventDefault()
                startTransition(() => router.push(href))
              }}
              className={ICON_BTN + amberClass}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              aria-label={isPrecenting ? 'First item in set' : 'Already at Psalm 1'}
              data-tour-target="prev-next"
              className={cn(ICON_BTN, DISABLED) + amberClass}
            >
              <ChevronLeft className="h-5 w-5" />
            </span>
          )
        })()}
        <div className="flex-1 flex justify-center items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenPsalmSelector}
            aria-label={`Choose psalm (currently Psalm ${psalmId})`}
            data-tour-target="psalm-label"
            className={cn(
              labelSizeClass,
              'font-semibold active:scale-[0.95] transition-transform motion-reduce:transition-none whitespace-nowrap',
            )}
          >
            {label}
          </button>
          {precentingVerseRange && (
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              vv.&thinsp;{precentingVerseRange}
            </span>
          )}
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
        {(() => {
          const isPrecenting = precentingNextHref !== undefined
          const href = isPrecenting ? precentingNextHref : (next ? `/psalms/${next}` : null)
          const amberClass = isPrecenting ? ' text-green-600 dark:text-green-400' : ''
          return href ? (
            <Link
              href={href}
              rel="next"
              aria-label="Next psalm"
              data-tour-target="prev-next"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                e.preventDefault()
                startTransition(() => router.push(href))
              }}
              className={ICON_BTN + amberClass}
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              aria-label={isPrecenting ? 'Last item in set' : 'Already at Psalm 150'}
              data-tour-target="prev-next"
              className={cn(ICON_BTN, DISABLED) + amberClass}
            >
              <ChevronRight className="h-5 w-5" />
            </span>
          )
        })()}
      </div>
    </header>
  )
}
