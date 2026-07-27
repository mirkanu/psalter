'use client'

interface StanzaDotIndicatorProps {
  /** 1-based current stanza-set */
  current: number
  /** total stanza-sets */
  total: number
}

/**
 * StanzaDotIndicator — floating carousel-style page-dot pill (MOBILE-10).
 *
 * Replaces GlassBottomBar's stanza display when the bottom-bar chrome is
 * auto-hidden (phone-landscape scroll-hide). Renders one dot per stanza-set
 * when total <= 8, or a "{current} / {total}" text fallback above that
 * (9+ dots at 6px + 6px gap is illegible on a phone-width screen).
 *
 * Indicator-only — dots are not tappable (no direct-jump-to-page interaction).
 * The RENDER CONDITION (phoneLandscapeChromeHide && totalStanzas > 1) is the
 * parent's responsibility; this component only guards on total <= 1.
 */
export function StanzaDotIndicator({ current, total }: StanzaDotIndicatorProps) {
  if (total <= 1) return null

  return (
    <div
      data-stanza-dot-indicator
      role="status"
      aria-live="polite"
      aria-label={`Stanza group ${current} of ${total}`}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+8px)] right-3 z-30 flex items-center gap-1.5 rounded-full border border-border bg-background/85 backdrop-blur-sm px-2 py-1"
    >
      {total > 8 ? (
        <span className="text-xs text-muted-foreground tabular-nums">{`${current} / ${total}`}</span>
      ) : (
        Array.from({ length: total }).map((_, i) => {
          const isActive = i + 1 === current
          return (
            <span
              key={i}
              aria-hidden
              className={
                isActive
                  ? 'h-1.5 w-1.5 rounded-full bg-foreground animate-[psalter-dot-pulse_1.8s_ease-in-out_infinite] motion-reduce:animate-none'
                  : 'h-1.5 w-1.5 rounded-full bg-muted-foreground/40'
              }
            />
          )
        })
      )}
    </div>
  )
}
