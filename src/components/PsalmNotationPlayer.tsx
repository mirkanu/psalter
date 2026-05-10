'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import AbcRenderer from '@/components/AbcRenderer'
import type { AlternateTune } from '@/db/queries/tunes'
import { ChangeTuneDialog } from '@/components/ChangeTuneDialog'
import { TuneAudioPlayer } from '@/components/TuneAudioPlayer'

// ── Helpers ──────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const groups: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    groups.push(arr.slice(i, i + size))
  }
  return groups
}

/**
 * Inject current stanza group as w: lyric lines into the ABC string.
 * Replaces all existing w: lines so abcjs renders the correct stanzas.
 */
function buildAbcWithStanzas(baseAbc: string, stanzaGroup: string[]): string {
  // Strip w: lines then collapse blank lines — blank lines in ABC mean "new tune"
  // which causes abcjs to only render the first voice line
  const withoutW = baseAbc.replace(/^w:.*$/gm, '').replace(/\n\n+/g, '\n').trim()
  const wLines = stanzaGroup.map((s) => `w: ${s.replace(/\n/g, ' ')}`).join('\n')
  return `${withoutW}\n${wLines}`
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'staff' | 'solfege' | 'lyrics'
type LyricsSize = 'sm' | 'base' | 'lg'

// ── Component ─────────────────────────────────────────────────────────────────

interface PsalmNotationPlayerProps {
  abc: string | null
  lyrics: string
  scoreJpgUrl: string | null
  solfegeJpgUrl: string | null
  tuneName: string
  tuneMeter: string | null
  tuneId: number | null
  soundcloudUrl: string | null
  youtubeUrl: string | null
  alternateTunes: AlternateTune[]
  onChangeTune: (tune: AlternateTune) => void
}

export function PsalmNotationPlayer({
  abc,
  lyrics,
  scoreJpgUrl,
  solfegeJpgUrl,
  tuneName,
  tuneMeter,
  tuneId,
  soundcloudUrl,
  youtubeUrl,
  alternateTunes,
  onChangeTune,
}: PsalmNotationPlayerProps) {
  // Split lyrics into stanzas, then group by 4 (D-08)
  const stanzas = lyrics
    .split('\n\n')
    .map((s) => s.trim().replace(/^(\d+)([A-Za-z])/, '$1 $2'))
    .filter(Boolean)
  const stanzaGroups = chunk(stanzas, 4)

  // State
  const [groupIndex, setGroupIndex] = useState(0)
  const [changeTuneOpen, setChangeTuneOpen] = useState(false)
  // Unified view mode: staff | solfege | lyrics
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem('psalter-score-mode')
      if (stored === 'solfege' || stored === 'lyrics') return stored
    } catch { /* ignore */ }
    return 'staff'
  })

  // A± font size toggle — lazy init reads localStorage to avoid flash
  const [lyricsSize, setLyricsSize] = useState<LyricsSize>(() => {
    try {
      const stored = localStorage.getItem('psalter-lyrics-size')
      if (stored === 'sm' || stored === 'lg') return stored
    } catch { /* ignore */ }
    return 'base'
  })

  useEffect(() => {
    localStorage.setItem('psalter-score-mode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('psalter-lyrics-size', lyricsSize)
  }, [lyricsSize])

  const lyricsSizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }[lyricsSize]

  // Fallback chain (D-13)
  const hasAbc = abc !== null && abc.trim().length > 0
  const hasScoreJpg = scoreJpgUrl !== null && scoreJpgUrl.trim().length > 0
  const hasSolfege = solfegeJpgUrl !== null && solfegeJpgUrl.trim().length > 0

  if (!hasAbc && !hasScoreJpg && !hasSolfege) {
    return (
      <p className="text-sm text-muted-foreground italic">Score not yet available.</p>
    )
  }

  // When ABC is unavailable, images are shown with full lyrics below
  const imageOnlyMode = !hasAbc
  // Staff button visible when ABC or a score JPG is available
  const canShowStaff = hasAbc || hasScoreJpg

  // Current stanza group
  const currentGroup = stanzaGroups[groupIndex] ?? []
  // Build ABC string with current stanza group lyrics (D-08)
  const abcForRender =
    hasAbc && currentGroup.length > 0
      ? buildAbcWithStanzas(abc!, currentGroup)
      : (abc ?? '')

  return (
    <div className="space-y-3">

      {/* ── Tune header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-foreground">
          Tune: {tuneName}{tuneMeter ? ` (${tuneMeter})` : ''}
        </span>
        {alternateTunes.length > 0 && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setChangeTuneOpen(true)}
          >
            Change Tune
          </Button>
        )}
      </div>

      {/* ── Recording play button ────────────────────────────────────────── */}
      <TuneAudioPlayer
        soundcloudUrl={soundcloudUrl}
        youtubeUrl={youtubeUrl}
        tuneName={tuneName}
      />

      {/* ── Controls ABOVE the score ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Staff | Solfège | Lyrics — unified 3-button toggle */}
        <div className="flex gap-1">
          {canShowStaff && (
            <Button
              variant={viewMode === 'staff' ? 'default' : 'outline'}
              size="xs"
              onClick={() => setViewMode('staff')}
              aria-pressed={viewMode === 'staff'}
            >
              Staff
            </Button>
          )}
          <Button
            variant={viewMode === 'solfege' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setViewMode('solfege')}
            aria-pressed={viewMode === 'solfege'}
          >
            Solfège
          </Button>
          <Button
            variant={viewMode === 'lyrics' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setViewMode('lyrics')}
            aria-pressed={viewMode === 'lyrics'}
          >
            Lyrics only
          </Button>
        </div>

        {/* A− | A+ font size toggle — only visible in lyrics mode */}
        {viewMode === 'lyrics' && (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setLyricsSize((s) => s === 'lg' ? 'base' : 'sm')}
              aria-label="Decrease lyrics font size"
              disabled={lyricsSize === 'sm'}
            >
              A−
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setLyricsSize((s) => s === 'sm' ? 'base' : 'lg')}
              aria-label="Increase lyrics font size"
              disabled={lyricsSize === 'lg'}
            >
              A+
            </Button>
          </div>
        )}
      </div>

      {/* ── Lyrics mode: all stanzas as scrollable text ───────────────────── */}
      {viewMode === 'lyrics' ? (
        <div className="space-y-4 py-2">
          {stanzas.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No lyrics available.</p>
          ) : stanzas.map((stanza, i) => (
            <p
              key={i}
              className={`text-foreground leading-relaxed whitespace-pre-line ${lyricsSizeClass}`}
            >
              {stanza}
            </p>
          ))}
        </div>
      ) : (
        <>
          {/* ── Score area ──────────────────────────────────────────────── */}

          {imageOnlyMode ? (
            /* No ABC: show image for current mode + full lyrics below */
            <>
              {viewMode === 'staff' && hasScoreJpg ? (
                <div className="relative w-full max-w-2xl mx-auto aspect-[3/2]">
                  <Image
                    src={scoreJpgUrl!}
                    alt={`Score for ${tuneName}`}
                    fill
                    className="object-contain rounded-md border border-border"
                  />
                </div>
              ) : viewMode === 'staff' ? (
                <p className="text-sm text-muted-foreground italic">Staff score not yet available.</p>
              ) : hasSolfege ? (
                <div className="relative w-full max-w-2xl mx-auto aspect-[3/2]">
                  <Image
                    src={solfegeJpgUrl!}
                    alt={`Solfège score for ${tuneName}`}
                    fill
                    className="object-contain rounded-md border border-border"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Solfège score not yet available.</p>
              )}

              {/* Full lyrics below the image */}
              {stanzas.length > 0 && (
                <div className="space-y-4 py-2 mt-4 border-t border-border">
                  {stanzas.map((stanza, i) => (
                    <p
                      key={i}
                      className={`text-foreground leading-relaxed whitespace-pre-line ${lyricsSizeClass}`}
                    >
                      {stanza}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : viewMode === 'staff' ? (
            /* Staff mode: abcjs SVG with current stanza group lyrics */
            <AbcRenderer abc={abcForRender} title={tuneName} />
          ) : (
            /* Solfège mode: R2 JPG + full lyrics below */
            <>
              {hasSolfege ? (
                <div className="relative w-full max-w-2xl mx-auto aspect-[3/2]">
                  <Image
                    src={solfegeJpgUrl!}
                    alt={`Solfège score for ${tuneName}`}
                    fill
                    className="object-contain rounded-md border border-border"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Solfège score not yet available.
                </p>
              )}
              {stanzas.length > 0 && (
                <div className="space-y-4 py-2 mt-4 border-t border-border">
                  {stanzas.map((stanza, i) => (
                    <p
                      key={i}
                      className={`text-foreground leading-relaxed whitespace-pre-line ${lyricsSizeClass}`}
                    >
                      {stanza}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Stanza group nav BELOW score — only when ABC is rendering */}
          {!imageOnlyMode && viewMode === 'staff' && stanzaGroups.length > 1 && (
            <div className="space-y-2 mt-2">
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGroupIndex((n) => Math.max(0, n - 1))}
                  disabled={groupIndex === 0}
                  aria-label="Previous stanza group"
                >
                  ← Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGroupIndex((n) => Math.min(stanzaGroups.length - 1, n + 1))}
                  disabled={groupIndex === stanzaGroups.length - 1}
                  aria-label="Next stanza group"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ChangeTuneDialog
        open={changeTuneOpen}
        onClose={() => setChangeTuneOpen(false)}
        currentTuneId={tuneId}
        tunes={alternateTunes}
        meter={tuneMeter}
        onSelect={onChangeTune}
      />
    </div>
  )
}
