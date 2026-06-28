'use client'
import { useEffect, useState, type TransitionEvent } from 'react'
import { ChevronDown, Music, Radio } from 'lucide-react'
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
  /** When provided, an abc/SoundCloud toggle appears. Toggle hidden when null/undefined. */
  soundcloudUrl?: string | null
  /** Used only as the SoundCloud iframe title. Falls back to "recording" when omitted. */
  tuneName?: string
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
 *
 * Desktop (≥768px): floating right-aligned card (UI-SPEC §2).
 * Mobile (<768px): full-width bottom strip (unchanged from 04.9.4).
 *
 * When `soundcloudUrl` is present, an abc/SoundCloud toggle appears. The
 * chosen source persists to localStorage key `psalter-audio-source`.
 */
export function PlayMiniBar({
  abc,
  mounted,
  visible,
  onCollapse,
  isPlaying,
  onPlayingChange,
  soundcloudUrl,
  tuneName,
}: Props) {
  const [hidden, setHidden] = useState(!visible)

  // Audio-source state with two-effect localStorage pattern (per 04.5-04 precedent).
  const hasSc = !!soundcloudUrl && soundcloudUrl.startsWith('http')
  const [audioSource, setAudioSource] = useState<'abc' | 'soundcloud'>('abc')
  const [audioSourceRestored, setAudioSourceRestored] = useState(false)

  useEffect(() => {
    if (visible) setHidden(false)
  }, [visible])

  // Restore audio source from localStorage on mount (once).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('psalter-audio-source')
      if (raw === 'abc' || raw === 'soundcloud') setAudioSource(raw)
    } catch { /* ignore */ }
    setAudioSourceRestored(true)
  }, [])

  // Persist audio source on change (skip pre-restore so we don't clobber storage with default).
  useEffect(() => {
    if (!audioSourceRestored) return
    try {
      window.localStorage.setItem('psalter-audio-source', audioSource)
    } catch { /* ignore */ }
  }, [audioSource, audioSourceRestored])

  // When switching to soundcloud mode, stop the abc synth.
  useEffect(() => {
    if (audioSource === 'soundcloud' && isPlaying) onPlayingChange(false)
  }, [audioSource]) // eslint-disable-line react-hooks/exhaustive-deps

  const showScToggle = hasSc
  const showDisclaimer = showScToggle && audioSource === 'soundcloud'

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
        // BASE (both)
        'fixed z-40 h-[44px] flex items-center gap-1',
        // MOBILE (<768px): unchanged full-width strip
        'inset-x-0 bottom-[44px] px-1.5 border-t border-border/40 bg-background/90 backdrop-blur-sm',
        // DESKTOP (≥768px): floating right card (UI-SPEC §2)
        'md:ml-auto md:max-w-md md:w-auto md:bottom-[56px] md:right-4 md:rounded-lg md:border md:border-border/40 md:shadow-lg md:px-2',
        // TRANSITION (unchanged)
        'transition-all duration-200 ease-out',
        'motion-reduce:translate-y-0 motion-reduce:!transition-opacity motion-reduce:duration-100',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      )}
      style={hidden ? { display: 'none' } : undefined}
    >
      {showScToggle && (
        <button
          type="button"
          onClick={() => setAudioSource((s) => (s === 'abc' ? 'soundcloud' : 'abc'))}
          aria-label={audioSource === 'abc' ? 'Switch to SoundCloud' : 'Switch to abc audio'}
          data-audio-source-toggle
          className={cn(
            "h-9 w-9 inline-flex items-center justify-center rounded-md active:scale-[0.90] transition-[transform,color] duration-75 shrink-0",
            audioSource === 'soundcloud' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {audioSource === 'abc' ? <Music className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
        </button>
      )}
      <button
        type="button"
        aria-label="Collapse player"
        onClick={onCollapse}
        className="h-9 w-8 inline-flex items-center justify-center shrink-0"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0 overflow-x-auto">
        {audioSource === 'abc' ? (
          <AbcAudioControls
            abc={abc}
            isPlaying={isPlaying}
            onPlayingChange={onPlayingChange}
            label="Tune audio controls"
          />
        ) : (
          <>
            <iframe
              title={`SoundCloud: ${tuneName ?? "recording"}`}
              width="100%"
              height="40"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl!)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false`}
              className="rounded-md border border-border shrink-0"
            />
            {showDisclaimer && (
              <span data-audio-disclaimer aria-live="polite" className="ml-2 text-xs italic text-muted-foreground truncate max-w-[160px] shrink-0">
                Lyrics shown are metrical; recording may use a different text.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
