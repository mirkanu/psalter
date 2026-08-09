'use client'
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import type { TuneOption } from './types'
import { TieredTuneRowList } from '@/components/tune-picker/TieredTuneRowList'
import type { PsalmVersionTuneTiers } from '@/db/queries/tunes'
import type { TuneTier } from '@/lib/tune-tiers'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Every selectable tune, including the currently active one. Already meter-filtered by the route. */
  tunes: TuneOption[]
  currentTuneId: number | null
  /** TSEL-01/D-13. Undefined = no tier data; every tune renders under "Other tunes". */
  tuneTiers?: PsalmVersionTuneTiers | null
  meterLabel: string | null
}

function TuneRow({
  tune,
  isCurrent,
  onSelect,
}: {
  tune: TuneOption
  isCurrent: boolean
  onSelect: (t: TuneOption) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tune)}
      data-tune-slug={String(tune.id)}
      aria-current={isCurrent ? 'true' : undefined}
      className={[
        'w-full text-left h-12 min-h-11 px-3 rounded-md text-base transition-colors',
        'flex items-center justify-between gap-2 active:scale-[0.99]',
        isCurrent
          ? 'bg-foreground text-background ring-1 ring-foreground'
          : 'hover:bg-muted',
      ].join(' ')}
    >
      <span className="font-semibold truncate">{tune.name}</span>
      <span className="flex items-center gap-2 shrink-0">
        {tune.meter && (
          <Badge variant={isCurrent ? 'outline' : 'secondary'} className="text-xs">
            {tune.meter}
          </Badge>
        )}
        {isCurrent && (
          <Badge variant="outline" className="text-xs">Current</Badge>
        )}
      </span>
    </button>
  )
}

function SectionHeader({ tier, children }: { tier: TuneTier; children: React.ReactNode }) {
  return (
    <h3 data-tune-tier-heading={tier} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-1">
      {children}
    </h3>
  )
}

export function TuneSwitcherSheet({ open, onOpenChange, tunes, currentTuneId, tuneTiers, meterLabel }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track the close-delay timer in a ref so unmount can clear it. (WR-02)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [])

  const handleSelect = (tune: TuneOption) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('tune', String(tune.id))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    // Close after a brief delay so the user sees the selection register (UI-SPEC §Interaction).
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      onOpenChange(false)
    }, 120)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-tune-switcher-sheet
        className="max-h-[80dvh] flex flex-col"
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Choose a tune</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-1 pb-4">
          {tunes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">
              No tunes available for this psalm.
            </p>
          ) : (
            <div className="space-y-1">
              <TieredTuneRowList
                tunes={tunes}
                tuneTiers={tuneTiers}
                currentTuneId={currentTuneId}
                tierLabels={{ other: 'Other tunes' }}
                renderHeading={({ tier, label }) => <SectionHeader tier={tier}>{label}</SectionHeader>}
                renderRow={({ tune, isCurrent }) => (
                  <TuneRow tune={tune} isCurrent={isCurrent} onSelect={handleSelect} />
                )}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
