import Link from "@/components/Link"
import { Music2 } from "lucide-react"
import { formatPsalmRef } from "@/lib/daily"

/** Structural subset of DailyReadingWithPsalm that TodayPsalmBadge actually
 *  reads (dayNumber is unused — psalmId, verse range, psalm.id). Lets the
 *  homepage wire in the narrower fetchAllDailyReadingsMinimal() projection
 *  without widening DailyReadingWithPsalm itself (Neon egress — issue #51). */
export interface TodayPsalmReading {
  psalmId: number | null
  startingVerse: number | null
  endingVerse: number | null
  psalm: { id: number; bibleTitle?: string | null } | null
}

/**
 * Highlighted, clickable "today's psalm" pill for the homepage Daily card,
 * styled to match the ExploreHighlights pills (border, rounded-md, text-xs,
 * amber icon). Rendered via the Daily HomeCard's `children` slot (a sibling
 * CardContent, not nested inside the card's own /daily link) so this can be
 * its own link to /psalms/{id} without creating a nested anchor.
 */
export function TodayPsalmBadge({ reading }: { reading: TodayPsalmReading | null }) {
  if (!reading) return null

  const psalmId = reading.psalm?.id ?? reading.psalmId
  if (!psalmId) return null

  const ref = formatPsalmRef(psalmId, reading.startingVerse, reading.endingVerse, true)

  return (
    <div>
      <p className="text-sm text-muted-foreground">Today&apos;s Psalm</p>
      <Link
        href={`/psalms/${psalmId}`}
        className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border text-xs hover:bg-muted hover:border-primary/30 active:translate-y-px transition-all duration-75"
      >
        <Music2 className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden="true" />
        <span>{ref}</span>
      </Link>
    </div>
  )
}
