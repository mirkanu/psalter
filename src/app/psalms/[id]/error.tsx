'use client'

import { useEffect } from 'react'

export default function PsalmDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
      <p className="text-foreground font-medium">Could not load this psalm.</p>
      <button
        onClick={reset}
        className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
