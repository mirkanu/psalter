'use client'

import { useState } from 'react'
import { FeedbackModal } from '@/components/FeedbackModal'

/**
 * Shown on /login below the sign-in card. Public-beta visitors without an
 * account have no other path to ask for one (the global site footer that
 * hosts the Feedback link is hidden below md, and the mobile menu's feedback
 * entry is not obvious). Tapping the button opens the same FeedbackModal the
 * header/footer use, so submissions land in the same inbox and pick up the
 * same rate-limit + email pipeline as every other feedback message.
 *
 * Issue #10.
 */
export function AccountRequestNote() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <p className="mt-4 text-sm text-muted-foreground">
        Need an account?{' '}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="underline hover:text-foreground transition-colors"
        >
          Open a feedback ticket
        </button>{' '}
        to request one.
      </p>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
