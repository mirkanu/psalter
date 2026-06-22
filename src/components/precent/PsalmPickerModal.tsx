'use client'

import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PsalmListingGrid, type PsalmRow } from '@/components/PsalmListingGrid'

interface PsalmPickerModalProps {
  open: boolean
  onClose: () => void
  psalms: PsalmRow[]
  onAdd: (args: { psalmId: number; verseRange: string | null; psalmVersionId: number | null }) => void | Promise<void>
}

export function PsalmPickerModal({
  open,
  onClose,
  psalms,
  onAdd,
}: PsalmPickerModalProps) {
  const [selected, setSelected] = useState<PsalmRow | null>(null)
  const [verseRange, setVerseRange] = useState('')

  function reset() {
    setSelected(null)
    setVerseRange('')
  }

  function handleClose() {
    onClose()
    reset()
  }

  async function handleAdd() {
    if (!selected) return
    await onAdd({ psalmId: selected.id, verseRange: verseRange.trim() || null, psalmVersionId: selected.versionId ?? null })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Psalm</DialogTitle>
        </DialogHeader>

        {selected === null ? (
          <div className="overflow-y-auto flex-1 min-h-0">
            <PsalmListingGrid psalms={psalms} onSelect={(p) => setSelected(p)} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to psalms
            </button>

            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {selected.displayLabel}
                {selected.firstLine && (
                  <span className="ml-2 font-normal text-muted-foreground">{selected.firstLine}</span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="verse-range" className="text-sm font-medium">
                Verse range (optional)
              </label>
              <Input
                id="verse-range"
                value={verseRange}
                onChange={(e) => setVerseRange(e.target.value)}
                placeholder="Verses, e.g. 1–3 (leave blank for all)"
                maxLength={20}
              />
            </div>

            <Button
              variant="default"
              onClick={handleAdd}
              className="self-end active:scale-[0.97] transition-transform duration-75"
            >
              Add to Set
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
