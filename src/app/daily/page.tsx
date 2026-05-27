export const dynamic = 'force-dynamic'
import Link from "next/link"
import type { Metadata } from "next"
import { fetchAllDailyReadings } from "@/db/queries/daily"
import { DailyPlanClient } from "@/components/DailyPlanClient"

export const metadata: Metadata = {
  title: "Daily Reading Plan | CPRC Psalter",
  description: "365-day Scottish Psalter reading plan.",
}

export default async function DailyPage() {
  const readings = await fetchAllDailyReadings()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <DailyPlanClient />
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
        Daily Reading Plan
      </h1>
      <ol className="divide-y divide-border" data-testid="daily-list">
        {readings.map((r) => {
          const psalmId = r.psalm?.id
          const psalmTitle = r.psalm?.bibleTitle ?? (psalmId ? `Psalm ${psalmId}` : "")
          return (
            <li
              key={r.dayNumber}
              data-day={r.dayNumber}
              className="group flex items-center gap-4 py-3 px-3 -mx-3 rounded-md data-[today]:bg-muted data-[today]:border-l-2 data-[today]:border-primary data-[today]:pl-3"
            >
              <span className="font-mono text-sm tabular-nums text-muted-foreground w-12 shrink-0">
                {r.dayNumber}
              </span>
              {psalmId ? (
                <Link
                  href={`/psalms/${psalmId}`}
                  className="flex-1 text-base hover:text-primary transition-colors"
                >
                  <span className="font-mono text-muted-foreground mr-2">{psalmId}</span>
                  {psalmTitle}
                </Link>
              ) : (
                <span className="text-muted-foreground">No psalm assigned</span>
              )}
              <span className="hidden today-badge text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Today
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
