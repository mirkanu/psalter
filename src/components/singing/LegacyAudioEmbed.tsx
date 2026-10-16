'use client'

import { useState } from 'react'
import { PlayMiniBar } from './PlayMiniBar'

interface Props {
  abc: string
  soundcloudUrl: string | null
  tuneName: string
}

/**
 * Phase 21 fqz (item 3): real MIDI player embedded inline in Legacy view.
 *
 * Replaces the dead placeholder "Piano player available — press Play in the
 * bottom bar to listen" (NotationRenderer.tsx legacy branch, pre-fqz). In
 * Legacy view the bottom-right play button is hidden
 * (`SingingView.tsx hidePlayButton={viewMode==='legacy'}`) and PlayMiniBar
 * is unmounted, so the original placeholder was advertising a control that
 * wasn't reachable.
 *
 * Reuses PlayMiniBar with `variant='flow'` so the controls sit in document
 * flow inside the legacy embeds column (already proven on /tunes/[slug]).
 * The 'flow' variant suppresses the collapse button (PlayMiniBar.tsx:270-279)
 * so `onCollapse` is a no-op; the type still requires the prop, so we pass
 * `() => {}`. PlayMiniBar's own localStorage migration
 * (`psalter-audio-source='abc'` → `'midi'`, PlayMiniBar.tsx:69-86) runs
 * inside this component's render so legacy visitors keep their last
 * selection.
 *
 * Phase 21 fqz polish:
 *   - `hideSourceToggle` hides the Piano↔SoundCloud source-switch button —
 *     Legacy has its own MIDI-only audio surface and the popup toggle would
 *     be unreachable / confusing. The popup PlayMiniBar in Music Notes /
 *     Lyrics Only still shows it.
 *   - `embedded` drops the bar's `w-full` so the wrapper below can
 *     shrink-wrap + center the bar to its controls instead of stretching
 *     to the full column width.
 *
 * Quick fix (post-fqz, see PlayMiniBar forceSource):
 *   - `forceSource='midi'` pins this instance's audio source to MIDI for its
 *     entire lifetime. Without it, PlayMiniBar reads
 *     `psalter.audioLastSelected` on hydrate and surfaces whatever the user
 *     last picked in the popup (Music Notes / Lyrics) — leaving Legacy's
 *     second box showing SoundCloud twice (the visible SoundCloud iframe on
 *     top + the PlayMiniBar's SoundCloud-mode iframe replacing the MIDI).
 *     Force-source skips BOTH the hydrate read and the persist write, so
 *     the embedded player is decoupled from the popup's shared localStorage
 *     key entirely.
 */
export function LegacyAudioEmbed({ abc, soundcloudUrl, tuneName }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div data-legacy-midi className="flex justify-center">
      <PlayMiniBar
        variant="flow"
        embedded
        hideSourceToggle
        forceSource="midi"
        mounted={true}
        visible={true}
        abc={abc}
        soundcloudUrl={soundcloudUrl}
        tuneName={tuneName}
        isPlaying={isPlaying}
        onPlayingChange={setIsPlaying}
        onCollapse={() => {}}
      />
    </div>
  )
}