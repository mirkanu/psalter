// ISR: regenerate the calendar at most once per hour. The "today" marker
// is computed client-side in DailyCalendarClient, so server-side time isn't
// baked into the cached HTML. (Neon egress — issue #51, phase B.)
export const revalidate = 3600
import type { Metadata } from "next"
import { fetchAllDailyReadingsMinimal } from "@/db/queries/daily"
import { getDayOfYear } from "@/lib/daily"
import { DailyCalendarClient } from "@/components/DailyCalendarClient"

export const metadata: Metadata = {
  title: "Daily Reading Plan | CPRC Psalter",
  description: "365-day Scottish Psalter reading plan.",
}

export default async function DailyPage() {
  const readings = await fetchAllDailyReadingsMinimal()
  const todayDay = getDayOfYear()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <h1 className="text-xl font-semibold text-foreground">Daily Plan</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-4">The Psalter divided into 365 days. Sing through the whole Psalter in one year!</p>
      <p className="text-sm text-muted-foreground my-4">Click any day in the calendar to sing that psalm.</p>
      <DailyCalendarClient readings={readings} todayDay={todayDay} />
    </div>
  )
}
