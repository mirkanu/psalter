'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, XCircle, ClipboardPaste } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import { parsePsalmList } from '@/lib/parse-psalm-list'
import type { ParsedPsalmEntry as ParsedEntry } from '@/lib/parse-psalm-list'

interface PastePsalmsDialogProps {
  open: boolean
  onClose: () => void
  psalms: PsalmRow[]
  onAddBatch: (items: Array<{ psalmId: number; verseRange: string | null }>) => Promise<void>
}

export function PastePsalmsDialog({ open, onClose, psalms, onAddBatch }: PastePsalmsDialogProps) {
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)

  const entries = useMemo(() => (text.trim() ? parsePsalmList(text, psalms) : []), [text, psalms])
  const validEntries = entries.filter((e) => e.psalm !== null)
  const hasErrors = entries.some((e) => e.psalm === null)

  async function handleAdd() {
    if (validEntries.length === 0) return
    setAdding(true)
    await onAddBatch(
      validEntries.map((e) => ({ psalmId: e.psalm!.id, verseRange: e.verseRange })),
    )
    setAdding(false)
    setText('')
    onClose()
  }

  function handleClose() {
    setText('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="h-4 w-4" />
            Paste Psalm List
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Paste a list of psalms with verse ranges, e.g.{' '}
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              11:1-7; 24:1-5; 55:4-11
            </span>
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="11:1-7; 24:1-5; 55:4-11; 72:9-14"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />

          {entries.length > 0 && (
            <ul className="flex flex-col gap-1">
              {entries.map((entry, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {entry.psalm ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <span className={entry.psalm ? 'text-foreground' : 'text-destructive'}>
                    Psalm {entry.psalmNum}
                    {entry.verseRange && ` vv. ${entry.verseRange}`}
                    {!entry.psalm && ' — not found'}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {hasErrors && (
            <p className="text-xs text-muted-foreground">
              Unrecognised psalms will be skipped.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={adding}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={adding || validEntries.length === 0}
            className="active:scale-[0.97] transition-transform duration-75"
          >
            {adding
              ? 'Adding…'
              : validEntries.length === 0
              ? 'Add Psalms'
              : `Add ${validEntries.length} Psalm${validEntries.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
