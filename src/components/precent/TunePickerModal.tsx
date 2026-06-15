'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TuneGrid, type TuneRow } from '@/components/TuneGrid'

interface TunePickerModalProps {
  open: boolean
  onClose: () => void
  tunes: TuneRow[]
  psalmMeter: string | null
  onSelect: (tune: TuneRow) => void | Promise<void>
}

export function TunePickerModal({
  open,
  onClose,
  tunes,
  psalmMeter,
  onSelect,
}: TunePickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Tune</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Meter pre-filtered to {psalmMeter ?? '—'} — you can change this
          </p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          <TuneGrid
            tunes={tunes}
            initialMeter={psalmMeter ?? undefined}
            onSelectTune={(t) => { onSelect(t); onClose() }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
