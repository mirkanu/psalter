// @vitest-environment jsdom
// Phase 20-02 (Task 2) — GlassBottomBar open/close toggle + Legacy hide.
//
// The bar is a thin chrome strip; the test surface is small but the
// behavioural contract is exact:
//   - playerOpen=false (default) → data-play-toggle="closed" + aria-label
//     "Open audio player" + foreground color
//   - playerOpen=true → data-play-toggle="open" + aria-label "Close audio
//     player" + bg-foreground text-background (the inverted state — NOT
//     bg-primary per UI-SPEC.md "Accent reserved for" #3)
//   - hidePlayButton=true → button element is NOT rendered (D-03)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { GlassBottomBar } from '@/components/singing/GlassBottomBar'

afterEach(() => {
  cleanup()
})

function renderBar(overrides: Partial<React.ComponentProps<typeof GlassBottomBar>> = {}) {
  const defaultProps: React.ComponentProps<typeof GlassBottomBar> = {
    value: 14,
    onValueChange: vi.fn(),
    currentStanza: null,
    totalStanzas: null,
    isPlaying: false,
    playerOpen: false,
    onPlayToggle: vi.fn(),
    onGearOpen: vi.fn(),
  }
  return render(<GlassBottomBar {...defaultProps} {...overrides} />)
}

describe('GlassBottomBar — Phase 20-02 open/close toggle (Task 2)', () => {
  it('with playerOpen=false renders a play button with data-play-toggle="closed" and aria-label "Open audio player"', () => {
    renderBar({ playerOpen: false })
    const btn = screen.getByLabelText('Open audio player')
    expect(btn).not.toBeNull()
    expect(btn.getAttribute('data-play-toggle')).toBe('closed')
  })

  it('with playerOpen=true renders a play button with data-play-toggle="open" and inverted bg-foreground text-background', () => {
    renderBar({ playerOpen: true })
    const btn = screen.getByLabelText('Close audio player')
    expect(btn).not.toBeNull()
    expect(btn.getAttribute('data-play-toggle')).toBe('open')
    // UI-SPEC.md "Accent reserved for" #3: inverted state uses
    // bg-foreground text-background, NOT bg-primary.
    expect(btn.className).toContain('bg-foreground')
    expect(btn.className).toContain('text-background')
  })

  it('with hidePlayButton=true the play button is NOT rendered (D-03)', () => {
    renderBar({ hidePlayButton: true })
    expect(screen.queryByLabelText(/audio player/i)).toBeNull()
  })
})