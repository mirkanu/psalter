'use client'
import { useState } from 'react'
import { Play } from 'lucide-react'
import { toEmbedUrl } from '@/lib/youtube'

interface TuneAudioPlayerProps {
  soundcloudUrl: string | null
  youtubeUrl: string | null
  tuneName: string
}

export function TuneAudioPlayer({ soundcloudUrl, youtubeUrl, tuneName }: TuneAudioPlayerProps) {
  const [expanded, setExpanded] = useState(false)

  const hasSc = !!soundcloudUrl && soundcloudUrl.startsWith('http')
  const ytEmbedBase = toEmbedUrl(youtubeUrl)
  const hasYt = !!ytEmbedBase

  if (!hasSc && !hasYt) return null

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground active:bg-muted active:scale-[0.98] transition-all duration-75"
      >
        <Play className="h-4 w-4 fill-current" />
        <span>Play recording <span className="text-xs">(lyrics may not match)</span></span>
      </button>
    )
  }

  if (hasSc) {
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl!)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false`
    return (
      <iframe
        title={`SoundCloud: ${tuneName}`}
        width="100%"
        height="96"
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin"
        src={src}
        className="rounded-md border border-border"
      />
    )
  }

  const ytSrc = `${ytEmbedBase}?autoplay=1&mute=1`
  return (
    <div className="aspect-video w-full max-w-sm rounded-md overflow-hidden border border-border">
      <iframe
        src={ytSrc}
        title={`YouTube: ${tuneName}`}
        className="w-full h-full"
        allow="autoplay; encrypted-media"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  )
}
