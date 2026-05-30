import { readFileSync } from 'node:fs'
import path from 'node:path'
import { MusicxmlPreviewClient } from './MusicxmlPreviewClient'

export const dynamic = 'force-dynamic'

export default async function MusicxmlPreviewPage() {
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
