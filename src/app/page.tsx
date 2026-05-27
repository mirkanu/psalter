export const dynamic = 'force-dynamic'
import { fetchAllDailyReadings } from "@/db/queries/daily"
import { TodayCard } from "@/components/TodayCard"
import { PsalmSearchWidget } from "@/components/PsalmSearchWidget"

export default async function HomePage() {
  const readings = await fetchAllDailyReadings()
  // Slim down to fields TodayCard needs (avoid serializing full payload)
  const slim = readings
    .filter((r): r is typeof r & { dayNumber: number } => r.dayNumber !== null)
    .map((r) => ({
      dayNumber: r.dayNumber,
      psalmId: r.psalm?.id ?? null,
      psalm: r.psalm ? { id: r.psalm.id, bibleTitle: r.psalm.bibleTitle } : null,
    }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <TodayCard readings={slim} />
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
