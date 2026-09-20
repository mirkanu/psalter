'use client'

import { useState } from 'react'
import { FeedbackModalClient } from '@/components/FeedbackModalClient'

/**
 * Inline note on the /precent login screen inviting users without an
 * account to request access via the feedback form (issue #10).
 *
 * The FeedbackModal is the same one the site header / footer uses; we
 * import the dynamic lazy wrapper here so the login page does not pull
 * the feedback dialog into its critical path.
 */
export function AccountRequestNote() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 text-center text-sm text-muted-foreground">
      <p>
        Don&rsquo;t have an account yet?{' '}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Submit feedback
        </button>{' '}
        requesting one.
      </p>
      <FeedbackModalClient open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
