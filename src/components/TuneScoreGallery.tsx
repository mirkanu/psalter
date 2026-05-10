'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface TuneScoreGalleryProps {
  pages: string[]
  alt: string
}

export function TuneScoreGallery({ pages, alt }: TuneScoreGalleryProps) {
  const [index, setIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  if (pages.length === 0) return null

  const current = pages[index]
  const isMulti = pages.length > 1

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div
        className="relative aspect-[3/2] cursor-zoom-in"
        onClick={() => setModalOpen(true)}
        title="Click to view fullscreen"
      >
        <Image
          src={current}
          alt={`${alt} — page ${index + 1} of ${pages.length}`}
          fill
          className="object-contain rounded-md border border-border"
          priority={index === 0}
        />

        {isMulti && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIndex((i) => Math.max(0, i - 1)) }}
              disabled={index === 0}
              aria-label="Previous page"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 border border-border shadow hover:bg-muted disabled:opacity-30 transition-opacity"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIndex((i) => Math.min(pages.length - 1, i + 1)) }}
              disabled={index === pages.length - 1}
              aria-label="Next page"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 border border-border shadow hover:bg-muted disabled:opacity-30 transition-opacity"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {isMulti && (
        <p className="text-center text-xs text-muted-foreground mt-1">
          Page {index + 1} of {pages.length}
        </p>
      )}

      {/* Fullscreen modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalOpen(false)}
        >
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/80 border border-border hover:bg-muted"
            aria-label="Close fullscreen"
          >
            <X className="size-5" />
          </button>
          <div
            className="relative w-full max-w-5xl max-h-[90vh] aspect-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current}
              alt={`${alt} — page ${index + 1} of ${pages.length} (fullscreen)`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </div>
  )
}
