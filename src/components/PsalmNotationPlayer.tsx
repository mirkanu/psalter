'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import AbcRenderer from '@/components/AbcRenderer'

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
  const withoutW = baseAbc.replace(/^w:.*$/gm, '').replace(/\n{3,}/g, '\n\n').trim()
  const wLines = stanzaGroup.map((s) => `w: ${s.replace(/\n/g, ' ')}`).join('\n')
  return `${withoutW}\n${wLines}`
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ScoreMode = 'staff' | 'solfege'
type DisplayMode = 'notation' | 'lyrics-only'

// ── Component ─────────────────────────────────────────────────────────────────

interface PsalmNotationPlayerProps {
  abc: string | null
  lyrics: string
  solfegeJpgUrl: string | null
  tuneName: string
}

export function PsalmNotationPlayer({
  abc,
  lyrics,
  solfegeJpgUrl,
  tuneName,
}: PsalmNotationPlayerProps) {
  // Split lyrics into stanzas, then group by 4 (D-08)
  const stanzas = lyrics
    .split('\n\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const stanzaGroups = chunk(stanzas, 4)

  // State
  const [groupIndex, setGroupIndex] = useState(0)
  // Staff|Solfège toggle (D-09) — localStorage persistence added in Plan 04
  const [scoreMode, setScoreMode] = useState<ScoreMode>('staff')
  // Show notation|Lyrics only toggle (D-10)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('notation')

  // Restore Staff|Solfège preference from localStorage on mount (D-09)
  useEffect(() => {
    const stored = localStorage.getItem('psalter-score-mode')
    if (stored === 'solfege') {
      setScoreMode('solfege')
    }
  }, [])

  // Persist Staff|Solfège preference to localStorage on change (D-09)
  useEffect(() => {
    localStorage.setItem('psalter-score-mode', scoreMode)
  }, [scoreMode])

  // Fallback chain (D-13)
  const hasAbc = abc !== null && abc.trim().length > 0
  const hasSolfege = solfegeJpgUrl !== null && solfegeJpgUrl.trim().length > 0

  if (!hasAbc && !hasSolfege) {
    return (
      <p className="text-sm text-muted-foreground italic">Score not yet available.</p>
    )
  }

  // When only solfège is available, force solfège mode and hide Staff toggle
  const solfegeOnly = !hasAbc && hasSolfege

  // Current stanza group
  const currentGroup = stanzaGroups[groupIndex] ?? []
  const firstStanzaNum = groupIndex * 4 + 1
  const lastStanzaNum = groupIndex * 4 + currentGroup.length
  const counterLabel =
    stanzas.length <= 1
      ? `Stanza 1 / 1`
      : `Stanzas ${firstStanzaNum}–${lastStanzaNum} / ${stanzas.length}`

  // Build ABC string with current stanza group lyrics (D-08)
  const abcForRender =
    hasAbc && currentGroup.length > 0
      ? buildAbcWithStanzas(abc!, currentGroup)
      : (abc ?? '')

  return (
    <div className="space-y-3">

      {/* ── Controls ABOVE the score (D-12) ──────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Staff | Solfège toggle (D-09) — only shown when abc is available */}
        {!solfegeOnly && (
          <div className="flex gap-1">
            <Button
              variant={scoreMode === 'staff' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScoreMode('staff')}
              aria-pressed={scoreMode === 'staff'}
            >
              Staff
            </Button>
            <Button
              variant={scoreMode === 'solfege' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScoreMode('solfege')}
              aria-pressed={scoreMode === 'solfege'}
            >
              Solfège
            </Button>
          </div>
        )}

        {/* Show notation | Lyrics only toggle (D-10) */}
        <div className="flex gap-1">
          <Button
            variant={displayMode === 'notation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDisplayMode('notation')}
            aria-pressed={displayMode === 'notation'}
          >
            Show notation
          </Button>
          <Button
            variant={displayMode === 'lyrics-only' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDisplayMode('lyrics-only')}
            aria-pressed={displayMode === 'lyrics-only'}
          >
            Lyrics only
          </Button>
        </div>
      </div>

      {/* ── Lyrics only mode (D-10): all stanzas as scrollable text ──────── */}
      {displayMode === 'lyrics-only' ? (
        <div className="space-y-4 py-2">
          {stanzas.map((stanza, i) => (
            <p
              key={i}
              className="text-foreground leading-relaxed whitespace-pre-line text-sm"
            >
              <span className="text-xs text-muted-foreground font-mono mr-2">
                {i + 1}.
              </span>
              {stanza}
            </p>
          ))}
        </div>
      ) : (
        <>
          {/* ── Score area ──────────────────────────────────────────────── */}

          {/* Solfège-only fallback: static JPG, no stanza nav */}
          {solfegeOnly ? (
            <div className="relative w-full max-w-2xl mx-auto aspect-[3/2]">
              <Image
                src={solfegeJpgUrl!}
                alt={`Solfège score for ${tuneName}`}
                fill
                className="object-contain rounded-md border border-border"
              />
            </div>
          ) : scoreMode === 'staff' ? (
            /* Staff mode: abcjs SVG with current stanza group lyrics */
            <AbcRenderer abc={abcForRender} title={tuneName} />
          ) : (
            /* Solfège mode (D-09): R2 JPG — stanza nav hidden in this branch */
            hasSolfege ? (
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
            )
          )}

          {/* ── Stanza group nav BELOW score (D-12) ─────────────────────── */}
          {/* Hidden in solfège mode (D-09) and when only one group exists   */}
          {!solfegeOnly && scoreMode === 'staff' && stanzaGroups.length > 1 && (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-muted-foreground text-center">{counterLabel}</p>
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
    </div>
  )
}
