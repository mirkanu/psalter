import { db } from "@/db"
import { tunes } from "@/db/schema"
import { isNotNull, asc } from "drizzle-orm"
import { NotationCompareClient } from "./NotationCompareClient"

export const dynamic = "force-dynamic"

export default async function NotationComparePage() {
  const rows = await db
    .select({
      id: tunes.id,
      name: tunes.name,
      meter: tunes.meter,
      abcNotation: tunes.abcNotation,
      solfegeJpgUrl: tunes.solfegeJpgUrl,
      scoreJpgUrl: tunes.scoreJpgUrl,
      youtubeUrl: tunes.youtubeUrl,
      soundcloudUrl: tunes.soundcloudUrl,
    })
    .from(tunes)
    .where(isNotNull(tunes.abcNotation))
    .orderBy(asc(tunes.name))

  return <NotationCompareClient tunes={rows as TuneRow[]} />
}

export interface TuneRow {
  id: number
  name: string
  meter: string | null
  abcNotation: string
  solfegeJpgUrl: string | null
  scoreJpgUrl: string | null
  youtubeUrl: string | null
  soundcloudUrl: string | null
}
