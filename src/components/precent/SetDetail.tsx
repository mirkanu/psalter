'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { PastePsalmsDialog } from '@/components/precent/PastePsalmsDialog'
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

function smartDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7)
    return target.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
  return target.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function shortType(type: string): string {
  if (type === 'AM Service') return 'AM'
  if (type === 'PM Service') return 'PM'
  return type
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
  const [tunePickerPsalmId, setTunePickerPsalmId] = useState<number | null>(null)

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

  // Paste psalm list dialog
  const [pasteOpen, setPasteOpen] = useState(false)

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
    setTunePickerPsalmId(item.psalmId)
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
      body: JSON.stringify({ date: `${yyyy}-${mm}-${dd}`, type: editType, note: editNote.trim() || null }),
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

  async function handleAddBatch(items: Array<{ psalmId: number; verseRange: string | null }>) {
    for (const item of items) {
      await fetch(`/api/precent/${set.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
    }
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link href="/precent" className="hover:text-foreground transition-colors">
          Precent
        </Link>
        <span className="select-none">&rsaquo;</span>
        <span className="text-foreground font-medium">Psalm Set</span>
      </nav>

      {/* Header card */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{shortType(set.type)} — {smartDate(set.date)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Precentor: {set.precentorName}</p>
          {set.note && (
            <p className="text-sm text-muted-foreground mt-1">{set.note}</p>
          )}
        </div>
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
      </div>

      <Separator className="mt-6 mb-4" />

      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => { setPsalmPickerMode('add'); setPsalmPickerItemId(null); setPsalmPickerOpen(true) }}
            className="active:scale-[0.97] transition-transform duration-75"
          >
            Add Psalm
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPasteOpen(true)}
            className="active:scale-[0.97] transition-transform duration-75 text-muted-foreground"
          >
            Paste List
          </Button>
        </div>
        <Button
          disabled={set.setItems.length === 0}
          onClick={() => router.push(`/precent/${set.id}/sing/1`)}
          className="bg-green-100 text-green-900 hover:bg-green-200 border border-green-300 active:scale-[0.97] transition-transform duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
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
        psalmId={tunePickerPsalmId}
        onSelect={handleSelectTune}
      />

      <PastePsalmsDialog
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        psalms={psalmListRows}
        onAddBatch={handleAddBatch}
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
                    modifiers={{ sunday: (d) => d.getDay() === 0 }}
                    modifiersClassNames={{ sunday: 'text-red-600 font-semibold' }}
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
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Add a note for this set…"
                maxLength={500}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
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
