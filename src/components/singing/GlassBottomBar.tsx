'use client'
import { Music, AlignLeft, FileImage, Settings, Play, Pause } from 'lucide-react'
import type { ViewMode } from '@/components/notation/NotationRenderer'
import { cn } from '@/lib/utils'

interface Props {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  baseSize: number
  onBaseSizeChange: (size: number) => void
  /** 1-indexed current stanza/cycle page; null when unknown */
  currentStanza: number | null
  /** total stanza/cycle pages; null when unknown */
  totalStanzas: number | null
  isPlaying: boolean
  onPlayToggle: () => void
  onGearOpen: () => void
  /** Hide the Lyrics radio option when the psalm has no lyrics. */
  showLyricsOption: boolean
}

type IconType = typeof Music

const VIEW_OPTIONS: { mode: ViewMode; label: string; Icon: IconType }[] = [
  { mode: 'staff', label: 'Staff', Icon: Music },
  { mode: 'lyrics', label: 'Lyrics', Icon: AlignLeft },
  { mode: 'solfege', label: 'Solfège', Icon: FileImage },
]

/**
 * GlassBottomBar — persistent fixed glass strip at the bottom of the Staff view.
 * Layout (UI-SPEC §2): [A-/A+] · [Stanza N / M] · [Staff/Lyrics/Solfège] · [Gear] · [Play]
 *
 * `currentStanza` / `totalStanzas` are reported up from NotationRenderer via
 * `onStanzaChange` and rendered as live text `Stanza ${currentStanza} / ${totalStanzas}`
 * when both values are non-null AND positive. Otherwise the indicator renders an
 * empty string (preserving layout).
 */
export function GlassBottomBar({
  viewMode,
  onViewModeChange,
  baseSize,
  onBaseSizeChange,
  currentStanza,
  totalStanzas,
  isPlaying,
  onPlayToggle,
  onGearOpen,
  showLyricsOption,
}: Props) {
  return (
    <nav
      data-glass-bottom-bar
      className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-between gap-1 px-2 h-14 md:h-15 bg-background/70 backdrop-blur-md border-t border-border/50 pb-[env(safe-area-inset-bottom)]"
      aria-label="Psalm view controls"
    >
      {/* Left: A-/A+ group */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Decrease size"
          onClick={() => onBaseSizeChange(Math.max(8, baseSize - 1))}
          className="min-h-11 min-w-11 inline-flex items-center justify-center text-base active:scale-[0.90] transition-transform duration-75"
        >
          A−
        </button>
        <button
          type="button"
          aria-label="Increase size"
          onClick={() => onBaseSizeChange(Math.min(40, baseSize + 1))}
          className="min-h-11 min-w-11 inline-flex items-center justify-center text-base active:scale-[0.90] transition-transform duration-75"
        >
          A+
        </button>
      </div>

      {/* Centre: stanzas indicator */}
      <div className="flex-1 text-center">
        <span
          data-stanzas-indicator
          className="text-xs text-muted-foreground tabular-nums"
        >
          {currentStanza != null && totalStanzas != null && currentStanza > 0 && totalStanzas > 0
            ? `Stanza ${currentStanza} / ${totalStanzas}`
            : ''}
        </span>
      </div>

      {/* View radiogroup */}
      <div
        role="radiogroup"
        aria-label="View mode"
        data-tour-target="view-controls"
        className="flex items-center gap-1"
      >
        {VIEW_OPTIONS.filter((o) => o.mode !== 'lyrics' || showLyricsOption).map(({ mode, label, Icon }) => {
          const isActive = viewMode === mode
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={isActive}
              data-view-option={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                'min-h-11 min-w-11 inline-flex flex-col items-center justify-center px-2 active:scale-[0.90] transition-transform duration-75',
                isActive
                  ? 'text-foreground border-b-2 border-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[12px] leading-none mt-0.5">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Gear */}
      <button
        type="button"
        aria-label="Settings"
        data-singing-gear
        onClick={onGearOpen}
        className="min-h-11 min-w-11 inline-flex flex-col items-center justify-center text-muted-foreground active:scale-[0.90] transition-transform duration-75"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Play */}
      <button
        type="button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        data-tour-target="play-button"
        data-singing-play
        onClick={onPlayToggle}
        className="min-h-11 min-w-11 inline-flex flex-col items-center justify-center text-foreground active:scale-[0.90] transition-transform duration-75"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        <span className="text-[12px] leading-none mt-0.5">{isPlaying ? 'Pause' : 'Play'}</span>
      </button>
    </nav>
  )
}
