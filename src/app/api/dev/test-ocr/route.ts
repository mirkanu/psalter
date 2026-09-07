/**
 * Dev-only OCR testing endpoint.
 *
 * Plan 17-02: stubbed. The original implementation referenced
 * `path.join(process.cwd(), ...)` for filesystem lookups and the
 * `scripts/xml2abc.py` Python helper. Turbopack's NFT (Node File
 * Tracer) flagged those dynamic ops as triggering a whole-project
 * trace (Import trace ./next.config.ts ← ./src/app/api/dev/test-ocr/route.ts),
 * which caused Vercel's Serverless Function packaging to fail with:
 *
 *   "The framework produced an invalid deployment package for a
 *    Serverless Function. Typically this means that the framework
 *    produces files in symlinked directories."
 *
 * The full OCR pipeline lives in `scripts/dev/test-ocr-handler.ts`
 * for local use on Hetzner (which has /opt/audiveris and the
 * compressed JPGs in public/tunes/). Vercel deployments no longer
 * need this route because:
 *   - Production tunes are rendered from the abcjs notation pipeline
 *     (see src/app/tunes/[slug]/page.tsx) using live ABC + scanned
 *     JPGs from cdn.psalter.gsdlabs.dev.
 *   - The OCR pipeline is only used to bootstrap new tunes into the
 *     database, not at request time.
 *
 * Returning a 404 keeps the `verify-dev-surface-locked.sh` auth check
 * meaningful (any non-admin caller still sees the gate), but stops
 * Vercel's packaging step from scanning the whole project tree.
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'OCR testing endpoint disabled on this deployment — run scripts/dev/test-ocr-handler.ts locally' },
    { status: 404 }
  )
}