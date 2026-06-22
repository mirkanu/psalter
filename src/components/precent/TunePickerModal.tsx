'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TuneTable, type TuneRow } from '@/components/TuneTable'

interface TunePickerModalProps {
  open: boolean
  onClose: () => void
  tunes: TuneRow[]
  psalmMeter?: string | null
  psalmId?: number | null
  onSelect: (tune: TuneRow) => void | Promise<void>
}

export function TunePickerModal({
  open,
  onClose,
  tunes,
  psalmMeter,
  psalmId,
  onSelect,
}: TunePickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Tune</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 min-h-0">
          <TuneTable
            tunes={tunes}
            onSelectTune={(t) => { onSelect(t); onClose() }}
            hideExport
            initialMeter={psalmMeter}
            hideMeterFilter
            psalmId={psalmId ?? undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
