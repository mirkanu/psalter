import { NextResponse } from 'next/server'
import { db } from '@/db'
import { tuneNotationFeedback } from '@/db/schema'
import { getAdminSessionOr401 } from '@/lib/admin-auth'

export async function GET() {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  const rows = await db.select({
    tuneId: tuneNotationFeedback.tuneId,
    selectedVersion: tuneNotationFeedback.selectedVersion,
  }).from(tuneNotationFeedback)

  return NextResponse.json(rows)
}
