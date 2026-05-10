'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface PsalmOption {
  id: number
  bibleTitle: string | null
}

interface SelectPsalmDialogProps {
  open: boolean
  onClose: () => void
  psalms: PsalmOption[]
  meter: string | null
}

export function SelectPsalmDialog({ open, onClose, psalms, meter }: SelectPsalmDialogProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const filtered = query.trim()
    ? psalms.filter((p) =>
        String(p.id).includes(query) ||
        (p.bibleTitle ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : psalms

  function handleSelect(psalmId: number) {
    onClose()
    setQuery('')
    router.push(`/psalms/${psalmId}`)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setQuery('') } }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Select a Psalm</DialogTitle>
          {meter && (
            <p className="text-sm text-muted-foreground">
              Showing psalms in <span className="font-medium">{meter}</span> meter
            </p>
          )}
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search psalms…"
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No psalms found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {filtered.map((psalm) => (
                <button
                  key={psalm.id}
                  type="button"
                  onClick={() => handleSelect(psalm.id)}
                  className="w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <span className="font-mono text-muted-foreground w-8 shrink-0">{psalm.id}</span>
                  <span className="font-medium truncate">{psalm.bibleTitle ?? `Psalm ${psalm.id}`}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
