'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface PsalmOption {
  id: number
  bibleTitle: string | null
  firstLine: string | null
  lyrics: string | null
}

interface SelectPsalmDialogProps {
  open: boolean
  onClose: () => void
  /** All psalms with matching meter */
  psalms: PsalmOption[]
  meter: string | null
  /** Psalm IDs that already use this tune — hidden by default, shown when searching */
  existingPsalmIds: Set<number>
  /** Tune ID to pre-select when landing on the psalm page */
  tuneId: number
}

export function SelectPsalmDialog({ open, onClose, psalms, meter, existingPsalmIds, tuneId }: SelectPsalmDialogProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const trimmed = query.trim()

  // Without a search query, hide psalms that already use this tune.
  // When searching, show all matches so the user can still navigate to them.
  const pool = trimmed ? psalms : psalms.filter((p) => !existingPsalmIds.has(p.id))

  const filtered = trimmed
    ? pool.filter((p) =>
        String(p.id).includes(trimmed) ||
        (p.bibleTitle ?? '').toLowerCase().includes(trimmed.toLowerCase()) ||
        (p.firstLine ?? '').toLowerCase().includes(trimmed.toLowerCase()) ||
        (p.lyrics ?? '').toLowerCase().includes(trimmed.toLowerCase())
      )
    : pool

  function handleSelect(psalmId: number) {
    onClose()
    setQuery('')
    router.push(`/psalms/${psalmId}?tune=${tuneId}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0].id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setQuery('') } }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Select different Psalm</DialogTitle>
          {meter && (
            <p className="text-sm text-muted-foreground">
              {meter} meter — psalms already using this tune are hidden (search to show all)
            </p>
          )}
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
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
                  <span className="font-medium truncate">{psalm.firstLine ?? psalm.bibleTitle ?? `Psalm ${psalm.id}`}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
