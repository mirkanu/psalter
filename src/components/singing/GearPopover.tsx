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
  FileImage,
  Columns2,
  Rows2,
  BookOpen,
  HelpCircle,
  Settings,
} from 'lucide-react'
import type { ViewMode } from '@/components/notation/NotationRenderer'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (m: ViewMode) => void
  /** Current layout flag ('split-leaf' | 'inline'); defaults to 'inline'. */
  layout: 'split-leaf' | 'inline'
  onLayoutChange: (l: 'split-leaf' | 'inline') => void
  studyHref: string
  onRestartTour: () => void
  /** True ONLY on psalm pages. When false the Layout sub-toggle is hidden. */
  showLayoutToggle: boolean
  showLyricsOption: boolean
}

export function GearPopover({
  open,
  onOpenChange,
  viewMode,
  onViewModeChange,
  layout,
  onLayoutChange,
  studyHref,
  onRestartTour,
  showLayoutToggle,
  showLyricsOption,
}: Props) {
  const router = useRouter()

  const isMusicNotes = viewMode === 'staff' || viewMode === 'solfege'

  const applyMainMusicNotes = () => {
    if (!isMusicNotes) onViewModeChange('staff')
  }

  const handleRestartTour = () => {
    onOpenChange(false)
    // Small delay so the popover close animation completes before the tour overlay paints.
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
        {/* Main toggle (radio, mutually exclusive) */}
        <div role="radiogroup" aria-label="View type" className="grid grid-cols-2 gap-1">
          <button
            type="button"
            role="radio"
            aria-checked={isMusicNotes}
            data-settings-main="music-notes"
            onClick={applyMainMusicNotes}
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

        {/* Sub-toggles (conditional, only in Music Notes) */}
        <div
          className="transition-opacity duration-100 motion-reduce:transition-none"
          style={{
            opacity: isMusicNotes ? 1 : 0,
            pointerEvents: isMusicNotes ? 'auto' : 'none',
          }}
        >
          {/* Sub-toggle A: Notation type */}
          <div role="radiogroup" aria-label="Notation type" data-settings-sub="notation">
            <span className="text-xs text-muted-foreground">Notation:</span>
            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'staff'}
                aria-label="Staff"
                onClick={() => onViewModeChange('staff')}
                className={[
                  'h-8 w-8 inline-flex items-center justify-center rounded-md active:scale-[0.90] transition-transform duration-75',
                  viewMode === 'staff'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted',
                ].join(' ')}
              >
                <Music className="h-4 w-4" />
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'solfege'}
                aria-label="Solfège"
                onClick={() => onViewModeChange('solfege')}
                className={[
                  'h-8 w-8 inline-flex items-center justify-center rounded-md active:scale-[0.90] transition-transform duration-75',
                  viewMode === 'solfege'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted',
                ].join(' ')}
              >
                <FileImage className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sub-toggle B: Layout (psalm pages only) */}
          {showLayoutToggle && (
            <div role="radiogroup" aria-label="Layout" data-settings-sub="layout" className="mt-2">
              <span className="text-xs text-muted-foreground">Layout:</span>
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  role="radio"
                  aria-checked={layout === 'split-leaf'}
                  aria-label="Split-leaf"
                  onClick={() => onLayoutChange('split-leaf')}
                  className={[
                    'h-8 w-8 inline-flex items-center justify-center rounded-md active:scale-[0.90] transition-transform duration-75',
                    layout === 'split-leaf'
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <Columns2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={layout === 'inline'}
                  aria-label="Inline"
                  onClick={() => onLayoutChange('inline')}
                  className={[
                    'h-8 w-8 inline-flex items-center justify-center rounded-md active:scale-[0.90] transition-transform duration-75',
                    layout === 'inline'
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <Rows2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator between toggle block and action buttons */}
        <Separator className="my-2" />

        {/* Study button */}
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

        {/* Restart tour button */}
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
