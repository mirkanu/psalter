'use client'

import { useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TuneScoreGallery } from '@/components/TuneScoreGallery'
import { SelectPsalmDialog } from '@/components/SelectPsalmDialog'
import { toEmbedUrl } from '@/lib/youtube'

type ViewMode = 'staff' | 'solfege'

interface PsalmOption {
  id: number
  bibleTitle: string | null
}

interface TuneDetailClientProps {
  tuneName: string
  staffPages: string[]        // scoreJpgUrl + additionalScoreUrls
  solfegePages: string[]      // solfegeJpgUrl + additional solfege pages (if any)
  soundcloudUrl: string | null
  youtubeUrl: string | null
  psalmsForMeter: PsalmOption[]
  meter: string | null
}

export function TuneDetailClient({
  tuneName,
  staffPages,
  solfegePages,
  soundcloudUrl,
  youtubeUrl,
  psalmsForMeter,
  meter,
}: TuneDetailClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('staff')
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectPsalmOpen, setSelectPsalmOpen] = useState(false)

  const hasStaff = staffPages.length > 0
  const hasSolfege = solfegePages.length > 0
  const hasSoundCloud = !!soundcloudUrl && soundcloudUrl.startsWith('http')
  const ytEmbedBase = toEmbedUrl(youtubeUrl)
  const hasYouTube = !!ytEmbedBase

  const canPlay = hasSoundCloud || hasYouTube

  // If viewing solfege but none available, fall back to staff
  const effectiveMode = viewMode === 'solfege' && !hasSolfege ? 'staff' : viewMode

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Staff / Solfège tab buttons */}
        <div className="flex gap-1">
          {hasStaff && (
            <Button
              variant={effectiveMode === 'staff' ? 'default' : 'outline'}
              size="xs"
              onClick={() => setViewMode('staff')}
              aria-pressed={effectiveMode === 'staff'}
            >
              Staff
            </Button>
          )}
          {hasSolfege && (
            <Button
              variant={effectiveMode === 'solfege' ? 'default' : 'outline'}
              size="xs"
              onClick={() => setViewMode('solfege')}
              aria-pressed={effectiveMode === 'solfege'}
            >
              Solfège
            </Button>
          )}
        </div>

        {/* Play / Pause button */}
        {canPlay && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      {/* Player embed */}
      {isPlaying && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground italic">Note: lyrics may not match</p>
          {hasSoundCloud ? (
            <iframe
              title={`SoundCloud: ${tuneName}`}
              width="100%"
              height="96"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl!)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false`}
              className="rounded-md border border-border"
            />
          ) : (
            <div className="aspect-video w-full max-w-sm rounded-md overflow-hidden border border-border">
              <iframe
                src={`${ytEmbedBase}?autoplay=1&mute=1`}
                title={`YouTube: ${tuneName}`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            </div>
          )}
        </div>
      )}

      {/* Score display */}
      {effectiveMode === 'staff' && hasStaff && (
        <TuneScoreGallery pages={staffPages} alt={`Score for ${tuneName}`} />
      )}
      {effectiveMode === 'solfege' && hasSolfege && (
        <TuneScoreGallery pages={solfegePages} alt={`Solfège score for ${tuneName}`} />
      )}
      {!hasStaff && !hasSolfege && (
        <p className="text-sm text-muted-foreground italic">Score image not yet available.</p>
      )}

      {/* Select Psalm button */}
      {psalmsForMeter.length > 0 && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectPsalmOpen(true)}
          >
            Select Psalm
          </Button>
        </div>
      )}

      <SelectPsalmDialog
        open={selectPsalmOpen}
        onClose={() => setSelectPsalmOpen(false)}
        psalms={psalmsForMeter}
        meter={meter}
      />
    </div>
  )
}
