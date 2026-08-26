'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import { Settings, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_SIZE, SIZE_STEP } from '@/components/notation/NotationRenderer'

interface Props {
  /** Current value of the A−/A+ knob. Semantic (font pixels or row count)
   *  is decided by the parent — the bar just renders the buttons. */
  value: number
  /** Called with the new absolute value after A−/A+ press. */
  onValueChange: (newValue: number) => void
  /** Step size for A−/A+ (default SIZE_STEP=2 for font, 1 for row count). */
  step?: number
  /** Minimum value — A− disabled when value ≤ minValue. */
  minValue?: number
  /** Maximum value — A+ disabled when value ≥ maxValue. */
  maxValue?: number
  /** 1-indexed current stanza/cycle page; null when unknown */
  currentStanza: number | null
  /** total stanza/cycle pages; null when unknown */
  totalStanzas: number | null
  /** Stanza prev/next nav — replaces NotationRenderer's removed chromeless stanza nav. */
  onStanzaPrev?: () => void
  onStanzaNext?: () => void
  isPlaying: boolean
  onPlayToggle: () => void
  onGearOpen: () => void
  /** Gear popover slot — when provided, replaces the default Settings button. */
  gear?: ReactNode
  /** Task 3 (04.9.14-01): scroll-hide navigation. When true, slides down and
   *  fades out; scrolling back up restores it. */
  hidden?: boolean
  /** 2026-08-26: hide the A−/A+ buttons entirely. Staff-inline mode doesn't
   *  support zoom — adding rows makes per-row lyrics smaller, not bigger, so
   *  the controls are useless (and visually noisy) in that view. Center
   *  stanza indicator and right-side buttons stay; only the leftmost
   *  A−/A+ block is suppressed. */
  hideZoom?: boolean
}

/**
 * GlassBottomBar — persistent fixed glass strip at the bottom of the Staff view.
 *
 * Layout (post 260517-bmz polish):
 *   [A-/A+] · [< Stanza N/M >] · [Play] · [Gear]
 *
 * View-mode selection (Staff/Lyrics/Solfège) lives exclusively in GearPopover
 * (rendered via the `gear` slot) to keep the bottom bar narrow on mobile (375px).
 */
export function GlassBottomBar({
  value,
  onValueChange,
  step = SIZE_STEP,
  minValue = 8,
  maxValue = MAX_SIZE,
  currentStanza,
  totalStanzas,
  onStanzaPrev,
  onStanzaNext,
  isPlaying,
  onPlayToggle,
  onGearOpen,
  gear,
  hidden = false,
  hideZoom = false,
}: Props) {
  const showStanza =
    currentStanza != null && totalStanzas != null && currentStanza > 0 && totalStanzas > 1
  const canPrev = showStanza && (currentStanza as number) > 1
  const canNext = showStanza && (currentStanza as number) < (totalStanzas as number)

  // Brief grow/shrink pulse on the current-stanza digit whenever it changes
  // (swipe or the prev/next buttons — both funnel through the same
  // `currentStanza` prop) — reinforces that the page actually turned.
  // Skipped on mount / first-known value so there's no pulse on initial load.
  const stanzaNumberRef = useRef<HTMLSpanElement | null>(null)
  const prevStanzaRef = useRef<number | null>(null)
  useEffect(() => {
    const prev = prevStanzaRef.current
    prevStanzaRef.current = currentStanza
    if (prev == null || currentStanza == null || prev === currentStanza) return
    const el = stanzaNumberRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
      { duration: 260, easing: 'ease-out' },
    )
  }, [currentStanza])

  return (
    <nav
      data-glass-bottom-bar
      data-tour-target="bottom-bar"
      data-scroll-hidden={hidden ? '' : undefined}
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 bg-background/70 backdrop-blur-md border-t border-border/50 pb-[max(env(safe-area-inset-bottom)-12px,0px)]',
        'transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none',
        hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100',
      )}
      aria-label="Psalm view controls"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-1 px-2 h-11 md:h-13">
        {/* Left: A−/A+. Always visible in the chromeless SingingView now
           (2026-08-23 Inline Staff A+/A− refactor) — drives the lyric
           MIN/POST_BUMP window in Inline Staff and the --staff-base-size
           CSS var in the other chromeless modes. Kept as a fixed-width
           flex group so the centre stanza indicator stays centred when
           the bar reflows (the original layout reason for keeping this
           block in the DOM regardless of visibility). 2026-08-26: in
           Staff-inline mode (`hideZoom`) the buttons do nothing useful —
           pressing them only subdivides rows, which makes per-row lyrics
           smaller. We keep the block in the DOM at `visibility:hidden`
           so its width still counterbalances the Play+Gear block on the
           right and the Stanza indicator stays centred. `invisible`
           removes children from hit-testing, focus order, and the
           accessibility tree, so the buttons cannot be clicked, focused,
           or announced. */}
        <div className={cn('flex items-center shrink-0', hideZoom && 'invisible')}>
          <button
            type="button"
            aria-label="Decrease size"
            onClick={() => onValueChange(Math.max(minValue, value - step))}
            disabled={value <= minValue}
            className="min-h-10 min-w-10 sm:min-w-11 inline-flex items-center justify-center text-base active:scale-[0.90] transition-transform duration-75 disabled:opacity-40 disabled:pointer-events-none"
          >
            A−
          </button>
          <button
            type="button"
            aria-label="Increase size"
            onClick={() => onValueChange(Math.min(maxValue, value + step))}
            disabled={value >= maxValue}
            className="min-h-10 min-w-10 sm:min-w-11 inline-flex items-center justify-center text-base active:scale-[0.90] transition-transform duration-75 disabled:opacity-40 disabled:pointer-events-none"
          >
            A+
          </button>
        </div>

        {/* Centre: stanzas indicator with prev/next nav (absorbs remaining space) */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          {showStanza && (
            <button
              type="button"
              aria-label="Previous stanza page"
              data-stanza-prev
              onClick={onStanzaPrev}
              disabled={!canPrev}
              className="min-h-10 inline-flex items-center justify-center px-1 text-foreground active:scale-[0.90] transition-transform duration-75 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <span
            data-stanzas-indicator
            className="text-xs text-muted-foreground tabular-nums text-center whitespace-nowrap px-1"
          >
            {showStanza && (
              <>
                Stanza <span ref={stanzaNumberRef} className="inline-block tabular-nums">{currentStanza}</span> / {totalStanzas}
              </>
            )}
          </span>
          {showStanza && (
            <button
              type="button"
              aria-label="Next stanza page"
              data-stanza-next
              onClick={onStanzaNext}
              disabled={!canNext}
              className="min-h-10 inline-flex items-center justify-center px-1 text-foreground active:scale-[0.90] transition-transform duration-75 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Play (icon-only) */}
        <button
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          data-tour-target="play-button"
          data-singing-play
          onClick={onPlayToggle}
          className="min-h-10 min-w-11 inline-flex items-center justify-center text-foreground active:scale-[0.90] transition-transform duration-75 shrink-0"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        {/* Gear — far right (slot or default button) */}
        {gear ?? (
          <button
            type="button"
            aria-label="Settings"
            data-singing-gear
            data-tour-target="view-controls"
            onClick={onGearOpen}
            className="min-h-10 min-w-11 inline-flex items-center justify-center text-muted-foreground active:scale-[0.90] transition-transform duration-75 shrink-0"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>
    </nav>
  )
}
