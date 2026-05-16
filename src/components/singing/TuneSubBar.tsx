'use client'
import { Pencil } from 'lucide-react'

interface Props {
  tuneName: string | null
  meter: string | null
  onOpenSwitcher: () => void
}

/** Abbreviate meter to UI-SPEC §2 format: "Common Meter" → "C.M.", etc. */
function abbrevMeter(m: string | null): string {
  if (!m) return ''
  const lower = m.toLowerCase()
  if (lower.includes('double common')) return 'D.C.M.'
  if (lower.includes('common meter')) return 'C.M.'
  if (lower.includes('long meter')) return 'L.M.'
  if (lower.includes('short meter')) return 'S.M.'
  const trimmed = m.trim()
  if (/^[A-Z]{2,4}$/.test(trimmed)) return trimmed.split('').join('.') + '.'
  if (/^[A-Z](\.[A-Z])+\.?$/.test(trimmed)) return trimmed
  return trimmed
}

export function TuneSubBar({ tuneName, meter, onOpenSwitcher }: Props) {
  const abbrev = abbrevMeter(meter)
  return (
    <div
      data-singing-subbar
      className="sticky top-12 md:top-14 landscape:top-10 z-20 bg-muted/60 backdrop-blur border-b"
    >
      <button
        type="button"
        onClick={onOpenSwitcher}
        aria-label={tuneName ? `Change tune (currently ${tuneName})` : 'Choose a tune'}
        className="w-full min-h-11 h-10 md:h-11 landscape:h-9 px-3 flex items-center gap-2 text-sm font-normal active:scale-[0.997] transition-transform motion-reduce:transition-none"
      >
        {tuneName ? (
          <>
            <span className="shrink-0 text-muted-foreground">
              {abbrev ? <>Tune ({abbrev}):</> : <>Tune:</>}
            </span>
            <span
              data-tune-name
              className="flex-1 min-w-0 truncate font-semibold text-foreground text-left"
            >
              {tuneName}
            </span>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </>
        ) : (
          <>
            <span className="shrink-0 text-muted-foreground">Tune:</span>
            <span className="flex-1 text-muted-foreground italic text-left">—</span>
            <span className="shrink-0 font-semibold underline text-foreground">Choose</span>
          </>
        )}
      </button>
    </div>
  )
}
