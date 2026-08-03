export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { changelogSubscribers } from '@/db/schema'
import { maskEmail } from '@/lib/changelog-email'
import { UnsubscribeButton } from '@/components/UnsubscribeButton'

export const metadata: Metadata = {
  title: 'Unsubscribe | CPRC Psalter',
  robots: { index: false, follow: false },
}

/**
 * Unsubscribe landing page (CHLG-05).
 *
 * This page performs a READ ONLY. Removal happens exclusively through the button's
 * POST /api/unsubscribe. Corporate and Outlook-family link-prescanners routinely GET every
 * URL in a delivered message; a GET-mutating design would silently unsubscribe people who
 * never opened the email. Do not add any write to this file.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  const subscriber = token
    ? await db.query.changelogSubscribers.findFirst({
        where: eq(changelogSubscribers.unsubscribeToken, token),
      })
    : null

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center" data-unsubscribe-page>
      <h1 className="text-2xl font-semibold">Unsubscribe from updates</h1>
      {subscriber ? (
        <div className="mt-2">
          <UnsubscribeButton token={token!} maskedEmail={maskEmail(subscriber.email)} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-2" data-unsubscribe-invalid>
          This unsubscribe link is invalid or has already been used.
        </p>
      )}
    </div>
  )
}
