export const dynamic = 'force-dynamic'
import { fetchAllDailyReadings } from "@/db/queries/daily"
import { getDayOfYear } from "@/lib/daily"
import { DailyTodayCard } from "@/components/DailyTodayCard"
import { PsalmSearchWidget } from "@/components/PsalmSearchWidget"

export default async function HomePage() {
  const readings = await fetchAllDailyReadings()
  const todayDay = getDayOfYear()
  const todayReading = readings.find((r) => r.dayNumber === todayDay) ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
