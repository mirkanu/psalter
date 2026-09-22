'use client'

import { useRouter } from 'next/navigation'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Music,
  Columns2,
  Rows2,
  BookOpen,
  HelpCircle,
  Settings,
  ScanLine,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ViewMode } from '@/components/notation/NotationRenderer'
import { computeInlineLayoutDisabled } from '@/lib/inline-staff-gating'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (m: ViewMode) => void
  studyHref: string
  onRestartTour: () => void
  showLyricsOption: boolean
  /** Whether Staff notation is available (ABC exists for this tune). */
  staffAvailable: boolean
  /** Whether INLINE Solfège rendering exists. Hardcoded false for now — real
   *  abcjs tonic sol-fa rendering is not built yet. */
  solfegeInlineAvailable: boolean
  /** Whether SPLIT-LEAF Solfège (scanned JPG) is available. */
  solfegeSplitAvailable: boolean
  /** Plan 04.9.15-04 (MOBILE-08): derived from the active tune's latest
   *  tuneMelismaDecisions.status === 'approved'. Gates the Inline Staff
   *  layout button — only precentor-verified tunes may render inline. */
  staffInlineApproved: boolean
  /** Whether a tune is currently active at all (260717-mwv checkpoint round 1,
   *  item 2b) — when false, tapping "Music Notes" opens the tune selector
   *  instead of toggling the view mode (there is nothing to notate yet). */
  hasActiveTune: boolean
  /** Opens the tune switcher sheet. Called when the user taps "Music Notes"
   *  with no active tune (260717-mwv item 2b). */
  onRequestTuneSelection: () => void
  /** Whether a scanned score JPG exists for the active tune (staff or solfège).
   *  Mirrors AbcPlayer's own `hasOriginal = !!(staffJpgUrl || solfegeJpgUrl)` gate.
   *  When false the Score row is not rendered at all. */
  originalScanAvailable: boolean
  /** Whether the scanned original is currently shown in place of live abcjs. */
  showOriginal: boolean
  onShowOriginalChange: (next: boolean) => void
}

