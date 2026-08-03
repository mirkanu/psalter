export const dynamic = 'force-dynamic'
import Link from "next/link"
import { fetchAllDailyReadings } from "@/db/queries/daily"
import { getDayOfYear } from "@/lib/daily"
import { DailyTodayCard } from "@/components/DailyTodayCard"
import { PsalmSearchWidget } from "@/components/PsalmSearchWidget"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

export default async function HomePage() {
  const readings = await fetchAllDailyReadings()
  const todayDay = getDayOfYear()
  const todayReading = readings.find((r) => r.dayNumber === todayDay) ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div
        className="bg-muted border border-border rounded-lg border-l-4 border-l-primary p-6 mb-8"
        data-home-hero
      >
        <Badge>New</Badge>
        <h2 className="text-lg font-semibold mt-2">CPRC Psalter v2.0 is here</h2>
        <p className="text-sm text-muted-foreground mt-1">
          See what&apos;s new in the latest release.
        </p>
        <Link
          href="/changelog"
          className={`${buttonVariants({ variant: "outline" })} mt-4`}
        >
          Read the changelog
        </Link>
      </div>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <DailyTodayCard reading={todayReading} todayDay={todayDay} />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Find a Psalm</h2>
          <p className="text-muted-foreground text-sm">
            Jump directly to any psalm by number.
          </p>
          <PsalmSearchWidget />
        </div>
      </div>
    </div>
  )
}
