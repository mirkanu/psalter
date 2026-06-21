import { db } from "@/db"
import { eq } from "drizzle-orm"
import { dailyReadings } from "@/db/schema"

export async function fetchAllDailyReadings() {
  return db.query.dailyReadings.findMany({
    with: { psalm: true },
    orderBy: (r, { asc }) => [asc(r.dayNumber)],
  })
}

export async function fetchDailyReading(dayNumber: number) {
  return db.query.dailyReadings.findFirst({
    where: eq(dailyReadings.dayNumber, dayNumber),
    with: { psalm: true },
  })
}

// After Phase 05.3 schema change, this type includes:
//   startingVerse: number | null
//   endingVerse: number | null
export type DailyReadingWithPsalm = NonNullable<Awaited<ReturnType<typeof fetchDailyReading>>>
