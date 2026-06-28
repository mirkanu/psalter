"use client"

import { useState, useCallback } from 'react'
import { PlayMiniBar } from './singing/PlayMiniBar'

interface Props {
  abc: string
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

  return (
    <div className="mt-4">
      <PlayMiniBar
        abc={abc}
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
