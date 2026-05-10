'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SelectPsalmDialog } from '@/components/SelectPsalmDialog'

interface PsalmEntry {
  id: number
  bibleTitle: string | null
  firstLine: string | null
}

interface PsalmsByTuneSectionProps {
  psalms: PsalmEntry[]
  psalmsForMeter: { id: number; bibleTitle: string | null }[]
  tuneId: number
  meter: string | null
}

export function PsalmsByTuneSection({ psalms, psalmsForMeter, tuneId, meter }: PsalmsByTuneSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const existingIds = new Set(psalms.map((p) => p.id))
  const hasAlternates = psalmsForMeter.some((p) => !existingIds.has(p.id))

  return (
    <section>
      {/* Section heading row with "Select different Psalm" button to the right */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Psalms using this tune
        </h2>
        {hasAlternates && (
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            Select different Psalm
          </Button>
        )}
      </div>

      {/* Psalm cards — matching /psalms listing style with first line */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {psalms.map((psalm) => (
          <Link
            key={psalm.id}
            href={`/psalms/${psalm.id}`}
            className="flex flex-col py-2 px-2 min-h-[44px] rounded-lg border border-border bg-card hover:border-primary transition-colors duration-200 active:scale-[0.97]"
            aria-label={`Psalm ${psalm.id}`}
          >
            <span className="text-xs font-semibold font-mono tabular-nums text-foreground leading-none">
              {psalm.id}
            </span>
            {psalm.firstLine && (
              <span className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                {psalm.firstLine}
              </span>
            )}
          </Link>
        ))}
      </div>

      <SelectPsalmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        psalms={psalmsForMeter}
        meter={meter}
        existingPsalmIds={existingIds}
        tuneId={tuneId}
      />
    </section>
  )
}
