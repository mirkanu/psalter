import { db } from "@/db"
import { eq } from "drizzle-orm"
import { dailyReadings, psalms } from "@/db/schema"

// ──────────────────────────────────────────────────────────────────────────────
// Narrow shape: every public consumer (home badge, /daily, /daily/[day]) only
// reads dayNumber + psalmId + optional verse range + psalm.{id,bibleTitle}.
// Selecting only those columns keeps each row tiny, which is the dominant
// factor in Neon egress for / and /daily (see issue #51, phase B).
// ──────────────────────────────────────────────────────────────────────────────

/** Minimal per-row shape used by the homepage badge and the /daily calendar.
 *  No bibleTitle, since neither consumer renders it. */
export type DailyReadingMinimal = {
  dayNumber: number
  psalmId: number | null
  startingVerse: number | null
  endingVerse: number | null
  psalm: { id: number } | null
}

/** Full per-row shape used by /daily/[day] which renders psalm.bibleTitle. */
export type DailyReadingFull = {
  dayNumber: number
  psalmId: number | null
  startingVerse: number | null
  endingVerse: number | null
  psalm: { id: number; bibleTitle: string | null } | null
}

export async function fetchAllDailyReadings(): Promise<DailyReadingFull[]> {
  return db
    .select({
      dayNumber: dailyReadings.dayNumber,
      psalmId: dailyReadings.psalmId,
      startingVerse: dailyReadings.startingVerse,
      endingVerse: dailyReadings.endingVerse,
      psalm: {
        id: psalms.id,
        bibleTitle: psalms.bibleTitle,
      },
    })
    .from(dailyReadings)
    .leftJoin(psalms, eq(psalms.id, dailyReadings.psalmId))
    .orderBy(dailyReadings.dayNumber)
}

/** Tighter helper for the homepage badge and /daily calendar. Drops
 *  bibleTitle from the joined psalms row. */
export async function fetchAllDailyReadingsMinimal(): Promise<DailyReadingMinimal[]> {
  return db
    .select({
      dayNumber: dailyReadings.dayNumber,
      psalmId: dailyReadings.psalmId,
      startingVerse: dailyReadings.startingVerse,
      endingVerse: dailyReadings.endingVerse,
      psalm: {
        id: psalms.id,
      },
    })
    .from(dailyReadings)
    .leftJoin(psalms, eq(psalms.id, dailyReadings.psalmId))
    .orderBy(dailyReadings.dayNumber)
}

export async function fetchDailyReading(dayNumber: number): Promise<DailyReadingFull | null> {
  const [row] = await db
    .select({
      dayNumber: dailyReadings.dayNumber,
      psalmId: dailyReadings.psalmId,
      startingVerse: dailyReadings.startingVerse,
      endingVerse: dailyReadings.endingVerse,
      psalm: {
        id: psalms.id,
        bibleTitle: psalms.bibleTitle,
      },
    })
    .from(dailyReadings)
    .leftJoin(psalms, eq(psalms.id, dailyReadings.psalmId))
    .where(eq(dailyReadings.dayNumber, dayNumber))
    .limit(1)
  return row ?? null
}

/** Narrowest helper for the daily-readings row used by TodayPsalmBadge. */
export async function fetchDailyReadingDayAndPsalmId(
  dayNumber: number
): Promise<DailyReadingMinimal | null> {
  const [row] = await db
    .select({
      dayNumber: dailyReadings.dayNumber,
      psalmId: dailyReadings.psalmId,
      startingVerse: dailyReadings.startingVerse,
      endingVerse: dailyReadings.endingVerse,
      psalm: {
        id: psalms.id,
      },
    })
    .from(dailyReadings)
    .leftJoin(psalms, eq(psalms.id, dailyReadings.psalmId))
    .where(eq(dailyReadings.dayNumber, dayNumber))
    .limit(1)
  return row ?? null
}

// After Phase 05.3 schema change, this type includes:
//   startingVerse: number | null
//   endingVerse: number | null
export type DailyReadingWithPsalm = DailyReadingFull
