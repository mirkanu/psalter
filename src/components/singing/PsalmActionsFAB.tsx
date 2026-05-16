'use client'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Menu, Music, AlignLeft, FileImage } from 'lucide-react'
import { AbcAudioControls } from './AbcAudioControls'
import { MetadataPanel } from './MetadataPanel'
import type { PsalmDetail } from '@/db/queries/psalms'
import type { ViewMode } from '@/components/notation/NotationRenderer'

interface Props {
  psalm: PsalmDetail
  meter: string | null
  studyHref: string
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  abcForAudio: string | null
}

const VIEW_OPTIONS: { mode: ViewMode; label: string; icon: typeof Music }[] = [
  { mode: 'staff', label: 'Staff', icon: Music },
  { mode: 'lyrics', label: 'Lyrics only', icon: AlignLeft },
  { mode: 'solfege', label: 'Solfège', icon: FileImage },
]

export function PsalmActionsFAB({
  psalm,
  meter,
  studyHref,
  viewMode,
  onViewModeChange,
  abcForAudio,
}: Props) {
  const [open, setOpen] = useState(false)

  const handleViewSelect = (mode: ViewMode) => {
    onViewModeChange(mode)
    // Auto-close 120ms after selection so user sees the active-state register (UI-SPEC §Interaction).
    setTimeout(() => setOpen(false), 120)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            data-singing-fab
            aria-label="Open psalm actions"
            className="fixed right-4 z-40 h-14 w-14 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center active:scale-95 transition-transform motion-reduce:transition-none"
            style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <Menu className="h-5 w-5" />
          </button>
        }
      />
      <SheetContent
        side="bottom"
        data-singing-fab-sheet
        className="max-h-[80dvh] flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Psalm actions</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
          {/* Section A — View */}
          <section role="radiogroup" aria-label="View mode">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              View
            </h3>
            <div className="grid grid-cols-1 gap-1">
              {VIEW_OPTIONS.map(({ mode, label, icon: Icon }) => {
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
                      isActive
                        ? 'bg-foreground text-background'
                        : 'hover:bg-muted',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
            {/* UAT v6: Size (A−/A+) buttons moved out of FAB onto the main
                canvas chrome (NotationRenderer chromelessSizeNav). Users —
                especially on mobile — now see the size change immediately. */}
          </section>

          {/* Section B — Audio (conditional) */}
          {abcForAudio && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Audio
                </h3>
                <AbcAudioControls abc={abcForAudio} label="Tune audio controls" />
              </section>
            </>
          )}

          {/* Section C — About this psalm */}
          <Separator />
          <section>
            <h3 className="text-xl font-semibold mb-3">About this psalm</h3>
            <MetadataPanel psalm={psalm} meter={meter} studyHref={studyHref} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
