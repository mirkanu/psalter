'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, PlayCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SetItemView } from '@/components/precent/SetItemsSortableList'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import { isMeterMismatch } from '@/lib/meter-mismatch'
import { normaliseVerseRange, VERSE_RANGE_MAX_LENGTH } from '@/lib/set-verse-range'

interface SetItemRowProps {
  item: SetItemView
  index: number
  setId: number
  allPsalms: PsalmRow[]
  psalmMeter: string | null
  recommendedTune: string | null
  onDelete: (itemId: number) => void
  onTuneClick: (item: SetItemView) => void
  onPsalmClick: (item: SetItemView) => void
}

export function SetItemRow({
  item,
  index,
  setId,
  allPsalms,
  psalmMeter,
  recommendedTune,
  onDelete,
  onTuneClick,
  onPsalmClick,
}: SetItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [verseOpen, setVerseOpen] = useState(false)
  const [verseValue, setVerseValue] = useState('')
  const [verseError, setVerseError] = useState<string | null>(null)
  const [verseSaving, setVerseSaving] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isMismatch = isMeterMismatch(psalmMeter, item.tune?.meter)

  const mismatchRowClass = isMismatch
    ? 'bg-red-50 dark:bg-red-900/20 border-l-2 border-red-400'
    : ''

  const psalmLabel = item.psalm
    ? `Psalm ${item.psalm.id}${item.psalm.bibleTitle ? ` — ${item.psalm.bibleTitle}` : ''}`
    : `Psalm ${item.psalmId}`

  function openVerseEditor() {
    // Always re-seed from the item so a cancelled edit never leaves a stale
    // value behind for the next open.
    setVerseValue(item.verseRange ?? '')
    setVerseError(null)
    setVerseOpen(true)
  }

  async function saveVerseRange() {
    const result = normaliseVerseRange(verseValue)
    if (!result.ok) {
      setVerseError(result.error)
      return
    }

    setVerseSaving(true)
    setVerseError(null)
    try {
      const res = await fetch(`/api/precent/${setId}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // An empty range means "all verses" — the API stores null for that.
        body: JSON.stringify({ verseRange: result.value === '' ? null : result.value }),
      })
      if (!res.ok) {
        setVerseError('Could not save. Please try again.')
        toast.error('Could not save the verse range')
        return
      }
      setVerseOpen(false)
      toast.success(
        result.value === '' ? 'Verse range cleared' : 'Verse range updated',
      )
      router.refresh()
    } catch {
      setVerseError('Could not save. Please try again.')
      toast.error('Could not save the verse range')
    } finally {
      setVerseSaving(false)
    }
  }

  return (
    <TooltipProvider>
      <tr
        ref={setNodeRef}
        style={style}
        className={`h-14 border-b last:border-b-0 ${mismatchRowClass}`}
      >
        {/* Drag handle — listeners/attributes only here, not on <tr> */}
        <td className="w-8">
          <button
            {...listeners}
            {...attributes}
            className="p-2 touch-none cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
            type="button"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </td>

        {/* Psalm */}
        <td className="pr-2">
          <button
            type="button"
            onClick={() => onPsalmClick(item)}
            className="text-sm font-medium hover:underline text-left"
            aria-label={`Change psalm (currently Psalm ${item.psalmId})`}
          >
            {item.psalmVersionId
              ? (allPsalms.find((r) => r.versionId === item.psalmVersionId)?.slug ?? String(item.psalmId))
              : item.psalmId}
          </button>
        </td>

        {/* Verses */}
        <td className="pr-2 text-xs text-muted-foreground w-16">
          <button
            type="button"
            onClick={openVerseEditor}
            aria-label={`Edit verses for ${psalmLabel} (currently ${item.verseRange ?? 'all verses'})`}
            className="-mx-1 cursor-pointer rounded px-1 py-1.5 text-left transition-colors hover:text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.verseRange ?? 'All'}
          </button>

          {/* Verse range editor */}
          <Dialog
            open={verseOpen}
            onOpenChange={(open) => {
              setVerseOpen(open)
              if (!open) setVerseError(null)
            }}
          >
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit verse range</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{psalmLabel}</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`verse-range-${item.id}`}>Verses</Label>
                <Input
                  id={`verse-range-${item.id}`}
                  value={verseValue}
                  onChange={(e) => {
                    setVerseValue(e.target.value)
                    setVerseError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void saveVerseRange()
                    }
                  }}
                  placeholder="e.g. 1-6"
                  /* The API caps the range at 20 characters and silently drops
                     anything longer, so allow a little extra here and report
                     the limit as an error rather than truncating under the
                     user's fingers. */
                  maxLength={VERSE_RANGE_MAX_LENGTH + 20}
                  autoFocus
                  aria-invalid={verseError ? true : undefined}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for all verses. Examples: 1-6, 28-33, 7-8, 16b-19.
                </p>
                {verseError && (
                  <p role="alert" className="text-xs text-destructive">
                    {verseError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button
                  onClick={() => void saveVerseRange()}
                  disabled={verseSaving}
                >
                  {verseSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </td>

        {/* Meter */}
        <td className="pr-2 w-20">
          <Badge variant="secondary" className="text-xs">
            {psalmMeter ? psalmMeter.replace(/\(.*\)/, '').trim() : '—'}
          </Badge>
        </td>

        {/* Tune */}
        <td className="pr-2">
          <button
            type="button"
            onClick={() => onTuneClick(item)}
            className="text-sm hover:underline text-left"
          >
            {item.tune?.name ? (
              item.tune.name
            ) : recommendedTune ? (
              <span className="text-muted-foreground italic">{recommendedTune}</span>
            ) : (
              '—'
            )}
          </button>
          {isMismatch && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs rounded px-1.5 py-0.5 ml-1 cursor-default inline-block">
                    Meter mismatch
                  </span>
                }
              />
              <TooltipContent>
                Psalm is {psalmMeter}, tune is {item.tune?.meter}. Choose a
                matching tune or proceed as arranged.
              </TooltipContent>
            </Tooltip>
          )}
        </td>

        {/* Actions */}
        <td className="text-right">
          <div className="flex items-center justify-end gap-1">
            {/* Play */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href={`/precent/${setId}/sing/${index + 1}`}
                    aria-label="Start precenting from this psalm"
                    className="p-2.5 inline-flex items-center justify-center rounded hover:bg-muted transition-colors"
                  >
                    <PlayCircle className="h-4 w-4 text-foreground" />
                  </Link>
                }
              />
              <TooltipContent>Start precenting from here</TooltipContent>
            </Tooltip>

            {/* Delete */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Remove psalm from set"
                    onClick={() => setDeleteOpen(true)}
                    className="p-2.5 inline-flex items-center justify-center rounded hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                }
              />
              <TooltipContent>Remove from set</TooltipContent>
            </Tooltip>
          </div>

          {/* Delete confirm dialog */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Remove psalm from set?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This will remove {psalmLabel} from the set. This cannot be undone.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <DialogClose
                  render={<Button variant="outline">Cancel</Button>}
                />
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteOpen(false)
                    onDelete(item.id)
                  }}
                >
                  Remove
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </td>
      </tr>
    </TooltipProvider>
  )
}
