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
}: Props) {
  const router = useRouter()

  const isMusicNotes = viewMode !== 'lyrics'
  const isStaff = viewMode === 'staff' || viewMode === 'staff-split'
  const isSplit = viewMode === 'staff-split' || viewMode === 'solfege-split'
  const inlineLayoutDisabled = computeInlineLayoutDisabled({ isStaff, staffInlineApproved, solfegeInlineAvailable })

  const handleNotationChange = (notation: 'staff' | 'solfege') => {
    if (notation === 'staff' && !staffAvailable) {
      toast('Coming soon', { description: 'Staff notation for this tune is not yet available' })
      return
    }
    if (notation === 'solfege' && !solfegeSplitAvailable) {
      toast('Coming soon', { description: "Solfège isn't available for this tune" })
      return
    }
    const newMode: ViewMode =
      notation === 'solfege'
        ? 'solfege-split'                       // inline solfege never exists — always split
        : (isSplit ? 'staff-split' : 'staff')
    onViewModeChange(newMode)
  }

  const handleLayoutChange = (layout: 'inline' | 'split-leaf') => {
    if (layout === 'inline' && !isStaff && !solfegeInlineAvailable) {
      toast('Coming soon', { description: 'Inline Solfège notation is not yet available — Split-Leaf shows the scanned Solfège' })
      return
    }
    // Defensive guard — the button is already `disabled` in this state, but
    // this prevents a synthetic click event from bypassing the gate (MOBILE-08).
    if (layout === 'inline' && isStaff && !staffInlineApproved) {
      return
    }
    const newMode: ViewMode = isStaff
      ? (layout === 'split-leaf' ? 'staff-split' : 'staff')
      : (layout === 'split-leaf' ? 'solfege-split' : 'solfege')
    onViewModeChange(newMode)
  }

  const handleMainMusicNotes = () => {
    if (isMusicNotes) return
    // Restore last music mode — default to staff if nothing saved
    const stored = typeof window !== 'undefined' ? localStorage.getItem('psalter-score-mode') : null
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
            data-settings-main="music-notes"
            onClick={handleMainMusicNotes}
            className={[
              'h-10 rounded-md text-sm font-semibold active:scale-[0.95] transition-[transform,background,color] duration-75 motion-reduce:transition-none',
              isMusicNotes
                ? 'bg-foreground text-background'
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
            onClick={() => onViewModeChange('lyrics')}
            className={[
              'h-10 rounded-md text-sm font-semibold active:scale-[0.95] transition-[transform,background,color] duration-75 motion-reduce:transition-none',
              !isMusicNotes
                ? 'bg-foreground text-background'
                : 'hover:bg-muted text-muted-foreground',
            ].join(' ')}
          >
            Lyrics Only
          </button>
        </div>

        {/* Sub-toggles — only rendered when Music Notes is active (A1: no gap) */}
        {isMusicNotes && (
          <>
            {/* Sub-toggle A: Notation type */}
            <div role="radiogroup" aria-label="Notation type" data-settings-sub="notation">
              <span className="text-xs text-muted-foreground">Notation:</span>
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  role="radio"
                  aria-checked={isStaff}
                  aria-label="Staff"
                  onClick={() => handleNotationChange('staff')}
                  disabled={!staffAvailable}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    !staffAvailable && 'opacity-40 cursor-not-allowed',
                    isStaff && staffAvailable
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
                  aria-checked={!isStaff}
                  aria-label="Solfege"
                  onClick={() => handleNotationChange('solfege')}
                  disabled={!solfegeSplitAvailable}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    !solfegeSplitAvailable && 'opacity-40 cursor-not-allowed',
                    !isStaff && solfegeSplitAvailable
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
                  aria-checked={!isSplit}
                  aria-label="Inline"
                  title={isStaff ? "Inline Staff notation isn't approved for this tune yet" : "Inline Solfège coming soon"}
                  onClick={() => handleLayoutChange('inline')}
                  disabled={inlineLayoutDisabled}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    inlineLayoutDisabled && 'opacity-40 cursor-not-allowed',
                    !isSplit
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
                  aria-checked={isSplit}
                  aria-label="Split-Leaf"
                  onClick={() => handleLayoutChange('split-leaf')}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    isSplit
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <Columns2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Split-Leaf</span>
                </button>
              </div>
            </div>
          </>
        )}

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
