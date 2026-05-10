'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { AlternateTune } from '@/db/queries/tunes'

interface ChangeTuneDialogProps {
  open: boolean
  onClose: () => void
  currentTuneId: number | null
  tunes: AlternateTune[]
  meter: string | null
  onSelect: (tune: AlternateTune) => void
}

export function ChangeTuneDialog({ open, onClose, currentTuneId, tunes, meter, onSelect }: ChangeTuneDialogProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? tunes.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : tunes

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
            <div className="grid grid-cols-1 gap-1">
              {filtered.map((tune) => {
                const isSelected = tune.id === currentTuneId
                return (
                  <button
                    key={tune.id}
                    type="button"
                    onClick={() => handleSelect(tune)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium truncate">{tune.name}</span>
                    {tune.meter && (
                      <Badge variant={isSelected ? 'outline' : 'secondary'} className="text-xs shrink-0">
                        {tune.meter}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
