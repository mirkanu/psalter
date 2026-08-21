import { formatPsalmRef } from "@/lib/daily"
import type { DailyReadingWithPsalm } from "@/db/queries/daily"

/**
 * Small inline badge showing today's psalm reference, styled to match the
 * ExploreHighlights pills (border, rounded-md, text-xs). Used inline within
 * the homepage Daily card's description — not a link, since the whole Daily
 * card is already a link to /daily and this badge lives inside that same
 * link's text flow (nesting an anchor here would be invalid HTML).
 */
export function TodayPsalmBadge({ reading }: { reading: DailyReadingWithPsalm | null }) {
  if (!reading) return null

  const psalmId = reading.psalm?.id ?? reading.psalmId
  const ref = formatPsalmRef(psalmId ?? 0, reading.startingVerse, reading.endingVerse, true)

  return (
    <span className="inline-flex items-center px-2 py-1 ml-1 rounded-md border border-border text-xs align-middle">
      {ref}
    </span>
  )
}
