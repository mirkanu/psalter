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
 */
export function LegacyAudioEmbed({ abc, soundcloudUrl, tuneName }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div data-legacy-midi className="w-full">
      <PlayMiniBar
        variant="flow"
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