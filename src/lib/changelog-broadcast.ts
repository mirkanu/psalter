/**
 * Changelog broadcast fan-out (Phase 09, CHLG-05).
 *
 * Sends one personalised email per subscriber, sequentially. Do NOT fan these sends out
 * concurrently: concurrent sends blow through Resend's per-account rate limit (documented
 * as low as 2 req/sec on some tiers), and `sendEmail`'s non-throwing contract means the
 * resulting 429s would be logged and silently dropped rather than retried.
 *
 * The recipient list is read exclusively from `changelog_subscribers`. Nothing in an HTTP
 * request may influence who receives mail — Phase 07's threat table (T-07-16) names this
 * as a binding constraint on Phase 09.
 *
 * Never throws: a broadcast failure must never affect the already-committed post.
 */
import { db } from '@/db'
import { changelogSubscribers } from '@/db/schema'
import { sendChangelogBroadcastEmail } from '@/lib/changelog-email'

/** Pause between sends. Keeps the loop comfortably under Resend's per-second limit. */
export const BROADCAST_SEND_INTERVAL_MS = 250

export type BroadcastSummary = { sent: number; failed: number }

export type BroadcastPost = { title: string; body: string }

export async function broadcastToSubscribers(
  post: BroadcastPost,
  options: { delayMs?: number } = {},
): Promise<BroadcastSummary> {
  const delayMs = options.delayMs ?? BROADCAST_SEND_INTERVAL_MS

  let subscribers: { email: string; unsubscribeToken: string }[]
  try {
    subscribers = await db
      .select({
        email: changelogSubscribers.email,
        unsubscribeToken: changelogSubscribers.unsubscribeToken,
      })
      .from(changelogSubscribers)
  } catch (err) {
    console.error('[changelog] could not load subscribers:', err)
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const subscriber of subscribers) {
    try {
      const result = await sendChangelogBroadcastEmail({
        to: subscriber.email,
        title: post.title,
        body: post.body,
        unsubscribeToken: subscriber.unsubscribeToken,
      })
      if (result.ok) sent++
      else failed++
    } catch (err) {
      // sendChangelogBroadcastEmail already promises not to throw; this guards a regression.
      failed++
      console.error('[changelog] broadcast send threw:', err instanceof Error ? err.message : err)
    }
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  console.log(`[changelog] broadcast complete: ${sent} sent, ${failed} failed`)
  return { sent, failed }
}
