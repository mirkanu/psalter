'use client'
import { useState } from 'react'
import { NotationRendererClient } from '@/components/notation/NotationRendererClient'
import type { CoreNotationProps } from '@/lib/notation-renderer-props'
import type { ViewMode } from '@/components/notation/NotationRenderer'

interface TuneScoreSectionProps {
  /** Server-built core props from buildNotationRendererProps() — JSON-serialisable, no callbacks. */
  notationProps: CoreNotationProps
  staffPages: string[]
  solfegePages: string[]
}

/**
 * Thin client wrapper for /tunes/[slug]'s Score section (Phase 11, D-02).
 *
 * D-02 requires this page to pass `onViewModeChange` for parity with PsalmTabs' Study-tab call site. The
 * page itself is an RSC (`export default async function TunePage`) and cannot own a callback, so — following
 * the same "thin client wrapper owns state the parent RSC can't" pattern already used on this page by
 * TuneMiniBarSection — the view mode lives here. The active mode is surfaced as `data-tune-view-mode` so
 * page chrome and UATs can observe it.
 */
export function TuneScoreSection({ notationProps, staffPages, solfegePages }: TuneScoreSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode | null>(null)
  return (
    <div data-tune-view-mode={viewMode ?? undefined}>
      <NotationRendererClient
        {...notationProps}
        onViewModeChange={setViewMode}
        staffPages={staffPages}
        solfegePages={solfegePages}
      />
    </div>
  )
}
