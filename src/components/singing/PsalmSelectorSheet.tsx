'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PsalmListingGrid, type PsalmRow } from '@/components/PsalmListingGrid'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  psalms: PsalmRow[]
}

export function PsalmSelectorSheet({ open, onOpenChange, psalms }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-psalm-selector-sheet
        className="h-[90dvh] max-h-[90dvh] flex flex-col"
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Jump to psalm</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-4">
          <PsalmListingGrid psalms={psalms} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
