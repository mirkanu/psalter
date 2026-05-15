'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface BackToNotationButtonProps {
  onClick: () => void
}

/**
 * Prominent "← Back to notation" button rendered above a JPG (legacy original
 * score or Solfège image) so users have an obvious affordance to return to the
 * live abcjs notation. Used in two places:
 *   - AbcPlayer's `renderAboveOriginal` slot when "Show original" is active
 *   - NotationRenderer's Solfège view above the Solfège JPG
 */
export function BackToNotationButton({ onClick }: BackToNotationButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="mb-3"
      data-testid="back-to-notation"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to notation
    </Button>
  )
}
