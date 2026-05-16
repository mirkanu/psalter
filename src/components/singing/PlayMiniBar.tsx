'use client'
import { useEffect, useState, type TransitionEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { AbcAudioControls } from './AbcAudioControls'
import { cn } from '@/lib/utils'

interface Props {
  abc: string
  /** Controlled mount — sticky once true (parent never resets to false). */
  mounted: boolean
  /** Drives translate/opacity classes. */
  visible: boolean
  /** Collapses the mini-bar without stopping playback. */
  onCollapse: () => void
  isPlaying: boolean
  onPlayingChange: (playing: boolean) => void
}

/**
 * PlayMiniBar — sliding glass mini-bar wrapping `AbcAudioControls` (UI-SPEC §C).
 *
 * Two-phase mount:
 *   - `mounted` controls DOM presence (sticky once true; never goes back to false)
 *   - `visible` drives translate/opacity classes
 *
 * On exit, after the transform/opacity transition ends we set an internal
 * `hidden` flag → `display:none` so focus can't land on offscreen controls.
 */
export function PlayMiniBar({
  abc,
  mounted,
  visible,
  onCollapse,
  isPlaying,
  onPlayingChange,
}: Props) {
  const [hidden, setHidden] = useState(!visible)

  useEffect(() => {
    if (visible) setHidden(false)
  }, [visible])

  const handleEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return
    if (!visible) setHidden(true)
  }

  if (!mounted) return null

  return (
    <div
      data-play-mini-bar
      aria-hidden={!visible}
      onTransitionEnd={handleEnd}
      className={cn(
        'fixed inset-x-0 bottom-[56px] md:bottom-[60px] z-40 h-[52px] flex items-center gap-2 px-3',
        'bg-background/90 backdrop-blur-sm border-t border-border/40',
        'transition-all duration-200 ease-out',
        'motion-reduce:translate-y-0 motion-reduce:!transition-opacity motion-reduce:duration-100',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      )}
      style={hidden ? { display: 'none' } : undefined}
    >
      <button
        type="button"
        aria-label="Collapse player"
        onClick={onCollapse}
        className="min-h-11 min-w-11 inline-flex items-center justify-center"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0 overflow-x-auto">
        <AbcAudioControls
          abc={abc}
          isPlaying={isPlaying}
          onPlayingChange={onPlayingChange}
          label="Tune audio controls"
        />
      </div>
    </div>
  )
}
