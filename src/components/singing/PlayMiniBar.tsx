'use client'

import { useEffect, useRef, useState, type TransitionEvent } from 'react'
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
  /** Plan 04.9.14-03 (Task 4): reports the bar's rendered height (0 when
   *  effectively hidden) so callers can reserve matching bottom padding in
   *  the scrollable content area — avoids a hardcoded height guess that
   *  would be wrong in SoundCloud mode (h-[80px] vs h-[44px]). */
  onHeightChange?: (heightPx: number) => void
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
  onHeightChange,
}: Props) {
  const [hidden, setHidden] = useState(!visible)
  const rootRef = useRef<HTMLDivElement | null>(null)

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

  // Quick task 260713-a5b: on a FRESH mount into SoundCloud mode, the
  // <iframe> element is newly created concurrently with the AbcAudioControls
  // subtree unmounting AND the bar's 44px->80px `duration-200` layout
  // transition. Diagnostic evidence (260713-a5b diagnostic.js, run against
  // the real app via the Playwright daemon) directly caught the fresh
  // iframe being inserted while the bar's own rectHeight was still
  // mid-transition (e.g. 64.78px, climbing toward 80px), which is the exact
  // race that can abort the widget's api-widget.soundcloud.com/me bootstrap
  // fetch and leave the static Download/privacy-policy fallback rendered
  // instead of the interactive player. On a later tune switch (isScMode
  // already true) the SAME iframe element persists and only its `src`
  // changes — that path is unaffected and already worked before this fix.
  // Deferring the iframe's FIRST mount until after the bar's transition has
  // had time to settle removes this race: `scIframeReady` gates only the
  // very first insertion of the iframe into SC mode, not any later src swap.
  const [scIframeReady, setScIframeReady] = useState(false)

  useEffect(() => {
    if (!isScMode) {
      // Reset so a future re-entry into SC mode defers again.
      setScIframeReady(false)
      return
    }
    let rafId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    // Double rAF lets the browser commit + paint the 44px->80px layout
    // transition's starting frame; the trailing timeout (220ms, just past
    // the 200ms `duration-200` transition) ensures the bar has visually
    // settled at its final 80px size before the iframe is ever inserted.
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => setScIframeReady(true), 220)
      })
    })
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
  }, [isScMode])

  // Plan 04.9.14-03 (Task 4): report actual rendered height to the caller so
  // the scrollable content area can reserve exactly enough bottom padding
  // (handles both the compact h-[44px] and SoundCloud h-[80px] profiles).
  // Reports 0 when the bar is not mounted/visible so callers don't reserve
  // space for a collapsed/auto-hidden bar.
  useEffect(() => {
    if (!onHeightChange) return
    if (!mounted || hidden) {
      onHeightChange(0)
      return
    }
    const el = rootRef.current
    if (!el) return
    const report = () => onHeightChange(visible ? el.offsetHeight : 0)
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, hidden, visible, isScMode])

  const handleEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return
    if (!visible) setHidden(true)
  }

  if (!mounted) return null

  const isFixed = variant === 'fixed'
  const isInline = variant === 'inline'

  return (
    <div
      ref={rootRef}
      data-play-mini-bar
      aria-hidden={!visible}
      onTransitionEnd={handleEnd}
      className={cn(
        'z-40 flex items-center gap-1',
        barHeight,
        isFixed && 'fixed',
        isFixed && 'inset-x-0 bottom-[44px] px-1.5 border-t border-border/40 bg-background/90 backdrop-blur-sm',
        isFixed && 'md:ml-auto md:max-w-md md:w-auto md:bottom-[56px] md:right-4 md:rounded-lg md:border md:border-border/40 md:shadow-lg md:px-2',
        // Plan 04.9.14-03 (Task 2): "inline" variant is used inside SingingView,
        // where it must sit fixed directly ABOVE GlassBottomBar (h-11/h-13 +
        // safe-area padding) rather than flow inline in the document (the old
        // behavior placed it at the true bottom of the page, requiring scroll).
        isInline && 'fixed inset-x-0 px-1.5 border-t border-border/40 bg-background/90 backdrop-blur-md',
        isInline && 'bottom-[calc(2.75rem+max(env(safe-area-inset-bottom)-12px,0px))]',
        isInline && 'md:bottom-[calc(3.25rem+max(env(safe-area-inset-bottom)-12px,0px))]',
        // md:right calc aligns the card's right edge with GlassBottomBar's centered
        // max-w-4xl (56rem) column + its px-2 (0.5rem) — i.e. directly above the Gear
        // button — instead of pinning to the far viewport edge (quick task 260712-lp9,
        // bug b). Scoped to md: ONLY; mobile keeps the unprefixed `inset-x-0` full-width
        // layout above, which must not regress.
        isInline && 'md:inset-x-auto md:right-[calc(max(0px,(100vw_-_56rem)/2)_+_0.5rem)] md:max-w-md md:w-auto md:rounded-lg md:border md:border-border/40 md:shadow-lg md:px-2',
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
        ) : scIframeReady ? (
          <>
            {/* B(c): iframe height fits in 80px bar */}
            <iframe
              title={`SoundCloud: ${tuneName ?? "recording"}`}
              width="100%"
              height="56"
              allow="autoplay"
              // SoundCloud's embed widget accesses localStorage during init; without
              // allow-same-origin the frame is an opaque origin, that access throws
              // SecurityError, and the widget renders an empty shell with NO play button
              // (verified live via the Playwright daemon, quick task 260712-lp9 — reverses
              // the WR-03 review fix, which was based on an incorrect "no storage needed"
              // assumption). This is a KNOWING, low-risk exception: w.soundcloud.com is
              // CROSS-ORIGIN to us, so allow-same-origin grants the frame its own (SC's)
              // origin — NOT access to our DOM/cookies — and the classic sandbox-escape
              // concern (allow-scripts + allow-same-origin lets a frame drop its own
              // sandbox / script the parent) applies to SAME-origin embeds, not this one.
              // `src` is built from soundcloudUrl (admin/precentor-editable DB field, not
              // raw public input) and URL-encoded. See 260712-lp9-PLAN.md for the register.
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
        ) : (
          // Quick task 260713-a5b: placeholder occupies the same flex-1 slot
          // while the bar's SC-mode 80px layout settles, so the iframe never
          // mounts into a still-animating container (see scIframeReady effect
          // above). Keeps ResizeObserver-reported height correct immediately.
          <span
            data-sc-iframe-loading
            className="text-xs italic text-muted-foreground truncate"
          >
            Loading recording...
          </span>
        )}
      </div>
    </div>
  )
}
