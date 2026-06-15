'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { PsalmPickerModal } from '@/components/precent/PsalmPickerModal'
import { TunePickerModal } from '@/components/precent/TunePickerModal'
import { SetItemsSortableList } from '@/components/precent/SetItemsSortableList'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import type { TuneRow } from '@/components/TuneGrid'

export interface SetItemView {
  id: number
  setId: number
  psalmId: number
  tuneId: number | null
  verseRange: string | null
  position: number
  psalm: { id: number; bibleTitle: string | null } | null
  tune: { id: number; name: string; meter: string | null } | null
}

interface SerializedSet {
  id: number
  date: string
  type: string
  note: string | null
  precentorName: string
  setItems: SetItemView[]
}

interface SetDetailProps {
  set: SerializedSet
  psalmListRows: PsalmRow[]
  allTunes: TuneRow[]
  psalmMeterById: Record<number, string | null>
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function SetDetail({ set, psalmListRows, allTunes, psalmMeterById }: SetDetailProps) {
  const router = useRouter()
  const [psalmPickerOpen, setPsalmPickerOpen] = useState(false)
  const [tunePickerOpen, setTunePickerOpen] = useState(false)
  const [tunePickerItemId, setTunePickerItemId] = useState<number | null>(null)
  const [tunePickerPsalmMeter, setTunePickerPsalmMeter] = useState<string | null>(null)

  // Inline edit state
  const [editing, setEditing] = useState(false)
  const [editNote, setEditNote] = useState(set.note ?? '')
  const [saving, setSaving] = useState(false)

  async function handleAddPsalm({ psalmId, verseRange }: { psalmId: number; verseRange: string | null }) {
    await fetch(`/api/precent/${set.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ psalmId, verseRange }),
    })
    router.refresh()
  }

  function handleTuneClick(item: SetItemView) {
    setTunePickerItemId(item.id)
    setTunePickerPsalmMeter(psalmMeterById[item.psalmId] ?? null)
    setTunePickerOpen(true)
  }

  async function handleSelectTune(tune: TuneRow) {
    if (tunePickerItemId == null) return
    await fetch(`/api/precent/${set.id}/items/${tunePickerItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tuneId: tune.id }),
    })
    router.refresh()
  }

  async function handleSaveNote() {
    setSaving(true)
    await fetch(`/api/precent/${set.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: editNote.trim() || null }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header card */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Psalm Set for Precenting</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{set.type} — {formatDate(set.date)} · Precentor: {set.precentorName}</p>
          {!editing && (
            <p className="text-sm text-muted-foreground mt-1">
              {set.note ?? <span className="italic">No notes</span>}
            </p>
          )}
          {editing && (
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Add a note for this set…"
                className="max-w-xs text-sm"
                maxLength={500}
              />
              <Button
                size="sm"
                variant="default"
                onClick={handleSaveNote}
                disabled={saving}
                aria-label="Save note"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditing(false); setEditNote(set.note ?? '') }}
                aria-label="Cancel edit"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            aria-label="Edit note"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <Separator className="mt-6 mb-4" />

      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setPsalmPickerOpen(true)}
          className="active:scale-[0.97] transition-transform duration-75"
        >
          Add Psalm
        </Button>
        <Button
          disabled={set.setItems.length === 0}
          onClick={() => router.push(`/precent/${set.id}/sing/1`)}
          className="bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 active:scale-[0.97] transition-transform duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Precenting
        </Button>
      </div>

      {/* Empty state */}
      {set.setItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-base font-medium">No psalms added</p>
          <p className="text-sm mt-1">Press &lsquo;Add Psalm&rsquo; to build your service set.</p>
        </div>
      ) : (
        <SetItemsSortableList
          setId={set.id}
          items={set.setItems}
          allTunes={allTunes}
          psalmMeterById={psalmMeterById}
          onTuneClick={handleTuneClick}
        />
      )}

      <PsalmPickerModal
        open={psalmPickerOpen}
        onClose={() => setPsalmPickerOpen(false)}
        psalms={psalmListRows}
        onAdd={handleAddPsalm}
      />

      <TunePickerModal
        open={tunePickerOpen}
        onClose={() => setTunePickerOpen(false)}
        tunes={allTunes}
        psalmMeter={tunePickerPsalmMeter}
        onSelect={handleSelectTune}
      />
    </div>
  )
}
