import { readFileSync } from 'node:fs'
import path from 'node:path'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MusicxmlPreviewClient } from './MusicxmlPreviewClient'

export const dynamic = 'force-dynamic'

export default async function MusicxmlPreviewPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') redirect('/login')

  let initialAbc = ''
  try {
    initialAbc = readFileSync(
      path.join(
        process.cwd(),
        '.planning/research/abc-samples/crimond-verified.abc',
      ),
      'utf-8',
    )
  } catch (err) {
    initialAbc = `% ERROR: could not load .planning/research/abc-samples/crimond-verified.abc
% Run: npx tsx scripts/convert-crimond-musicxml.ts --phrase-breaks=10,16,24
% Details: ${(err as Error).message}`
  }
  return <MusicxmlPreviewClient initialAbc={initialAbc} />
}
