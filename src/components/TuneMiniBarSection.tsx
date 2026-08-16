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
}

/**
 * TuneMiniBarSection — client wrapper that owns playback state for the
 * STATIC (page-flow) PlayMiniBar instance on /tunes/[id].
 *
 * The tune page is a server component and cannot own client-side state
 * itself, so this thin wrapper lifts isPlaying / miniBarMounted /
 * miniBarVisible here. The rendered PlayMiniBar uses its default fixed
 * positioning — acceptable on the tune page where the score section is
 * the primary content and the bar sits at the viewport bottom without
 * conflicting with other fixed chrome.
 */
export function TuneMiniBarSection({ abc, soundcloudUrl, tuneName }: Props) {
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
      />
    </div>
  )
}
