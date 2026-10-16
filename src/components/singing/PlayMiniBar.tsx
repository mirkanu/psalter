'use client'

import { useEffect, useRef, useState, type TransitionEvent } from 'react'
import { ChevronDown, Piano, Film } from 'lucide-react'
import { toast } from 'sonner'
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
  /** 'fixed' = floating viewport bar; 'inline' = fixed above GlassBottomBar (psalm page, still fixed);
   *  'flow' = true document-flow placement — sits between page content blocks, scrolls with the page. */
  variant?: 'fixed' | 'inline' | 'flow'
  /** Plan 04.9.14-03 (Task 4): reports the bar's rendered height (0 when
   *  effectively hidden) so callers can reserve matching bottom padding in
   *  the scrollable content area — avoids a hardcoded height guess that
   *  would be wrong in SoundCloud mode (h-[80px] vs h-[44px]). */
  onHeightChange?: (heightPx: number) => void
  /** Phase 21 fqz polish: hide the Piano↔SoundCloud source-switch button.
   *  Only the inline-embedded player in Legacy view sets this — the popup
   *  PlayMiniBar (Music Notes / Lyrics Only) keeps the button so users can
   *  still toggle between MIDI piano and SoundCloud recording there. */
  hideSourceToggle?: boolean
  /** Phase 21 fqz polish: when true, the flow-variant bar drops its full-width
   *  class so the surrounding container can shrink-wrap it to its controls
   *  and center it horizontally. Has no effect in 'fixed' / 'inline' variants. */
  embedded?: boolean
  /** Quick fix (post-fqz): pin the audio source for the lifetime of this
   *  PlayMiniBar instance. Used by Legacy view's embedded MIDI player so
   *  it doesn't pick up the popup player's last selection from
   *  `psalter.audioLastSelected` (the user may have switched the popup to
   *  SoundCloud in Music/Lyrics before opening Legacy). With this set:
   *    - hydrate effect uses `forceSource` directly, skipping the read
   *    - persist effect skips the write (don't pollute shared state)
   *    - the "no-abc + has-sc → soundcloud" re-force (line ~103) is suppressed
   *  Mirrors `hideSourceToggle`'s scope — only Legacy view sets it. */
  forceSource?: 'midi' | 'soundcloud'
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
  hideSourceToggle = false,
  embedded = false,
  forceSource,
}: Props) {
  const [hidden, setHidden] = useState(!visible)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const hasSc = !!soundcloudUrl && soundcloudUrl.startsWith('http')
  // Bug 3 (260717-mwv): audio-only tunes (no ABC at all) must never attempt
  // to render the (broken, because `abc` is empty) ABC audio controls.
  const hasAbc = !!abc && abc.trim().length > 0
  // Phase 20-02 (D-11, Pitfall 1): audioSource value space changed from
  // 'abc' | 'soundcloud' to 'midi' | 'soundcloud'. The 'abc' literal here
  // was confusing (sounded like "ABC notation") and mis-mapped the MIDI
  // playback. The new 'midi' value aligns with the D-10 mirror notice copy
  // ("Piano player not available...") and the localStorage key name
  // `psalter.audioLastSelected`. Existing localStorage entries under the
  // legacy 'psalter-audio-source' key with value 'abc' migrate to 'midi'
  // on hydrate (see below).
  const [audioSource, setAudioSource] = useState<'midi' | 'soundcloud'>(() => (!hasAbc && hasSc ? 'soundcloud' : 'midi'))
  const [audioSourceRestored, setAudioSourceRestored] = useState(false)
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (visible) setHidden(false)
  }, [visible])

  // Phase 20-02 (D-11, Pitfall 1): migration-aware hydrate. Reads the new
  // `psalter.audioLastSelected` key first; falls back to the legacy
  // `psalter-audio-source` key for users who picked a source before this
  // change shipped. Old value 'abc' maps to new value 'midi'; 'soundcloud'
  // is unchanged. Writes the new key + removes the old key in the same
  // effect so the migration is one-shot and idempotent.
  // Quick fix: when `forceSource` is set (Legacy view's embedded MIDI
  // player), skip the localStorage read entirely — the popup player's last
  // selection is irrelevant to this instance, and reading it surfaced
  // SoundCloud in Legacy when the user had switched the popup earlier.
  useEffect(() => {
    if (forceSource) {
      setAudioSource(forceSource)
      setAudioSourceRestored(true)
      return
    }
    try {
      const newRaw = window.localStorage.getItem('psalter.audioLastSelected')
      const oldRaw = window.localStorage.getItem('psalter-audio-source')
      let resolved: 'midi' | 'soundcloud'
      if (newRaw === 'midi' || newRaw === 'soundcloud') {
        resolved = newRaw
      } else if (oldRaw === 'abc' || oldRaw === 'soundcloud') {
        resolved = oldRaw === 'abc' ? 'midi' : 'soundcloud'
        window.localStorage.setItem('psalter.audioLastSelected', resolved)
        window.localStorage.removeItem('psalter-audio-source')
      } else {
        resolved = (!hasAbc && hasSc) ? 'soundcloud' : 'midi'
      }
      setAudioSource(resolved)
    } catch { /* ignore */ }
    setAudioSourceRestored(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Bug 3 (260717-mwv): re-force SoundCloud whenever this instance has no
  // ABC — covers both a stale localStorage restore AND a later tune-switch
  // to an audio-only tune (this component instance persists across tune
  // switches; only its props change). Suppressed when `forceSource` is
  // set so Legacy's MIDI player doesn't flip to SoundCloud if the active
  // tune has no ABC.
  useEffect(() => {
    if (forceSource) return
    if (!hasAbc && hasSc) setAudioSource('soundcloud')
  }, [hasAbc, hasSc, forceSource])

  // Phase 20-02 (D-11): write-only persistence to the NEW key. The old
  // `psalter-audio-source` key is no longer written — migration in the
  // hydrate effect above handles the existing entries. Suppressed when
  // `forceSource` is set so this instance can't pollute the popup's
  // shared localStorage key.
  useEffect(() => {
    if (forceSource) return
    if (!audioSourceRestored) return
    try {
      window.localStorage.setItem('psalter.audioLastSelected', audioSource)
    } catch { /* ignore */ }
  }, [audioSource, audioSourceRestored, forceSource])

  useEffect(() => {
    if (audioSource === 'soundcloud' && isPlaying) onPlayingChange(false)
  }, [audioSource]) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 20-02 (D-10): mirror empty-URL notices verbatim. When the user has
  // picked SoundCloud but the active tune has no SoundCloud URL (or vice
  // versa for MIDI), surface a sonner toast explaining the gap and pointing
  // at the audio-mode toggle. Uses the existing toast-once ref pattern so a
  // repeated open/close of the bar doesn't fire the toast again.
  const mirrorToastShownRef = useRef(false)
  useEffect(() => {
    if (!audioSourceRestored) return
    if (mirrorToastShownRef.current) return
    if (audioSource === 'soundcloud' && !hasSc) {
      toast('Sung recording not available for this tune. Try switching to the piano player by pressing the piano button on the left.')
      mirrorToastShownRef.current = true
    } else if (audioSource === 'midi' && !hasAbc) {
      toast('Piano player not available for this tune. Try switching to the sung recording by pressing the sung recording button on the left.')
      mirrorToastShownRef.current = true
    } else if (audioSource === 'midi' && hasAbc) {
      // MIDI URL present — reset so a later switch back to SoundCloud-on-no-URL
      // fires the toast again.
      mirrorToastShownRef.current = false
    } else if (audioSource === 'soundcloud' && hasSc) {
      mirrorToastShownRef.current = false
    }
  }, [audioSource, audioSourceRestored, hasAbc, hasSc])

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

  const showScToggle = hasSc && hasAbc
  const showDisclaimer = hasSc && audioSource === 'soundcloud'
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
  const isFlow = variant === 'flow'

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
        // 2026-08-16 (Phase 16 R3): 'flow' variant renders in document flow
        // (position:static), used on /tunes/[slug] between the tune name and
        // the tabs. No fixed/inset-x/bottom — the bar scrolls with the page
        // like normal content. A border + rounded card frames it as an audio
        // element rather than chrome. translate-y/opacity transitions are
        // skipped in flow mode (the bar is always visible if visible=true).
        // Phase 21 fqz polish: `embedded` (Legacy view) drops `w-full` so the
        // surrounding flex container can shrink-wrap + center the bar to its
        // controls instead of stretching to the full column width.
        isFlow && !embedded && 'w-full',
        isFlow && 'static rounded-lg border border-border/40 bg-background/90 backdrop-blur-sm px-2 shadow-sm',
        isFlow && 'translate-y-0 opacity-100',
        'transition-all duration-200 ease-out',
        'motion-reduce:translate-y-0 motion-reduce:!transition-opacity motion-reduce:duration-100',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      )}
      style={hidden ? { display: 'none' } : undefined}
    >
      {/* B(d): Collapse button is left-most. 2026-08-16: omitted entirely in
          'flow' mode — the bar lives in document flow, so there's no
          floating-chrome state to collapse back to (a prior CSS-selector
          approach to hide it left `visible:true` / `display:flex` in
          production; not rendering it at all is the reliable fix). */}
      {!isFlow && (
        <button
          type="button"
          aria-label="Collapse player"
          onClick={onCollapse}
          className="h-9 w-8 inline-flex items-center justify-center shrink-0"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}

      {/* B(e): abc/SoundCloud toggle. 2026-08-16 (icon review round): user
          picked Piano (was Music note) for "on recording, tap to switch to
          digital" — reviewed via a side-by-side mockup sent over Telegram.
          Film for "on digital, tap to switch to recording" is unchanged.
          Phase 21 fqz polish: hidden in the Legacy-view embedded player via
          `hideSourceToggle` — Legacy has its own MIDI-only audio surface, so
          the popup-style source switch would be unreachable / confusing. */}
      {showScToggle && !hideSourceToggle && (
        <div className="relative">
          <button
            type="button"
            onClick={() => { setAudioSource((s) => (s === 'midi' ? 'soundcloud' : 'midi')); dismissTour() }}
            aria-label={audioSource === 'midi' ? 'Switch to recording' : 'Switch to digital audio'}
            aria-describedby={showTour ? 'audio-source-tour' : undefined}
            data-audio-source-toggle
            data-mode={audioSource}
            className={cn(
              // 260918-#13: permanent 1.5px ring around the toggle makes it
              // discoverable in both modes (was invisible until the user
              // happened to notice the icon swap). The ring uses the brand
              // primary in SC mode and the muted ring in ABC mode.
              "relative h-9 w-9 inline-flex items-center justify-center rounded-md active:scale-[0.90] transition-[transform,color,background-color,box-shadow] duration-75 shrink-0 border-2",
              isScMode
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground border-muted-foreground/40 hover:border-foreground/70",
            )}
          >
            {isScMode ? <Piano className="h-4 w-4" /> : <Film className="h-4 w-4" />}
            {/* 260918-#13: arrow indicator directly under the toggle. Visible
                whenever the toggle renders so users know it's interactive and
                points to where the popup will appear. */}
            <span
              aria-hidden
              className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px]",
                isScMode ? "border-t-foreground" : "border-t-muted-foreground/60",
              )}
            />
          </button>
          {/* B(f): One-time tour. 260918-#13: also pinned to the toggle
              (mb-3 lines up under the toggle's bottom edge + the new -bottom-2
              arrow indicator, so the visual arrow and the popup stack on the
              same vertical axis). role=dialog + aria-modal gives screen
              readers a clear announcement; id is referenced by
              aria-describedby on the toggle so the description is announced
              when the popup is up. The popup is auto-dismissed on click of
              the toggle too (see setAudioSource handler). */}
          {showScToggle && showTour && (
            <div
              id="audio-source-tour"
              role="dialog"
              aria-modal="false"
              aria-label="Tap to change audio format"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
            >
              <div className="bg-popover text-popover-foreground rounded-lg px-3 py-2 text-xs shadow-lg border whitespace-nowrap">
                <p className="font-medium">Tap here to change audio format</p>
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
        {audioSource === 'midi' && hasAbc ? (
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
