'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { AlternateTune, PsalmVersionTuneTiers } from '@/db/queries/tunes'
import { TieredTuneRowList } from '@/components/tune-picker/TieredTuneRowList'

interface ChangeTuneDialogProps {
  open: boolean
  onClose: () => void
  currentTuneId: number | null
  tunes: AlternateTune[]
  meter: string | null
  tuneTiers?: PsalmVersionTuneTiers
  onSelect: (tune: AlternateTune) => void
}

export function ChangeTuneDialog({ open, onClose, currentTuneId, tunes, meter, tuneTiers, onSelect }: ChangeTuneDialogProps) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? tunes.filter((t) => t.name.toLowerCase().includes(q)) : tunes

  function handleSelect(tune: AlternateTune) {
    onSelect(tune)
    onClose()
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Select a Tune</DialogTitle>
          {meter && (
            <p className="text-sm text-muted-foreground">
              Showing tunes in <span className="font-medium">{meter}</span> meter
            </p>
          )}
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tunes…"
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No tunes found.</p>
          ) : (
            <TieredTuneRowList
              tunes={filtered}
              tuneTiers={tuneTiers}
              currentTuneId={currentTuneId}
              renderRow={({ tune, isCurrent }) => (
                <button
                  type="button"
                  onClick={() => handleSelect(tune)}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center justify-between gap-2 ${
                    isCurrent ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <span className="font-medium truncate">{tune.name}</span>
                </button>
              )}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
