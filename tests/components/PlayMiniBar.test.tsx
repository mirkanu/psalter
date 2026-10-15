// @vitest-environment jsdom
// Phase 20-02 (Task 2) — PlayMiniBar audio source migration + empty-URL toasts.
//
// Three behaviour contracts:
//   1. Legacy localStorage key `psalter-audio-source === 'abc'` migrates to
//      `psalter.audioLastSelected === 'midi'` and the old key is removed
//      (Pitfall 1: migrate, don't duplicate).
//   2. New localStorage key `psalter.audioLastSelected === 'soundcloud'` is
//      honoured directly — old key untouched.
//   3. When audioSource === 'soundcloud' but the tune has no SoundCloud URL,
//      a sonner toast fires with the verbatim D-10 mirror notice.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, waitFor, act } from '@testing-library/react'
import { toast } from 'sonner'
import { PlayMiniBar } from '@/components/singing/PlayMiniBar'

vi.mock('sonner', () => ({
  toast: vi.fn(),
  Toaster: () => null,
}))

vi.mock('./AbcAudioControls', () => ({
  AbcAudioControls: () => null,
}))

beforeEach(() => {
  ;(toast as ReturnType<typeof vi.fn>).mockClear()
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('PlayMiniBar — Phase 20-02 audio-source migration (Task 2)', () => {
  it("legacy 'psalter-audio-source' === 'abc' migrates to 'psalter.audioLastSelected' === 'midi' and removes the old key", async () => {
    window.localStorage.setItem('psalter-audio-source', 'abc')
    render(
      <PlayMiniBar
        abc="X:1\nT:test\nK:C\nC|]"
        mounted={true}
        visible={true}
        onCollapse={() => {}}
        isPlaying={false}
        onPlayingChange={() => {}}
        soundcloudUrl="https://soundcloud.com/example/track"
        tuneName="Test"
      />,
    )
    await waitFor(() => {
      expect(window.localStorage.getItem('psalter.audioLastSelected')).toBe('midi')
      expect(window.localStorage.getItem('psalter-audio-source')).toBeNull()
    }, { timeout: 2000 })
  })

  it("'psalter.audioLastSelected' === 'soundcloud' is honoured directly; old key untouched", async () => {
    window.localStorage.setItem('psalter.audioLastSelected', 'soundcloud')
    // Old key also present — should be left alone (the migration only fires
    // when the new key is absent, matching the migrate-not-duplicate contract).
    window.localStorage.setItem('psalter-audio-source', 'abc')
    render(
      <PlayMiniBar
        abc=""
        mounted={true}
        visible={true}
        onCollapse={() => {}}
        isPlaying={false}
        onPlayingChange={() => {}}
        soundcloudUrl="https://soundcloud.com/example/track"
        tuneName="Test"
      />,
    )
    await waitFor(() => {
      expect(window.localStorage.getItem('psalter.audioLastSelected')).toBe('soundcloud')
    }, { timeout: 2000 })
    // Old key is still present (the new key took precedence so migration
    // did not run).
    expect(window.localStorage.getItem('psalter-audio-source')).toBe('abc')
  })
})

describe('PlayMiniBar — Phase 20-02 empty-URL mirror toast (D-10)', () => {
  it('fires the verbatim SoundCloud-empty notice when audioSource is soundcloud and no soundcloudUrl', async () => {
    // Set localStorage to soundcloud so the initial audioSource is soundcloud
    // after hydrate. The tune has no soundcloudUrl prop, so D-10 should fire.
    window.localStorage.setItem('psalter.audioLastSelected', 'soundcloud')
    render(
      <PlayMiniBar
        abc=""  // also no ABC — exercises the hasSc-only path
        mounted={true}
        visible={true}
        onCollapse={() => {}}
        isPlaying={false}
        onPlayingChange={() => {}}
        soundcloudUrl={null}
        tuneName="Test"
      />,
    )
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        'Sung recording not available for this tune. Try switching to the piano player by pressing the piano button on the left.',
      )
    }, { timeout: 2000 })
  })
})