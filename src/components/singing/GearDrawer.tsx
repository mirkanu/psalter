'use client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Music, AlignLeft, FileImage } from 'lucide-react'
import { MetadataPanel } from './MetadataPanel'
import type { PsalmDetail } from '@/db/queries/psalms'
import type { ViewMode } from '@/components/notation/NotationRenderer'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  psalm: PsalmDetail
  meter: string | null
  studyHref: string
  viewMode: ViewMode
  onViewModeChange: (m: ViewMode) => void
  showLyricsOption: boolean
}

type IconType = typeof Music

const VIEW_OPTIONS: { mode: ViewMode; label: string; Icon: IconType }[] = [
  { mode: 'staff', label: 'Staff', Icon: Music },
  { mode: 'lyrics', label: 'Lyrics only', Icon: AlignLeft },
  { mode: 'solfege', label: 'Solfège', Icon: FileImage },
]

/**
 * GearDrawer — controlled Sheet (side="bottom") opened from the GlassBottomBar
 * gear button (UI-SPEC §D). Contains two sections — View + About this psalm —
 * separated by a Separator. NO audio controls live here (audio belongs in
 * PlayMiniBar).
 */
export function GearDrawer({
  open,
  onOpenChange,
  psalm,
  meter,
  studyHref,
  viewMode,
  onViewModeChange,
  showLyricsOption,
}: Props) {
  const handleViewSelect = (mode: ViewMode) => {
    onViewModeChange(mode)
    // Brief delay so the user perceives the active-state register before close (UI-SPEC §Interaction).
    setTimeout(() => onOpenChange(false), 120)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-gear-drawer
        className="max-h-[60dvh] flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Section 1 — View */}
          <section role="radiogroup" aria-label="View mode">
            <h3 className="text-base font-semibold mb-2">View</h3>
            <div className="grid grid-cols-1 gap-1">
              {VIEW_OPTIONS.filter((o) => o.mode !== 'lyrics' || showLyricsOption).map(
                ({ mode, label, Icon }) => {
                  const isActive = viewMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      data-view-option={mode}
                      onClick={() => handleViewSelect(mode)}
                      className={[
                        'flex items-center gap-3 w-full h-11 min-h-11 px-3 rounded-md text-base font-semibold text-left',
                        'active:scale-[0.99] transition-transform motion-reduce:transition-none',
                        isActive ? 'bg-foreground text-background' : 'hover:bg-muted',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  )
                },
              )}
            </div>
          </section>

          <Separator />

          {/* Section 2 — About this psalm */}
          <section>
            <h3 className="text-base font-semibold mb-3">About this psalm</h3>
            <MetadataPanel psalm={psalm} meter={meter} studyHref={studyHref} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
