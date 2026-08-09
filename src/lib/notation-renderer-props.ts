/**
 * Shared core prop builder for NotationRendererClient (Phase 11, D-03).
 *
 * Three call sites (/tunes/[slug], PsalmTabs Study tab, SingingView) previously built this prop object
 * independently. Commit 9a23059 fixed a meter bug in exactly one of them and left the other two wrong.
 * This module owns the fields that are (or should be) identical everywhere; caller-specific chrome props
 * (chromeless, viewMode, baseSize, stanza callbacks, staffPages, solfegePages,
 * youtubeUrl, soundcloudUrl, staffInlineApproved) stay as explicit per-caller props spread AFTER this
 * helper's return value.
 *
 * This helper is prop plumbing only. It does not compute melisma positions, w: lines, underlines or
 * syllable alignment — see .planning/research/lyric-to-note-alignment.md. `melismaPositions` is
 * deliberately NOT part of the core set.
 */
import type { NotationRendererProps, ViewMode } from '@/components/notation/NotationRenderer'
import type { StructuredLyrics } from '@/lib/lyrics-structured'
import { pickAbcWithMarkers, sopranoOnly } from '@/lib/utils'

export interface NotationSourceTune {
  abcNotation: string | null
  abcSatb?: string | null
  name: string | null
  meter: string | null
  phraseShapeOverride?: number[] | null
  doubleLength?: boolean | null
  solfegeOcrText?: string | null
  scoreJpgUrl?: string | null
  solfegeJpgUrl?: string | null
}

/** Psalm-version-derived values. Callers already hold these in different shapes, so they are passed explicitly. */
export interface NotationContext {
  lyrics: string
  stanzaMeter: string | null
  lyricsStructured: StructuredLyrics | null
}

export interface BuildNotationPropsOptions {
  /** Default true (NotationRenderer's own default). /tunes/[slug] passes false — no lyrics on a tune-only page. */
  showLyrics?: boolean
  /**
   * Omit when the caller is an RSC — the returned object then stays JSON-serialisable and can be handed to a
   * thin client wrapper that attaches its own callback (see src/components/TuneScoreSection.tsx).
   */
  onViewModeChange?: (mode: ViewMode) => void
  /** Used when tune is null or tune.name is null. Default 'Tune'. */
  fallbackTuneName?: string
}

export type CoreNotationProps = Pick<
  NotationRendererProps,
  | 'abc' | 'lyrics' | 'scoreJpgUrl' | 'solfegeJpgUrl' | 'tuneName' | 'tuneMeter'
  | 'phraseShapeOverride' | 'stanzaMeter' | 'lyricsStructured' | 'doubleLength'
  | 'solfegeOcrText' | 'showLyrics' | 'onViewModeChange'
>

export function buildNotationRendererProps(
  tune: NotationSourceTune | null,
  ctx: NotationContext,
  options: BuildNotationPropsOptions = {},
): CoreNotationProps {
  const raw = tune ? pickAbcWithMarkers(tune.abcSatb ?? null, tune.abcNotation ?? null) : null
  return {
    abc: raw ? sopranoOnly(raw) : '',
    lyrics: ctx.lyrics,
    scoreJpgUrl: tune?.scoreJpgUrl ?? null,
    solfegeJpgUrl: tune?.solfegeJpgUrl ?? null,
    tuneName: tune?.name ?? options.fallbackTuneName ?? 'Tune',
    tuneMeter: tune?.meter ?? null,
    phraseShapeOverride: tune?.phraseShapeOverride ?? null,
    stanzaMeter: ctx.stanzaMeter,
    lyricsStructured: ctx.lyricsStructured,
    doubleLength: tune?.doubleLength ?? false,
    solfegeOcrText: tune?.solfegeOcrText ?? null,
    showLyrics: options.showLyrics ?? true,
    onViewModeChange: options.onViewModeChange,
  }
}
