'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PsalmPickerModal } from '@/components/precent/PsalmPickerModal'
import { TunePickerModal } from '@/components/precent/TunePickerModal'
import { SetItemsSortableList } from '@/components/precent/SetItemsSortableList'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import type { TuneRow } from '@/components/TuneTable'

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
  createdAt: string
  updatedAt: string
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

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function SetDetail({ set, psalmListRows, allTunes, psalmMeterById }: SetDetailProps) {
  const router = useRouter()

  // Build psalm → recommended tune name map for display fallback
  const recommendedTuneByPsalmId: Record<number, string | null> = {}
  for (const row of psalmListRows) {
    if (!(row.id in recommendedTuneByPsalmId)) {
      recommendedTuneByPsalmId[row.id] = row.recommendedTune ?? null
    }
  }
  const [psalmPickerOpen, setPsalmPickerOpen] = useState(false)
  const [psalmPickerMode, setPsalmPickerMode] = useState<'add' | 'change'>('add')
  const [psalmPickerItemId, setPsalmPickerItemId] = useState<number | null>(null)
  const [tunePickerOpen, setTunePickerOpen] = useState(false)
  const [tunePickerItemId, setTunePickerItemId] = useState<number | null>(null)
  const [tunePickerPsalmMeter, setTunePickerPsalmMeter] = useState<string | null>(null)

  // Inline note edit state
  const [editing, setEditing] = useState(false)
  const [editNote, setEditNote] = useState(set.note ?? '')
  const [saving, setSaving] = useState(false)

  // Edit date/type dialog state
  const [editMetaOpen, setEditMetaOpen] = useState(false)
  const [editDate, setEditDate] = useState<Date | undefined>(() => {
    const d = new Date(set.date + 'T00:00:00')
    return isNaN(d.getTime()) ? undefined : d
  })
  const [editType, setEditType] = useState<string>(set.type)
  const [savingMeta, setSavingMeta] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleAddPsalm({ psalmId, verseRange }: { psalmId: number; verseRange: string | null }) {
    if (psalmPickerMode === 'change' && psalmPickerItemId != null) {
      await fetch(`/api/precent/${set.id}/items/${psalmPickerItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psalmId }),
      })
    } else {
      await fetch(`/api/precent/${set.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psalmId, verseRange }),
      })
    }
    router.refresh()
  }

  function handlePsalmClick(item: SetItemView) {
    setPsalmPickerMode('change')
    setPsalmPickerItemId(item.id)
    setPsalmPickerOpen(true)
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

  async function handleSaveMeta() {
    if (!editDate) return
    setSavingMeta(true)
    const yyyy = editDate.getFullYear()
    const mm = String(editDate.getMonth() + 1).padStart(2, '0')
    const dd = String(editDate.getDate()).padStart(2, '0')
    await fetch(`/api/precent/${set.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: `${yyyy}-${mm}-${dd}`, type: editType }),
    })
    setSavingMeta(false)
    setEditMetaOpen(false)
    router.refresh()
  }

  async function handleDeleteSet() {
    setDeleting(true)
    await fetch(`/api/precent/${set.id}`, { method: 'DELETE' })
    router.push('/precent')
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
          {/* Metadata */}
          <p className="text-xs text-muted-foreground mt-2">
            Created: {formatDateTime(set.createdAt)} · Last modified: {formatDateTime(set.updatedAt)}
          </p>
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditMetaOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              aria-label="Edit date and type"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
              aria-label="Delete set"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Separator className="mt-6 mb-4" />

      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => { setPsalmPickerMode('add'); setPsalmPickerItemId(null); setPsalmPickerOpen(true) }}
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
          allPsalms={psalmListRows}
          psalmMeterById={psalmMeterById}
          recommendedTuneByPsalmId={recommendedTuneByPsalmId}
          onTuneClick={handleTuneClick}
          onPsalmClick={handlePsalmClick}
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

      {/* Edit Date & Type Dialog */}
      <Dialog open={editMetaOpen} onOpenChange={(o) => { if (!o) setEditMetaOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Set Details</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {editDate
                      ? editDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={(d) => setEditDate(d ?? undefined)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select value={editType} onValueChange={(v) => setEditType(v ?? set.type)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM Service">AM Service</SelectItem>
                  <SelectItem value="PM Service">PM Service</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditMetaOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMeta} disabled={savingMeta || !editDate}>
              {savingMeta ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { if (!o) setDeleteOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this set?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove all items in this precenting set. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSet} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete Set'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
