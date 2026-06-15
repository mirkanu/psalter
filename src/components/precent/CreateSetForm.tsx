'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Plus } from 'lucide-react'
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

type ServiceType = 'AM Service' | 'PM Service' | 'Other'

export function CreateSetForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [type, setType] = useState<ServiceType | ''>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [calOpen, setCalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

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

        if (res.ok) {
          const { id } = await res.json()
          setOpen(false)
          router.push('/precent/' + id)
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? "Couldn't create set. Check your connection and try again.")
        }
      } catch {
        setError("Couldn't create set. Check your connection and try again.")
      }
    })
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setDate(undefined)
      setType('')
      setNote('')
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

          {/* Note */}
          <div className="space-y-1">
            <label htmlFor="set-note" className="text-sm font-medium">
              Note (optional)
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
            ) : (
              'Create Set'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
