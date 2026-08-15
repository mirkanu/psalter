'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TuneTable, type TuneRow } from '@/components/TuneTable'
import { TieredTuneRowList, type TieredRowTune } from '@/components/tune-picker/TieredTuneRowList'
import type { AlternateTune, PsalmVersionTuneTiers } from '@/db/queries/tunes'

/**
 * Shared tune-picker modal (TPAGE-01, Phase 16-01).
 *
 * Replaces two previously-separate modals:
 *   - `src/components/ChangeTuneDialog.tsx` (study-tab surface, compact list)
 *   - `src/components/precent/TunePickerModal.tsx` (precentor surface, full table)
 *
 * Both surfaces now call this single component with a `useTable` flag:
 *   - `useTable=false` (default): study-tab style — tiny Dialog, search input, TieredTuneRowList.
 *   - `useTable=true`: precentor style — full-width Dialog, TuneTable inside.
 *
 * The `tunes` prop is the union of both existing call-site types. Both `AlternateTune` and `TuneRow`
 * satisfy the `TieredRowTune` constraint (`id`, `name`), so Mode B's TieredTuneRowList typechecks
 * without a cast. Mode A forwards the same array to TuneTable via a cast — TuneTable's prop is more
 * specific, but the runtime values are unions of those types and the call sites already pass the
 * correct concrete type.
 *
 * Type-narrowing: the `onSelect` callback is typed as
 * `(tune: AlternateTune & TuneRow) => void | Promise<void>` (full intersection, not `Partial`) so
 * both call-site signatures (Mode A: `(tune: TuneRow) => void | Promise<void>`; Mode B:
 * `(tune: AlternateTune) => void`) are contravariantly assignable — the intersection type is
 * structurally assignable to each individual member type, which is what function-parameter
 * contravariance requires. `Partial<TuneRow>` was tried first but fails: several `TuneRow` fields
 * are non-optional, so `AlternateTune & Partial<TuneRow>` is NOT assignable to plain `TuneRow`,
 * breaking the `SetDetail` call site (`handleSelectTune: (tune: TuneRow) => Promise<void>`).
 */
export interface TunePickerDialogProps {
  open: boolean
  onClose: () => void
  /** Union of AlternateTune and TuneRow — both share {@link TieredRowTune} bounds. */
  tunes: readonly (AlternateTune | TuneRow)[]
  /** Optional precentor-only extras. Ignored in Mode B (study-tab). */
  psalmMeter?: string | null
  psalmId?: number | null
  /** Optional tiered grouping. Optional in both modes (null = no tier data, all 'other'). */
  tuneTiers?: PsalmVersionTuneTiers | null
  /** Highlight the currently-active tune in the picker (Mode B only). */
  currentTuneId?: number | null
  onSelect: (tune: AlternateTune & TuneRow) => void | Promise<void>
  /**
   * `false` (default) = study-tab compact list.
   * `true` = precentor full table (TuneTable inside).
   */
  useTable?: boolean
}

export function TunePickerDialog({
  open,
  onClose,
  tunes,
  psalmMeter,
  psalmId,
  tuneTiers,
  currentTuneId,
  onSelect,
  useTable = false,
}: TunePickerDialogProps) {
  // Mode A — precentor surface: full TuneTable inside a wide Dialog.
  if (useTable) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Select Tune</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0">
            <TuneTable
              tunes={tunes as TuneRow[]}
              onSelectTune={(t) => { onSelect(t as AlternateTune & TuneRow); onClose() }}
              hideExport
              initialMeter={psalmMeter}
              hideMeterFilter
              psalmId={psalmId ?? undefined}
              tuneTiers={tuneTiers}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Mode B — study-tab surface: compact Dialog with search + TieredTuneRowList.
  return <StudyTabMode
    open={open}
    onClose={onClose}
    tunes={tunes}
    tuneTiers={tuneTiers}
    currentTuneId={currentTuneId}
    onSelect={onSelect}
  />
}

interface StudyTabModeProps {
  open: boolean
  onClose: () => void
  tunes: readonly (AlternateTune | TuneRow)[]
  tuneTiers?: PsalmVersionTuneTiers | null
  currentTuneId?: number | null
  onSelect: (tune: AlternateTune & TuneRow) => void | Promise<void>
}

function StudyTabMode({
  open,
  onClose,
  tunes,
  tuneTiers,
  currentTuneId,
  onSelect,
}: StudyTabModeProps) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q
    ? tunes.filter((t) => (t.name ?? '').toLowerCase().includes(q))
    : tunes

  function handleSelect(tune: AlternateTune & TuneRow) {
    onSelect(tune)
    onClose()
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Select a Tune</DialogTitle>
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
            <TieredTuneRowList<(AlternateTune | TuneRow) & TieredRowTune>
              tunes={filtered as ((AlternateTune | TuneRow) & TieredRowTune)[]}
              tuneTiers={tuneTiers}
              currentTuneId={currentTuneId}
              renderRow={({ tune, isCurrent }) => (
                <button
                  type="button"
                  onClick={() => handleSelect(tune as AlternateTune & TuneRow)}
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
