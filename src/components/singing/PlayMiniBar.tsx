'use client'

import { useEffect, useState, type TransitionEvent } from 'react'
import { ChevronDown, Music, Film } from 'lucide-react'
import { AbcAudioControls } from './AbcAudioControls'
import { cn } from '@/lib/utils'

interface Props {
  abc: string
  mounted: boolean
  visible: boolean
  onCollapse: () => void
  isPlaying: boolean
  onPlayingChange: (playing: boolean) => void
  soundcloudUrl?: string | null
  tuneName?: string
  /** 'fixed' = floating viewport bar (tune page); 'inline' = inside max-w-4xl container (psalm page). */
  variant?: 'fixed' | 'inline'
}

export function PlayMiniBar({
  abc,
  mounted,
  visible,
  onCollapse,
  isPlaying,
  onPlayingChange,
  soundcloudUrl,
  tuneName,
  variant = 'fixed',
}: Props) {
  const [hidden, setHidden] = useState(!visible)

  const hasSc = !!soundcloudUrl && soundcloudUrl.startsWith('http')
  const [audioSource, setAudioSource] = useState<'abc' | 'soundcloud'>('abc')
  const [audioSourceRestored, setAudioSourceRestored] = useState(false)
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (visible) setHidden(false)
  }, [visible])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('psalter-audio-source')
      if (raw === 'abc' || raw === 'soundcloud') setAudioSource(raw)
    } catch { /* ignore */ }
    setAudioSourceRestored(true)
  }, [])

  useEffect(() => {
    if (!audioSourceRestored) return
    try {
      window.localStorage.setItem('psalter-audio-source', audioSource)
    } catch { /* ignore */ }
  }, [audioSource, audioSourceRestored])

  useEffect(() => {
    if (audioSource === 'soundcloud' && isPlaying) onPlayingChange(false)
  }, [audioSource]) // eslint-disable-line react-hooks/exhaustive-deps

  // One-time tour: show on first player mount
  useEffect(() => {
    if (!hasSc) return
    try {
      if (!window.localStorage.getItem('psalter-player-toured')) {
        setShowTour(true)
      }
    } catch { /* ignore */ }
  }, [hasSc])

  const dismissTour = () => {
    setShowTour(false)
    try { window.localStorage.setItem('psalter-player-toured', '1') } catch { /* ignore */ }
  }

  const showScToggle = hasSc
  const showDisclaimer = showScToggle && audioSource === 'soundcloud'
  const isScMode = audioSource === 'soundcloud'
  const barHeight = isScMode ? 'h-[80px]' : 'h-[44px]'

  const handleEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return
    if (!visible) setHidden(true)
  }

  if (!mounted) return null

  const isFixed = variant === 'fixed'

  return (
    <div
      data-play-mini-bar
      aria-hidden={!visible}
      onTransitionEnd={handleEnd}
      className={cn(
        'z-40 flex items-center gap-1',
        barHeight,
        isFixed && 'fixed',
        isFixed && 'inset-x-0 bottom-[44px] px-1.5 border-t border-border/40 bg-background/90 backdrop-blur-sm',
        isFixed && 'md:ml-auto md:max-w-md md:w-auto md:bottom-[56px] md:right-4 md:rounded-lg md:border md:border-border/40 md:shadow-lg md:px-2',
        !isFixed && 'ml-auto rounded-lg border border-border/40 shadow-lg px-2 bg-background/90 backdrop-blur-sm max-w-full',
        'transition-all duration-200 ease-out',
        'motion-reduce:translate-y-0 motion-reduce:!transition-opacity motion-reduce:duration-100',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      )}
      style={hidden ? { display: 'none' } : undefined}
    >
      {/* B(d): Collapse button is left-most */}
      <button
        type="button"
        aria-label="Collapse player"
        onClick={onCollapse}
        className="h-9 w-8 inline-flex items-center justify-center shrink-0"
      >
        <ChevronDown className="h-5 w-5" />
      </button>

      {/* B(e): abc/SoundCloud toggle — Film icon for SC, Music for abc */}
      {showScToggle && (
        <div className="relative">
          <button
            type="button"
            onClick={() => { setAudioSource((s) => (s === 'abc' ? 'soundcloud' : 'abc')); dismissTour() }}
            aria-label={audioSource === 'abc' ? 'Switch to recording' : 'Switch to digital audio'}
            data-audio-source-toggle
            className={cn(
              "h-9 w-9 inline-flex items-center justify-center rounded-md active:scale-[0.90] transition-[transform,color] duration-75 shrink-0",
              isScMode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isScMode ? <Music className="h-4 w-4" /> : <Film className="h-4 w-4" />}
          </button>
          {/* B(f): One-time tour */}
          {showScToggle && showTour && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
              <div className="bg-popover text-popover-foreground rounded-lg px-3 py-2 text-xs shadow-lg border whitespace-nowrap">
                <p className="font-medium">Switch to full recording with singing</p>
                <button
                  onClick={dismissTour}
                  className="mt-1 text-muted-foreground hover:text-foreground underline"
                >
                  Got it
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="w-2 h-2 bg-popover border-r border-b rotate-45 -translate-y-1" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
            {/* B(c): iframe height fits in 80px bar */}
            <iframe
              title={`SoundCloud: ${tuneName ?? "recording"}`}
              width="100%"
              height="56"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl!)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false`}
              className="rounded-md border border-border shrink-0"
            />
            {/* B(b): Updated disclaimer text */}
            {showDisclaimer && (
              <span data-audio-disclaimer aria-live="polite" className="ml-2 text-xs italic text-muted-foreground truncate max-w-[200px] shrink-0">
                Lyrics in recording may not match current psalm
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
