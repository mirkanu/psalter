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
   * 'fixed' (default) = floating viewport-bottom bar; 'inline' = fixed above
   * the GlassBottomBar inside the page container (still fixed-positioned);
   * 'flow' = literal document-flow placement — the bar sits between page
   * blocks and scrolls with the page (used on /tunes/[slug] between the tune
   * name and the tabs per user spec).
   */
  variant?: 'fixed' | 'inline' | 'flow'
}

/**
 * TuneMiniBarSection — client wrapper that owns playback state for the
 * PlayMiniBar instance on /tunes/[slug].
 *
 * The tune page is a server component and cannot own client-side state
 * itself, so this thin wrapper lifts isPlaying / miniBarMounted /
 * miniBarVisible here. Phase 16 R3: callers pass `variant="flow"` so the
 * bar sits between the tune name and the tabs in document flow (the user
 * explicitly rejected floating/fixed variants). The default `'fixed'` is
 * retained for other potential call sites.
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
