'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AbcAudioControls } from '@/components/singing/AbcAudioControls'
import type { TuneRow } from '@/components/TuneTable'

/**
 * TLIST-04 / D-08: the inline player that expands beneath a /tunes row.
 *
 * The user must be able to SWITCH between the SoundCloud recording and the ABC player (synthesised
 * audio playback of the tune's ABC notation) in place. Both tabs are always reachable; each shows its
 * own empty state when it has nothing to display. This mirrors the existing Recording/ABC toggle in
 * PlayMiniBar (src/components/singing/PlayMiniBar.tsx) — audio only, no sheet-music rendering.
 */
export type PlayerTab = 'recording' | 'abc'

type MediaTune = Pick<TuneRow, 'abcNotation' | 'abcSatb' | 'staffPages' | 'solfegePages' | 'soundcloudUrl'>

export function hasTuneAbc(tune: Pick<MediaTune, 'abcNotation' | 'abcSatb'>): boolean {
  return !!(tune.abcNotation?.trim() || tune.abcSatb?.trim())
}

export function hasTuneImages(tune: Pick<MediaTune, 'staffPages' | 'solfegePages'>): boolean {
  return (tune.staffPages?.length ?? 0) > 0 || (tune.solfegePages?.length ?? 0) > 0
}

/** Drives whether the Recording-column toggle icon renders at all — same "nothing to show, nothing rendered" rule as today. */
export function hasAnyTuneMedia(tune: MediaTune): boolean {
  return !!tune.soundcloudUrl || hasTuneAbc(tune)
}

export function initialPlayerTab(tune: Pick<MediaTune, 'soundcloudUrl'>): PlayerTab {
  return tune.soundcloudUrl ? 'recording' : 'abc'
}

/** Derived at render time only. Never written back to tune.soundcloudUrl — CSV export must keep the raw URL (D-11). */
export function buildSoundcloudEmbedSrc(soundcloudUrl: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false`
}

export function TuneRowInlinePlayer({ tune }: { tune: TuneRow }) {
  const tuneName = tune.name ?? `Tune ${tune.id}`
  const [tab, setTab] = useState<PlayerTab>(() => initialPlayerTab(tune))
  const abcAvailable = hasTuneAbc(tune)
  const abc = tune.abcSatb?.trim() || tune.abcNotation?.trim() || ''

  return (
    <div className="space-y-3">
      {/* Segmented Recording / ABC player toggle — Button pair per UI-SPEC Patterns 1, not shadcn tabs. */}
      <div className="flex gap-1">
        <Button variant={tab === 'recording' ? 'default' : 'outline'} size="xs"
          onClick={() => setTab('recording')} aria-pressed={tab === 'recording'}>Recording</Button>
        <Button variant={tab === 'abc' ? 'default' : 'outline'} size="xs"
          onClick={() => setTab('abc')} aria-pressed={tab === 'abc'}>ABC Player</Button>
      </div>

      {tab === 'recording' && (
        tune.soundcloudUrl ? (
          <iframe
            title={`SoundCloud: ${tuneName}`}
            width="100%"
            height="96"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin"
            src={buildSoundcloudEmbedSrc(tune.soundcloudUrl)}
            className="rounded-md border border-border"
          />
        ) : (
          <p className="text-sm text-muted-foreground">No recording available yet.</p>
        )
      )}

      {tab === 'abc' && (
        abcAvailable ? (
          <AbcAudioControls abc={abc} label={`${tuneName} audio controls`} />
        ) : (
          <p className="text-sm text-muted-foreground">No ABC audio available for this tune yet.</p>
        )
      )}
    </div>
  )
}
