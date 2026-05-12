import { NextResponse } from 'next/server'
import { db } from '@/db'
import { tuneNotationFeedback } from '@/db/schema'

export async function GET() {
  const rows = await db.select({
    tuneId: tuneNotationFeedback.tuneId,
    selectedVersion: tuneNotationFeedback.selectedVersion,
  }).from(tuneNotationFeedback)

  return NextResponse.json(rows)
}
