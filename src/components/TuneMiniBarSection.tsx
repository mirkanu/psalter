"use client"

import { useState, useCallback } from 'react'
import { PlayMiniBarClient } from './singing/PlayMiniBarClient'

interface Props {
  /**
   * ABC notation string. null/empty is allowed — PlayMiniBar internally
   * disables abc-source playback and falls back to SoundCloud when
   * `soundcloudUrl` is set (see PlayMiniBar's `hasAbc = !!abc && abc.trim().length > 0`).
   * Phase 16 R3: /tunes/[slug] now renders this section ABOVE the tabs with
   * both abc and SoundCloud availability, so the caller may not know which
   * side is non-null.
   */
  abc: string | null
  soundcloudUrl?: string | null
  tuneName: string
  /**
   * 'fixed' (default) = floating viewport-bottom bar; 'inline' = inside the
   * page max-w container above the tabbed content. Phase 16 R3 /tunes/[slug]
   * uses 'inline' so the audio bar sits above the Details/Notation tabs and
   * is always visible on both tabs without competing with the GlassBottomBar.
   */
  variant?: 'fixed' | 'inline'
}

/**
 * TuneMiniBarSection — client wrapper that owns playback state for the
 * STATIC (page-flow) PlayMiniBar instance on /tunes/[id].
 *
 * The tune page is a server component and cannot own client-side state
 * itself, so this thin wrapper lifts isPlaying / miniBarMounted /
 * miniBarVisible here. Phase 16 R3: callers pass `variant="inline"` when the
 * bar should sit inside the page container (above the tabs); the default
 * `'fixed'` keeps the historical viewport-bottom behaviour.
 */
export function TuneMiniBarSection({ abc, soundcloudUrl, tuneName, variant = 'fixed' }: Props) {
  const [miniBarMounted, setMiniBarMounted] = useState(true)
  const [miniBarVisible, setMiniBarVisible] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const handlePlayingChange = useCallback((playing: boolean) => setIsPlaying(playing), [])

  // Guard: PlayMiniBar wants abc as a string. Empty string is its native
  // "no abc" sentinel (see PlayMiniBar.hasAbc) — pass it through so the bar
  // can decide whether to render the abc-source toggle.
  const abcForBar = abc ?? ''

  return (
    <div className="mt-4">
      <PlayMiniBarClient
        abc={abcForBar}
        mounted={miniBarMounted}
        visible={miniBarVisible}
        onCollapse={() => setMiniBarVisible(false)}
        isPlaying={isPlaying}
        onPlayingChange={handlePlayingChange}
        soundcloudUrl={soundcloudUrl}
        tuneName={tuneName}
        variant={variant}
      />
    </div>
  )
}