export function GearPopover({
  open,
  onOpenChange,
  viewMode,
  onViewModeChange,
  studyHref,
  onRestartTour,
  showLyricsOption,
  staffAvailable,
  solfegeInlineAvailable,
  solfegeSplitAvailable,
  staffInlineApproved,
  hasActiveTune,
  onRequestTuneSelection,
  originalScanAvailable,
  showOriginal,
  onShowOriginalChange,
}: Props) {
  const router = useRouter()

  const isMusicNotes = viewMode !== 'lyrics'
  const isStaff = viewMode === 'staff' || viewMode === 'staff-split'
  const isSplit = viewMode === 'staff-split' || viewMode === 'solfege-split'

  // Issue #59 point 3 — derive visual 'active' state for the sub-toggles so
  // they still show which family/layout the user is currently in, even from
  // Lyrics Only where the live viewMode reports neither staff nor split. The
  // remembered state comes from the same localStorage key handleMainMusicNotes
  // reads, so tapping Music Notes after a sub-toggle matches the user's last
  // selection.
  const inLyricsOnly = viewMode === 'lyrics'
  const rememberedLayout: 'inline' | 'split-leaf' | null = inLyricsOnly ? rememberLastLayout() : null
  const rememberedNotation: 'staff' | 'solfege' | null = inLyricsOnly ? rememberLastNotation() : null
  // When Lyrics Only is active, the live viewMode reports neither staff nor
  // split, so we must NOT fall back to the remembered sub-toggle selection —
  // otherwise the buttons render as if one were already chosen. While in
  // Lyrics Only, the sub-toggles are reachable but visually unselected; the
  // first tap just switches into the corresponding Music Notes view using
  // the remembered default.
  const notationStaffActive = staffAvailable && isMusicNotes && (isStaff || rememberedNotation === 'staff')
  const notationSolfegeActive = solfegeSplitAvailable && isMusicNotes && (!isStaff || rememberedNotation === 'solfege')
  const layoutInlineActive = isMusicNotes && (!isSplit || rememberedLayout === 'inline')
  const layoutSplitActive = isMusicNotes && (isSplit || rememberedLayout === 'split-leaf')
  // Issue #59 follow-up: the Inline layout button's gating and tooltip need
  // to agree with what handleLayoutChange actually does. When invoked from
  // Lyrics Only we fall back to the remembered notation family, so the
  // aria-disabled and title must use the same effective family — otherwise
  // the button can be greyed out and warn "not approved for this tune" even
  // though the underlying click would resolve to Staff (where inline IS
  // approved) and switch successfully.
  const effectiveNotationForLayout: 'staff' | 'solfege' = inLyricsOnly
    ? (rememberedNotation ?? 'staff')
    : (isStaff ? 'staff' : 'solfege')
  const effectiveIsStaffForLayout = effectiveNotationForLayout === 'staff'
  const inlineLayoutDisabledEffective = computeInlineLayoutDisabled({
    isStaff: effectiveIsStaffForLayout,
    staffInlineApproved,
    solfegeInlineAvailable,
  })
  const inlineLayoutDisabledTitle = inlineLayoutDisabledEffective
    ? (effectiveIsStaffForLayout
        ? "Inline Staff notation isn't approved for this tune yet"
        : 'Inline Solfège coming soon')
    : undefined
  // 260717-mwv checkpoint round 1 (item 3b): a tune IS active but has zero
  // notation in any form — grey out "Music Notes" entirely rather than
  // letting the user navigate into a blank view. Tapping it anyway still
  // explains why (item 3a/3b), since this uses aria-disabled + a live onClick
  // rather than the native `disabled` attribute.
  const hasAnyNotation = staffAvailable || solfegeSplitAvailable
  const musicNotesBlocked = hasActiveTune && !hasAnyNotation

  // 2026-09-05: "Score: Digital | Original scan" sub-toggle HIDDEN.
  // Staff split-leaf now ALWAYS renders the scanned JPG (see
  // [[project-staff-split-leaf-disabled]] and `forceStaffJpgFallback` in
  // NotationRenderer.tsx). With digital split-leaf disabled, the only view
  // where the swap would have meant anything is already force-JPG, so this
  // toggle has no effect to expose to the user. The JSX block below is gated
  // on `false && showScoreSourceRow` and the derivation is hard-coded to
  // `false` so both pieces of code are preserved verbatim in source. To
  // re-enable: restore the derivation and remove the `false &&` short-circuit.
  //
  // ORIGINAL DERIVATION (preserved for re-activation):
  //   // The scan swap only does anything where live abcjs is what's rendering:
  //   // staff / staff-split with the approval gate satisfied. In solfege-split
  //   // the scan IS the render, and in an unapproved staff-split the scan is
  //   // already force-shown (forceStaffJpgFallback) — offering "Digital"
  //   // there would hand back the very inline rendering MOBILE-08 blocks.
  //   //
  //   // Quick 260822-fgb: the swap is offered ONLY in Split-Leaf layout,
  //   // where the score panel is a standalone column. In Inline layout the
  //   // staff is interleaved with the `w:` lyric lines, and substituting a
  //   // flat scan there would break the lyric-to-note pairing.
  //   const scanAlreadyForced = isStaff && isSplit && !staffInlineApproved
  //   const showScoreSourceRow =
  //     isMusicNotes && isStaff && isSplit && originalScanAvailable && !scanAlreadyForced
  void isMusicNotes; void isStaff; void isSplit; void originalScanAvailable; void staffInlineApproved
  const scanAlreadyForced = false
  const showScoreSourceRow = false

  const handleNotationChange = (notation: 'staff' | 'solfege') => {
    if (notation === 'staff' && !staffAvailable) {
      toast('Coming soon', { description: 'Staff notation for this tune is not yet available' })
      return
    }
    if (notation === 'solfege' && !solfegeSplitAvailable) {
      toast('Coming soon', { description: "Solfège isn't available for this tune" })
      return
    }
    // Issue #59 point 3: from Lyrics Only, read the last layout from
    // localStorage (the same 'psalter-score-mode-last-music' key the top-level
    // Music Notes button writes/reads). Otherwise honour the current view's
    // layout. Solfège always renders split-leaf — there is no inline solfège.
    const fromLyrics = viewMode === 'lyrics'
    const lastLayout = fromLyrics ? rememberLastLayout() : (isSplit ? 'split-leaf' : 'inline')
    const wantSplit = lastLayout === 'split-leaf'
    const newMode: ViewMode =
      notation === 'solfege'
        ? (wantSplit ? 'solfege-split' : 'staff-split')
        : (wantSplit ? 'staff-split' : 'staff')
    onViewModeChange(newMode)
  }

  const handleLayoutChange = (layout: 'inline' | 'split-leaf') => {
    // Issue #59 point 3: when invoked from Lyrics Only, default the notation
    // family to Staff (no solfège inline either way). The user's last staff
    // choice is read from the same localStorage key the Music Notes button
    // uses so the round-trip stays consistent.
    const fromLyrics = viewMode === 'lyrics'
    const effectiveNotation: 'staff' | 'solfege' = fromLyrics
      ? (rememberLastNotation())
      : (isStaff ? 'staff' : 'solfege')
    const effectiveIsStaff = effectiveNotation === 'staff'
    if (layout === 'inline' && !effectiveIsStaff && !solfegeInlineAvailable) {
      toast('Coming soon', { description: 'Inline Solfège notation is not yet available — Split-Leaf shows the scanned Solfège' })
      return
    }
    // 260717-mwv checkpoint round 4 (new item A): this button is greyed out
    // (aria-disabled, not native disabled — see JSX) specifically so a real
    // tap still reaches this handler and can explain why, generalizing the
    // "tap a disabled Music Notes control to see why" pattern beyond just
    // the top-level Music Notes toggle (MOBILE-08 gate).
    if (layout === 'inline' && effectiveIsStaff && !staffInlineApproved) {
      toast("Inline Staff notation isn't approved for this tune yet — showing Split-Leaf. Pick a different view in Settings.")
      return
    }
    const newMode: ViewMode = effectiveIsStaff
      ? (layout === 'split-leaf' ? 'staff-split' : 'staff')
      : (layout === 'split-leaf' ? 'solfege-split' : 'solfege')
    onViewModeChange(newMode)
  }

  // Issue #59 point 3 — helpers used by the sub-toggle handlers when the user
  // taps Notation or Layout from Lyrics Only. Reads the same
  // 'psalter-score-mode-last-music' key that handleMainMusicNotes reads (so
  // the round-trip stays in sync) and the broader 'psalter-score-mode' key
  // to recover the last notation family (staff vs. solfège).
  //
  // NOTE: SingingView only writes 'psalter-score-mode-last-music' while
  // viewMode !== 'lyrics', and writes 'psalter-score-mode' on every viewMode
  // change — so we read 'psalter-score-mode' for notation family (which may
  // be 'lyrics' on first visit, in which case we default to Staff).
  function rememberLastLayout(): 'inline' | 'split-leaf' {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('psalter-score-mode-last-music') : null
    if (stored === 'staff' || stored === 'solfege') return 'inline'
    // staff-split, solfege-split, anything else → split-leaf
    return 'split-leaf'
  }

  function rememberLastNotation(): 'staff' | 'solfege' {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('psalter-score-mode') : null
    if (stored === 'solfege' || stored === 'solfege-split') return 'solfege'
    return 'staff'
  }

  const handleMainMusicNotes = () => {
    if (isMusicNotes) return
    // 260717-mwv checkpoint round 1 (item 2b): no tune active at all — open
    // the tune selector instead of the old "select a tune" fallback message.
    if (!hasActiveTune) {
      onRequestTuneSelection()
      return
    }
    // Item 3a/3b: a tune IS active but has no notation in any form — explain
    // why Music Notes is unavailable instead of switching into a blank view.
    if (musicNotesBlocked) {
      toast('No staff or solfège notation available for this tune — showing Lyrics Only. Audio may still be available via Play.')
      return
    }
    // Restore last music mode — default to staff if nothing saved. Reads
    // 'psalter-score-mode-last-music' (written by SingingView only while
    // viewMode !== 'lyrics'), NOT the general 'psalter-score-mode' key —
    // that one gets overwritten with 'lyrics' the moment the user switches
    // to Lyrics Only, which previously made this always fall back to plain
    // 'staff' instead of the user's actual last Music Notes selection.
    const stored = typeof window !== 'undefined' ? localStorage.getItem('psalter-score-mode-last-music') : null
    if (stored === 'staff-split' || stored === 'solfege' || stored === 'solfege-split') {
      // Inline Solfège isn't built yet — a stale localStorage value of
      // 'solfege' would otherwise silently restore the disabled inline
      // state, bypassing the gear toggle's gating. Redirect to Staff.
      if (stored === 'solfege' && !solfegeInlineAvailable) {
        onViewModeChange('staff')
      } else {
        onViewModeChange(stored as ViewMode)
      }
    } else {
      onViewModeChange('staff')
    }
  }

  const handleRestartTour = () => {
    onOpenChange(false)
    setTimeout(onRestartTour, 160)
  }

  const handleStudy = () => {
    onOpenChange(false)
    router.push(studyHref)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Settings"
          data-singing-gear
          data-tour-target="view-controls"
          className="min-h-10 min-w-11 inline-flex items-center justify-center text-muted-foreground active:scale-[0.90] transition-transform duration-75 shrink-0"
        >
          <Settings className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-72 p-4 space-y-2"
      >
        {/* Main toggle */}
        <div role="radiogroup" aria-label="View type" className="grid grid-cols-2 gap-1">
          <button
            type="button"
            role="radio"
            aria-checked={isMusicNotes}
            aria-disabled={musicNotesBlocked ? 'true' : undefined}
            data-settings-main="music-notes"
            id="settings-tab-music-notes"
            aria-controls="settings-panel-music-notes"
            title={musicNotesBlocked ? 'No staff or solfège notation available for this tune' : undefined}
            onClick={handleMainMusicNotes}
            className={[
              'h-10 rounded-md text-sm font-semibold active:scale-[0.95] transition-[transform,background,color] duration-75 motion-reduce:transition-none',
              musicNotesBlocked && 'opacity-40',
              isMusicNotes
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground',
            ].join(' ')}
          >
            Music Notes
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!isMusicNotes}
            data-settings-main="lyrics-only"
            id="settings-tab-lyrics-only"
            onClick={() => onViewModeChange('lyrics')}
            className={[
              'h-10 rounded-md text-sm font-semibold active:scale-[0.95] transition-[transform,background,color] duration-75 motion-reduce:transition-none',
              !isMusicNotes
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground',
            ].join(' ')}
          >
            Lyrics Only
          </button>
        </div>

        {/* Sub-toggles — always rendered so the user can pick Notation / Layout
            directly even from Lyrics Only (issue #59, point 3). Tapping Notation
            or Layout from Lyrics Only switches into the corresponding Music Notes
            view with the last-selected layout remembered in localStorage (the
            same `psalter-score-mode-last-music` key the top-level Music Notes
            button reads). */}
        <div
          role="region"
          id="settings-panel-music-notes"
          aria-labelledby="settings-tab-music-notes"
          className="rounded-md border border-border/40 p-2 space-y-2"
        >
          <span className="sr-only">Music notation settings (Notation, Layout)</span>
          {/* Sub-toggle A: Notation type */}
            <div role="radiogroup" aria-label="Notation type" data-settings-sub="notation">
              <span className="text-xs text-muted-foreground">Notation:</span>
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!inLyricsOnly && isStaff}
                  aria-label="Staff"
                  onClick={() => handleNotationChange('staff')}
                  aria-disabled={!staffAvailable ? 'true' : undefined}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    !staffAvailable && 'opacity-40 cursor-not-allowed',
                    notationStaffActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <Music className="h-4 w-4" />
                  <span className="text-xs font-medium">Staff</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!inLyricsOnly && !isStaff}
                  aria-label="Solfege"
                  onClick={() => handleNotationChange('solfege')}
                  aria-disabled={!solfegeSplitAvailable ? 'true' : undefined}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    !solfegeSplitAvailable && 'opacity-40 cursor-not-allowed',
                    notationSolfegeActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <span className="text-[10px] font-mono tracking-tight leading-none">d r m</span>
                  <span className="text-xs font-medium">Solfege</span>
                </button>
              </div>
            </div>

            {/* Sub-toggle B: Layout */}
            <div role="radiogroup" aria-label="Layout" data-settings-sub="layout">
              <span className="text-xs text-muted-foreground">Layout:</span>
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!inLyricsOnly && !isSplit}
                  aria-label="Inline"
                  title={inlineLayoutDisabledTitle}
                  onClick={() => handleLayoutChange('inline')}
                  aria-disabled={inlineLayoutDisabledEffective ? 'true' : undefined}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    inlineLayoutDisabledEffective && 'opacity-40 cursor-not-allowed',
                    layoutInlineActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <Rows2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Inline</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!inLyricsOnly && isSplit}
                  aria-label="Split-Leaf"
                  onClick={() => handleLayoutChange('split-leaf')}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    layoutSplitActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <Columns2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Split-Leaf</span>
                </button>
              </div>
            </div>

            {/* Sub-toggle C: Score source (quick 260822-di9) — HIDDEN 2026-09-05.
                Staff split-leaf now ALWAYS renders the scanned JPG
                (forceStaffJpgFallback in NotationRenderer.tsx routes to
                renderScannedPages), so a "Digital | Original scan" toggle
                would have no effect — every staff-split view IS the scan.
                Kept verbatim for easy re-activation when/if digital split-leaf
                comes back. See [[project-staff-split-leaf-disabled]]. */}
            {false && showScoreSourceRow && (
              <div role="radiogroup" aria-label="Score source" data-settings-sub="score-source">
                <span className="text-xs text-muted-foreground">Score:</span>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!showOriginal}
                    aria-label="Digital"
                    onClick={() => onShowOriginalChange(false)}
                    className={[
                      'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                      !showOriginal
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    <Music className="h-4 w-4" />
                    <span className="text-xs font-medium">Digital</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={showOriginal}
                    aria-label="Original scan"
                    onClick={() => onShowOriginalChange(true)}
                    className={[
                      'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                      showOriginal
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    <ScanLine className="h-4 w-4" />
                    <span className="text-xs font-medium">Original scan</span>
                  </button>
                </div>
              </div>
            )}

        </div>

        <Separator className="my-2" />

        <button
          type="button"
          data-settings-study
          role="button"
          aria-label="Open full study view"
          className="flex items-center gap-3 w-full h-10 px-3 rounded-md text-sm font-normal text-left text-muted-foreground hover:bg-muted active:scale-[0.95] transition-[transform,background] duration-75 motion-reduce:transition-none"
          onClick={handleStudy}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Study</span>
        </button>

        <button
          type="button"
          data-restart-tour
          role="button"
          aria-label="Restart the onboarding tour"
          className="flex items-center gap-3 w-full h-10 px-3 rounded-md text-sm font-normal text-left text-muted-foreground hover:bg-muted active:scale-[0.95] transition-[transform,background] duration-75 motion-reduce:transition-none"
          onClick={handleRestartTour}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>Restart tour</span>
        </button>
      </PopoverContent>
    </Popover>
  )
}
