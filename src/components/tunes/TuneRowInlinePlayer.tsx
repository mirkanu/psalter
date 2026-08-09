'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TuneScoreGallery } from '@/components/TuneScoreGallery'
import { NotationRendererClient } from '@/components/notation/NotationRendererClient'
import { buildNotationRendererProps } from '@/lib/notation-renderer-props'
import type { TuneRow } from '@/components/TuneTable'

/**
 * TLIST-04 / D-08: the inline player that expands beneath a /tunes row.
 *
 * D-08 is explicit that this is NOT an availability-based either/or fallback — the user must be able to
 * SWITCH between the SoundCloud recording and the ABC/score player in place. Both tabs are always
 * reachable; each shows its own empty state when it has nothing to display.
 */
export type PlayerTab = 'recording' | 'score'

type MediaTune = Pick<TuneRow, 'abcNotation' | 'abcSatb' | 'staffPages' | 'solfegePages' | 'soundcloudUrl'>

export function hasTuneAbc(tune: Pick<MediaTune, 'abcNotation' | 'abcSatb'>): boolean {
  return !!(tune.abcNotation?.trim() || tune.abcSatb?.trim())
}

export function hasTuneImages(tune: Pick<MediaTune, 'staffPages' | 'solfegePages'>): boolean {
  return (tune.staffPages?.length ?? 0) > 0 || (tune.solfegePages?.length ?? 0) > 0
}

/** Drives whether the Recording-column toggle icon renders at all — same "nothing to show, nothing rendered" rule as today. */
export function hasAnyTuneMedia(tune: MediaTune): boolean {
  return !!tune.soundcloudUrl || hasTuneAbc(tune) || hasTuneImages(tune)
}

export function initialPlayerTab(tune: Pick<MediaTune, 'soundcloudUrl'>): PlayerTab {
  return tune.soundcloudUrl ? 'recording' : 'score'
}

/** Derived at render time only. Never written back to tune.soundcloudUrl — CSV export must keep the raw URL (D-11). */
export function buildSoundcloudEmbedSrc(soundcloudUrl: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false`
}

export function TuneRowInlinePlayer({ tune }: { tune: TuneRow }) {
  const tuneName = tune.name ?? `Tune ${tune.id}`
  const [tab, setTab] = useState<PlayerTab>(() => initialPlayerTab(tune))
  const [scoreMode, setScoreMode] = useState<'staff' | 'solfege'>(
    tune.staffPages.length > 0 ? 'staff' : 'solfege',
  )
  const abcAvailable = hasTuneAbc(tune)
  const imagesAvailable = hasTuneImages(tune)

  return (
    <div className="space-y-3">
      {/* Segmented Recording / Score toggle — Button pair per UI-SPEC Patterns 1, not shadcn tabs. */}
      <div className="flex gap-1">
        <Button variant={tab === 'recording' ? 'default' : 'outline'} size="xs"
          onClick={() => setTab('recording')} aria-pressed={tab === 'recording'}>Recording</Button>
        <Button variant={tab === 'score' ? 'default' : 'outline'} size="xs"
          onClick={() => setTab('score')} aria-pressed={tab === 'score'}>Score</Button>
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

      {tab === 'score' && (
        abcAvailable ? (
          <NotationRendererClient
            {...buildNotationRendererProps(
              {
                abcNotation: tune.abcNotation,
                abcSatb: tune.abcSatb,
                name: tune.name,
                meter: tune.meter,
                phraseShapeOverride: tune.phraseShapeOverride,
                doubleLength: tune.doubleLength,
                solfegeOcrText: tune.solfegeOcrText,
                scoreJpgUrl: tune.staffPages[0] ?? null,
                solfegeJpgUrl: tune.solfegePages[0] ?? null,
              },
              // No psalm-version context on the list page: this is a tune-only preview.
              { lyrics: '', stanzaMeter: null, lyricsStructured: null },
              { showLyrics: false, fallbackTuneName: tuneName },
            )}
            staffPages={tune.staffPages}
            solfegePages={tune.solfegePages}
          />
        ) : imagesAvailable ? (
          <div className="space-y-2">
            <div className="flex gap-1">
              {tune.staffPages.length > 0 && (
                <Button variant={scoreMode === 'staff' ? 'default' : 'outline'} size="xs"
                  onClick={() => setScoreMode('staff')} aria-pressed={scoreMode === 'staff'}>Staff</Button>
              )}
              {tune.solfegePages.length > 0 && (
                <Button variant={scoreMode === 'solfege' ? 'default' : 'outline'} size="xs"
                  onClick={() => setScoreMode('solfege')} aria-pressed={scoreMode === 'solfege'}>Solfège</Button>
              )}
            </div>
            <TuneScoreGallery
              pages={scoreMode === 'staff' ? tune.staffPages : tune.solfegePages}
              alt={tuneName}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Score not yet digitised for this tune.</p>
        )
      )}
    </div>
  )
}
