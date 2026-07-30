import { db } from "@/db"
import { tunes } from "@/db/schema"
import { isNotNull, asc } from "drizzle-orm"
import { NotationCompareClient } from "./NotationCompareClient"
import { HYMNARY_FETCH_IDS } from "@/lib/hymnary-lookup"
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function NotationComparePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') redirect('/login')

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

  const tuneRows: TuneRow[] = rows.map(r => ({
    ...r,
    abcNotation: r.abcNotation!,
    hymnaryAbc: r.name in HYMNARY_FETCH_IDS ? r.abcNotation! : null,
  }))

  return <NotationCompareClient tunes={tuneRows} />
}

export interface TuneRow {
  id: number
  name: string
  meter: string | null
  abcNotation: string
  hymnaryAbc: string | null
  solfegeJpgUrl: string | null
  scoreJpgUrl: string | null
  youtubeUrl: string | null
  soundcloudUrl: string | null
}
