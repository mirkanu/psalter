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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (m: ViewMode) => void
  studyHref: string
  onRestartTour: () => void
  showLyricsOption: boolean
  /** Whether Staff notation is available (has approved ABC). */
  staffAvailable: boolean
  /** Whether Solfege notation is available (has approved solfege data). */
  solfegeAvailable: boolean
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
  solfegeAvailable,
}: Props) {
  const router = useRouter()

  const isMusicNotes = viewMode !== 'lyrics'
  const isStaff = viewMode === 'staff' || viewMode === 'staff-split'
  const isSplit = viewMode === 'staff-split' || viewMode === 'solfege-split'

  const handleNotationChange = (notation: 'staff' | 'solfege') => {
    if (notation === 'staff' && !staffAvailable) {
      toast('Coming soon', { description: 'Staff notation for this tune is not yet available' })
      return
    }
    if (notation === 'solfege' && !solfegeAvailable) {
      toast('Coming soon', { description: 'Solfege notation for this tune is not yet available' })
      return
    }
    const newMode: ViewMode = isSplit
      ? (notation === 'staff' ? 'staff-split' : 'solfege-split')
      : (notation === 'staff' ? 'staff' : 'solfege')
    onViewModeChange(newMode)
  }

  const handleLayoutChange = (layout: 'inline' | 'split-leaf') => {
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
      onViewModeChange(stored as ViewMode)
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
                  disabled={!solfegeAvailable}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
                    !solfegeAvailable && 'opacity-40 cursor-not-allowed',
                    !isStaff && solfegeAvailable
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
                  onClick={() => handleLayoutChange('inline')}
                  className={[
                    'h-8 inline-flex items-center gap-1.5 px-2 rounded-md text-sm active:scale-[0.90] transition-[transform,background,color] duration-75',
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
