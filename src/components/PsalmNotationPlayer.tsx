'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import AbcRenderer from '@/components/AbcRenderer'
import type { AlternateTune } from '@/db/queries/tunes'
import { ChangeTuneDialog } from '@/components/ChangeTuneDialog'
import { Pencil, Play, Pause, X } from 'lucide-react'
import { toEmbedUrl } from '@/lib/youtube'

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
  stickyScoreMode?: boolean
  mobileStickyScore?: boolean
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
  stickyScoreMode = false,
  mobileStickyScore = false,
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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null)
  // Unified view mode: staff | solfege | lyrics
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem('psalter-score-mode')
      if (stored === 'solfege' || stored === 'lyrics') return stored
    } catch { /* ignore */ }
    return 'staff'
  })

  const tuneHeaderRef = useRef<HTMLDivElement>(null)
  const [imgSticky, setImgSticky] = useState(false)

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

  useEffect(() => {
    if (!mobileStickyScore || !tuneHeaderRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setImgSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    )
    observer.observe(tuneHeaderRef.current)
    return () => observer.disconnect()
  }, [mobileStickyScore])

  const lyricsSizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }[lyricsSize]

  // Fallback chain (D-13)
  const hasAbc = abc !== null && abc.trim().length > 0
  const hasScoreJpg = scoreJpgUrl !== null && scoreJpgUrl.trim().length > 0
  const hasSolfege = solfegeJpgUrl !== null && solfegeJpgUrl.trim().length > 0
  const hasSoundCloud = !!soundcloudUrl && soundcloudUrl.startsWith('http')
  const hasYouTube = !!toEmbedUrl(youtubeUrl)

  // Tune name — linked when tuneId is available
  const tuneNameEl = tuneId ? (
    <Link href={`/tunes/${tuneId}`} className="font-medium text-primary underline-offset-2 hover:underline">
      {tuneName}
    </Link>
  ) : (
    <span className="font-medium text-foreground">{tuneName}</span>
  )

  if (!hasAbc && !hasScoreJpg && !hasSolfege && !hasSoundCloud && !hasYouTube) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-foreground">
            Tune{tuneMeter ? ` (${tuneMeter})` : ''}: {tuneNameEl}
          </span>
          {alternateTunes.length > 0 && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setChangeTuneOpen(true)}
              aria-label="Change tune"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground italic">Score not yet available.</p>
        {stanzas.length > 0 && (
          <div className="space-y-4 py-2">
            {stanzas.map((stanza, i) => (
              <p key={i} className={`text-foreground leading-relaxed whitespace-pre-line ${lyricsSizeClass}`}>
                {stanza}
              </p>
            ))}
          </div>
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

  // ── Score section content ────────────────────────────────────────────────
  const scoreSection = (
    <>
      {/* ── Tune header ──────────────────────────────────────────────────── */}
      <div ref={tuneHeaderRef} className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-foreground">
          Tune{tuneMeter ? ` (${tuneMeter})` : ''}: {tuneNameEl}
        </span>
        {alternateTunes.length > 0 && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setChangeTuneOpen(true)}
            aria-label="Change tune"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {(hasSoundCloud || hasYouTube) && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsAudioPlaying((p) => !p)}
            aria-label={isAudioPlaying ? 'Pause recording' : 'Play recording'}
          >
            {isAudioPlaying
              ? <Pause className="h-3.5 w-3.5" />
              : <Play className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      {/* ── Embedded recording ──────────────────────────────────────────── */}
      {isAudioPlaying && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground italic">Note: lyrics may not match</p>
          {hasSoundCloud ? (
            <iframe
              title={`SoundCloud: ${tuneName}`}
              width="100%"
              height="96"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl!)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false`}
              className="rounded-md border border-border"
            />
          ) : (
            <div className="aspect-video w-full max-w-sm rounded-md overflow-hidden border border-border">
              <iframe
                src={`${toEmbedUrl(youtubeUrl)}?autoplay=1&mute=1`}
                title={`YouTube: ${tuneName}`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            </div>
          )}
        </div>
      )}

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

      {/* ── Score area (only when not in lyrics-only mode) ──────────────── */}
      <div className={mobileStickyScore && imgSticky ? 'sticky top-[6rem] z-10 bg-background pb-2' : ''}>
      {viewMode !== 'lyrics' && (
        <>
          {imageOnlyMode ? (
            /* No ABC: show image for current mode */
            <>
              {viewMode === 'staff' && hasScoreJpg ? (
                <div
                  className="relative w-full max-w-2xl mx-auto aspect-[3/2] cursor-zoom-in"
                  onClick={() => setFullscreenSrc(scoreJpgUrl!)}
                  title="Click to view fullscreen"
                >
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
                <div
                  className="relative w-full max-w-2xl mx-auto aspect-[3/2] cursor-zoom-in"
                  onClick={() => setFullscreenSrc(solfegeJpgUrl!)}
                  title="Click to view fullscreen"
                >
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
            </>
          ) : viewMode === 'staff' ? (
            /* Staff mode: abcjs SVG with current stanza group lyrics */
            <AbcRenderer abc={abcForRender} title={tuneName} />
          ) : (
            /* Solfège mode: R2 JPG */
            <>
              {hasSolfege ? (
                <div
                  className="relative w-full max-w-2xl mx-auto aspect-[3/2] cursor-zoom-in"
                  onClick={() => setFullscreenSrc(solfegeJpgUrl!)}
                  title="Click to view fullscreen"
                >
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
            </>
          )}
        </>
      )}
      </div>
    </>
  )

  // ── Lyrics section content ───────────────────────────────────────────────
  const lyricsSection = (
    <>
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
      ) : imageOnlyMode ? (
        /* No ABC: full lyrics below image */
        stanzas.length > 0 ? (
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
        ) : null
      ) : viewMode === 'solfege' ? (
        /* Solfège mode with ABC: full lyrics below */
        stanzas.length > 0 ? (
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
        ) : null
      ) : (
        /* Staff mode with ABC: stanza group nav */
        !imageOnlyMode && viewMode === 'staff' && stanzaGroups.length > 1 ? (
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
        ) : null
      )}
    </>
  )

  return (
    <>
      <div className={stickyScoreMode ? 'flex flex-col h-full' : 'space-y-3'}>
        {/* ── Score section (non-scrolling in sticky mode; sticky via page in mobileStickyScore mode) ── */}
        <div className={stickyScoreMode ? 'flex-shrink-0 space-y-3' : 'space-y-3'}>
          {scoreSection}
        </div>

        {/* ── Lyrics section (scrollable in sticky mode; normal page flow in mobileStickyScore mode) ── */}
        <div className={stickyScoreMode ? 'flex-1 overflow-y-auto py-2' : ''}>
          {lyricsSection}
        </div>
      </div>

      {/* ── Fullscreen image overlay ─────────────────────────────────────── */}
      {fullscreenSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setFullscreenSrc(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenSrc(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/80 border border-border hover:bg-muted"
            aria-label="Close fullscreen"
          >
            <X className="size-5" />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <img
              src={fullscreenSrc}
              alt={`${tuneName} — fullscreen`}
              className="max-w-full max-h-[85vh] object-contain rounded-md"
            />
          </div>
        </div>
      )}

      <ChangeTuneDialog
        open={changeTuneOpen}
        onClose={() => setChangeTuneOpen(false)}
        currentTuneId={tuneId}
        tunes={alternateTunes}
        meter={tuneMeter}
        onSelect={onChangeTune}
      />
    </>
  )
}
