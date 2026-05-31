'use client'

import { useEffect, useRef } from 'react'
import * as abcjsModule from 'abcjs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const abcjs = (abcjsModule as any).default ?? abcjsModule

interface Props {
  abc: string
}

export default function AbcRenderer({ abc }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''
    try {
      abcjs.renderAbc(el, abc, { responsive: 'resize' })
    } catch (err) {
      el.innerHTML = `<div class="text-red-700 text-sm">abcjs render error: ${err instanceof Error ? err.message : String(err)}</div>`
    }
  }, [abc])

  return <div ref={ref} className="abc-render" />
}
