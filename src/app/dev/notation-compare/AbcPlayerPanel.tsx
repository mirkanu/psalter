'use client'

import { useEffect, useRef } from 'react'
import * as abcjsModule from 'abcjs'
import 'abcjs/abcjs-audio.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const abcjs = (abcjsModule as any).default ?? abcjsModule

interface AbcPlayerPanelProps {
  abc: string
  title?: string
}

export default function AbcPlayerPanel({ abc, title }: AbcPlayerPanelProps) {
  const notationRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const notationEl = notationRef.current
    const playerEl = playerRef.current
    if (!notationEl) return

    notationEl.innerHTML = ''
    if (playerEl) playerEl.innerHTML = ''

    let visualObjs: ReturnType<typeof abcjs.renderAbc>
    try {
      visualObjs = abcjs.renderAbc(notationEl, abc, {
        responsive: 'resize',
        add_classes: true,
      })
    } catch {
      notationEl.textContent = 'Could not render notation.'
      return
    }

    if (
      playerEl &&
      visualObjs?.[0] &&
      typeof abcjs.synth?.SynthController === 'function' &&
      abcjs.synth.supportsAudio?.()
    ) {
      try {
        const ctrl = new abcjs.synth.SynthController()
        ctrl.load(playerEl, null, {
          displayPlay: true,
          displayProgress: true,
          displayWarp: false,
        })
        ctrl.setTune(visualObjs[0], false, {}).catch(() => {
          // audio init failed silently — notation still shows
        })
      } catch {
        // synth unavailable — notation still shows
      }
    }
  }, [abc])

  return (
    <div className="border rounded p-3 bg-white">
      <div
        ref={notationRef}
        aria-label={title ? `Music notation for ${title}` : 'Music notation'}
        role="img"
        className="w-full"
      />
      <div ref={playerRef} className="mt-2" />
    </div>
  )
}
