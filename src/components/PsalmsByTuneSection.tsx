'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PsalmPickerModal } from '@/components/PsalmPickerModal'
import type { PsalmRow } from '@/components/PsalmListingGrid'

interface PsalmEntry {
  id: number
  bibleTitle: string | null
  firstLine: string | null
  slug?: string
  displayLabel?: string
}

interface PsalmsByTuneSectionProps {
  recommendedPsalms: PsalmEntry[]
  otherPsalms: PsalmEntry[]
  psalmsForMeter: { id: number; bibleTitle: string | null; firstLine: string | null; lyricsImportedRaw: string | null }[]
  allPsalmRows: PsalmRow[]
  tuneId: number
  meter: string | null
}

function PsalmCard({ psalm }: { psalm: PsalmEntry }) {
  const href = psalm.slug ? `/psalms/${psalm.slug}` : `/psalms/${psalm.id}`
  const label = psalm.displayLabel ?? String(psalm.id)
  return (
    <Link
      href={href}
      className="flex flex-col py-2 px-2 min-h-[44px] rounded-lg border border-border bg-card hover:border-primary transition-colors duration-200 active:bg-muted active:scale-[0.98] transition-transform duration-75"
      aria-label={`Psalm ${label}`}
    >
      <span className="text-xs font-semibold font-mono tabular-nums text-foreground leading-none">
        {label}
      </span>
      {psalm.firstLine && (
        <span className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
          {psalm.firstLine}
        </span>
      )}
    </Link>
  )
}

export function PsalmsByTuneSection({
  recommendedPsalms,
  otherPsalms,
  psalmsForMeter,
  allPsalmRows,
  tuneId,
  meter,
}: PsalmsByTuneSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const allPsalms = [...recommendedPsalms, ...otherPsalms]
  const existingIds = new Set(allPsalms.map((p) => p.id))
  const hasAlternates = psalmsForMeter.some((p) => !existingIds.has(p.id))

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Sing this tune</h2>

      {recommendedPsalms.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recommended Psalms
            </h3>
            {hasAlternates && (
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                Sing to a different psalm
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
            {recommendedPsalms.map((psalm) => (
              <PsalmCard key={psalm.id} psalm={psalm} />
            ))}
          </div>
          {otherPsalms.length > 0 && (
            <>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Other psalms using this tune
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {otherPsalms.map((psalm) => (
                  <PsalmCard key={psalm.id} psalm={psalm} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {otherPsalms.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Psalms using this tune
                </h3>
                {hasAlternates && (
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                    Sing to a different psalm
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                {otherPsalms.map((psalm) => (
                  <PsalmCard key={psalm.id} psalm={psalm} />
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                Select a Psalm
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              Select Psalm
            </Button>
          )}
        </>
      )}

      <PsalmPickerModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        psalms={allPsalmRows}
        title="Select Psalm"
        onSelect={(p) => { setDialogOpen(false); router.push(`/psalms/${p.slug}?tune=${tuneId}`) }}
      />
    </section>
  )
}
