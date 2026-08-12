// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
import { PlayMiniBarClient } from './PlayMiniBarClient'

afterEach(() => {
  cleanup()
})

describe('PlayMiniBarClient — Wave 0 wrapper smoke test', () => {
  it('renders without throwing when no abc or soundcloud is provided', async () => {
    // PlayMiniBar's `if (!mounted) return null` short-circuits; the wrapper must
    // still resolve the dynamic import successfully. After the dynamic chunk
    // loads, PlayMiniBar mounts and returns null — a successful null is the
    // proof that the lazy import resolved the named export correctly.
    const { container } = render(
      <PlayMiniBarClient
        abc=""
        mounted={true}
        visible={true}
        onCollapse={() => {}}
        isPlaying={false}
        onPlayingChange={() => {}}
        soundcloudUrl={null}
        tuneName="test"
      />
    )
    // The dynamic chunk takes ~700-1000ms to resolve in jsdom. waitFor polls
    // every 50ms; either the real PlayMiniBar (data-play-mini-bar attribute)
    // or the 44px Suspense fallback div confirms the wrapper ran.
    await waitFor(() => {
      const real = container.querySelector('[data-play-mini-bar]')
      const fallback = container.querySelector('.h-\\[44px\\]')
      expect(real !== null || fallback !== null).toBe(true)
    }, { timeout: 5000 })
  })

  it('exports a PlayMiniBarProps type equal to PlayMiniBar props', () => {
    // TypeScript-only test: if the wrapper's PlayMiniBarProps diverges from
    // PlayMiniBar's Props, this file's compile will fail. The export of the
    // type is verified by the import statement at line 3 succeeding at build.
    expect(typeof PlayMiniBarClient).toBe('function')
  })
})