'use client'
import type { ReactNode } from 'react'
import { Settings, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  baseSize: number
  onBaseSizeChange: (size: number) => void
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
  baseSize,
  onBaseSizeChange,
  currentStanza,
  totalStanzas,
  onStanzaPrev,
  onStanzaNext,
  isPlaying,
  onPlayToggle,
  onGearOpen,
  gear,
  hidden = false,
}: Props) {
  const showStanza =
    currentStanza != null && totalStanzas != null && currentStanza > 0 && totalStanzas > 1
  const canPrev = showStanza && (currentStanza as number) > 1
  const canNext = showStanza && (currentStanza as number) < (totalStanzas as number)
  return (
    <nav
      data-glass-bottom-bar
      data-tour-target="bottom-bar"
      data-scroll-hidden={hidden ? '' : undefined}
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 bg-background/70 backdrop-blur-md border-t border-border/50 pb-[max(env(safe-area-inset-bottom)-12px,0px)]',
        'transition-transform transition-opacity duration-200 ease-out motion-reduce:transition-none',
        hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100',
      )}
      aria-label="Psalm view controls"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-1 px-2 h-11 md:h-13">
        {/* Left: A-/A+ */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            aria-label="Decrease size"
            onClick={() => onBaseSizeChange(Math.max(8, baseSize - 1))}
            className="min-h-10 min-w-10 sm:min-w-11 inline-flex items-center justify-center text-base active:scale-[0.90] transition-transform duration-75"
          >
            A−
          </button>
          <button
            type="button"
            aria-label="Increase size"
            onClick={() => onBaseSizeChange(Math.min(40, baseSize + 1))}
            className="min-h-10 min-w-10 sm:min-w-11 inline-flex items-center justify-center text-base active:scale-[0.90] transition-transform duration-75"
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
            {showStanza ? `Stanza ${currentStanza} / ${totalStanzas}` : ''}
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
