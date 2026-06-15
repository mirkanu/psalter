'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, CheckCircle2, Loader2, Plus, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { parsePsalmList, nextSunday } from '@/lib/parse-psalm-list'
import type { PsalmRow } from '@/components/PsalmListingGrid'

type ServiceType = 'AM Service' | 'PM Service' | 'Other'

interface CreateSetFormProps {
  psalms: PsalmRow[]
}

export function CreateSetForm({ psalms }: CreateSetFormProps) {
  const router = useRouter()
  const [lastType, setLastType] = useLocalStorage<ServiceType>('psalter_last_service_type', 'AM Service')
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [type, setType] = useState<ServiceType | ''>('')
  const [note, setNote] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [calOpen, setCalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const parsedEntries = useMemo(
    () => (pasteText.trim() ? parsePsalmList(pasteText, psalms) : []),
    [pasteText, psalms],
  )
  const validEntries = parsedEntries.filter((e) => e.psalm !== null)

  const isValid = date !== undefined && type !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setError(null)
    const isoDate = format(date!, 'yyyy-MM-dd')

    startTransition(async () => {
      try {
        const res = await fetch('/api/precent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: isoDate, type, note: note || null }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? "Couldn't create set. Check your connection and try again.")
          return
        }

        const { id } = await res.json()
        setLastType(type as ServiceType)

        // Batch-add pasted psalms before navigating
        for (const entry of validEntries) {
          if (!entry.psalm) continue
          await fetch(`/api/precent/${id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ psalmId: entry.psalm.id, verseRange: entry.verseRange }),
          })
        }

        setOpen(false)
        router.push('/precent/' + id)
      } catch {
        setError("Couldn't create set. Check your connection and try again.")
      }
    })
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setDate(nextSunday())
      setType(lastType)
      setNote('')
      setPasteText('')
      setError(null)
    } else {
      setDate(undefined)
      setType('')
      setNote('')
      setPasteText('')
      setError(null)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Set
        </Button>
      } />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>New Precenting Set</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Date */}
          <div className="space-y-1">
            <label htmlFor="set-date" className="text-sm font-medium">
              Date
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="set-date"
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d)
                    setCalOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Service type */}
          <div className="space-y-1">
            <label htmlFor="set-type" className="text-sm font-medium">
              Service type
            </label>
            <Select value={type} onValueChange={(v) => setType(v as ServiceType)}>
              <SelectTrigger id="set-type" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM Service">AM Service</SelectItem>
                <SelectItem value="PM Service">PM Service</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Paste psalm list */}
          <div className="space-y-1">
            <label htmlFor="set-paste" className="text-sm font-medium">
              Psalm list{' '}
              <span className="text-muted-foreground font-normal">(optional — paste to bulk-add)</span>
            </label>
            <textarea
              id="set-paste"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="e.g. 11:1-7; 24:1-5; 55:4-11"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {parsedEntries.length > 0 && (
              <ul className="flex flex-col gap-0.5 mt-1">
                {parsedEntries.map((entry, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs">
                    {entry.psalm ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
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
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label htmlFor="set-note" className="text-sm font-medium">
              Note <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="set-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for this service"
              maxLength={500}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            variant="default"
            disabled={!isValid || isPending}
            className="w-full active:scale-[0.97] transition-transform duration-75"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : validEntries.length > 0 ? (
              `Create Set & Add ${validEntries.length} Psalm${validEntries.length !== 1 ? 's' : ''}`
            ) : (
              'Create Set'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
