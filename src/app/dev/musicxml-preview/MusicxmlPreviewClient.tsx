'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const AbcPlayerPanel = dynamic(() => import('../notation-compare/AbcPlayerPanel'), { ssr: false })
const NotationRendererClient = dynamic(() => import('@/components/notation/NotationRendererClient').then((m) => m.NotationRendererClient), { ssr: false })

interface Props {
  initialAbc: string
}

/**
 * Phase 04.10 dev-preview route. Renders the converted Crimond verified
 * ABC fixture through TWO pipelines side-by-side:
 *   Panel A — raw abcjs (AbcPlayerPanel) — naive render of the ABC body.
 *   Panel B — production NotationRenderer (via NotationRendererClient)
 *             including the new embedded-w branch.
 *
 * Surfaces integration bugs in Wave 3 instead of waiting for Plan 04's
 * production UAT. Public dev route (precedent: /dev/notation-compare). No DB writes.
 */
export function MusicxmlPreviewClient({ initialAbc }: Props) {
  const [abc, setAbc] = useState(initialAbc)
  return (
    <div className="container mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          MusicXML Preview — Crimond (de Boer)
        </h1>
        <p className="text-sm text-muted-foreground">
          Phase 04.10 dev route. Loads
          {' '}
          <code>.planning/research/abc-samples/crimond-verified.abc</code>
          {' '}
          and renders through TWO pipelines side-by-side: raw abcjs (left) and
          the production NotationRenderer including the new embedded-w branch
          (right). Edit the ABC below to experiment; no DB writes occur.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-medium mb-2">Source ABC (editable)</h2>
        <textarea
          className="w-full h-64 border rounded p-2 font-mono text-xs"
          value={abc}
          onChange={(e) => setAbc(e.target.value)}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>
          <h2 className="text-lg font-medium mb-2">Panel A — raw abcjs</h2>
          <div className="abcjs-container border rounded p-4 bg-white">
            <AbcPlayerPanel abc={abc} title="Crimond (raw abcjs)" />
          </div>
        </section>
        <section>
          <h2 className="text-lg font-medium mb-2">
            Panel B — production NotationRenderer (embedded-w branch)
          </h2>
          <div className="abcjs-container abcjs-container-prod border rounded p-4 bg-white">
            <NotationRendererClient
              abc={abc}
              lyrics=""
              scoreJpgUrl={null}
              solfegeJpgUrl={null}
              tuneName="Crimond"
              tuneMeter="CM"
              stanzaMeter="CM"
              showLyrics={true}
              chromeless={false}
              lyricsStructured={null}
              doubleLength={false}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
