/**
 * Feedback owner-notification email — rendering + fire-and-forget send wrapper.
 *
 * Origin: Phase 08 (Feedback Email & Rate Limiting), FEED-01. Builds directly on Phase 07's
 * `sendEmail` primitive (`./email`) — this module never constructs its own Resend client.
 *
 * Every value in `FeedbackEmailInput` is untrusted user input submitted anonymously through
 * the public feedback form. `buildFeedbackEmail` is a pure function: it must never let hostile
 * content inject markup into the html body, break out of the subject/reply-to headers via
 * CR/LF, or produce a clickable attacker-controlled link. `sendFeedbackNotification` must never
 * throw, re-attempt a failed send, or log personal data — a mail outage must never break the
 * feedback DB write.
 */
import { sendEmail, type SendEmailResult } from './email'

export const DEFAULT_FEEDBACK_TO_ADDRESS = 'manuelkuhs@gmail.com'
export const MAX_SUBJECT_LENGTH = 120

export type FeedbackEmailInput = {
  message: string
  name: string | null
  email: string | null
  pageUrl: string | null
  submittedAt?: Date
}

export type FeedbackEmailPayload = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CRLF_RE = /[\r\n]/

/** Resolves the owner notification address. Overridable via env, correct by default. */
export function getFeedbackToAddress(): string {
  return process.env.PSALTER_FEEDBACK_TO_ADDRESS || DEFAULT_FEEDBACK_TO_ADDRESS
}

/** Escapes a string for safe interpolation into HTML. Ampersand must be replaced first. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Flattens CR/LF/tab runs to a single space and trims. `sendEmail` rejects (rather than
 * strips) CR/LF in the subject, so an unsanitised hostile name would silently drop the whole
 * notification — the owner would lose real feedback because of an attacker's header.
 */
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatOrNotGiven(value: string | null): string {
  return value && value.trim() ? value : '(not given)'
}

export function buildFeedbackEmail(input: FeedbackEmailInput): FeedbackEmailPayload {
  const { message, name, email, pageUrl } = input
  const submittedAt = input.submittedAt ?? new Date()
  const submittedIso = submittedAt.toISOString()

  const safeName = name ? sanitizeHeaderValue(name) : ''
  const subject = `CPRC Psalter feedback from ${safeName || 'anonymous'}`.slice(
    0,
    MAX_SUBJECT_LENGTH,
  )

  const safeReplyTo =
    email && EMAIL_RE.test(email) && !CRLF_RE.test(email) ? email : undefined

  const text = [
    'New feedback from psalter.gsdlabs.dev',
    '',
    `From: ${formatOrNotGiven(name)}`,
    `Email: ${formatOrNotGiven(email)}`,
    `Page: ${formatOrNotGiven(pageUrl)}`,
    `Submitted: ${submittedIso}`,
    '',
    'Message:',
    message,
  ].join('\n')

  const html = [
    '<p>New feedback from psalter.gsdlabs.dev</p>',
    '<p>' +
      `<strong>From:</strong> ${escapeHtml(formatOrNotGiven(name))}<br>` +
      `<strong>Email:</strong> ${escapeHtml(formatOrNotGiven(email))}<br>` +
      `<strong>Page:</strong> <code>${escapeHtml(formatOrNotGiven(pageUrl))}</code><br>` +
      `<strong>Submitted:</strong> ${escapeHtml(submittedIso)}` +
      '</p>',
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  ].join('\n')

  return {
    to: getFeedbackToAddress(),
    subject,
    html,
    text,
    ...(safeReplyTo ? { replyTo: safeReplyTo } : {}),
  }
}

/**
 * Fire-and-forget wrapper: builds the notification, sends it through Phase 07's `sendEmail`,
 * and never throws. This is the last line of defence in front of a route whose DB write must
 * survive any mail failure — `sendEmail` already promises never to throw, but this function
 * guards against a future regression there too.
 *
 * Never logs the message body, submitter email, or client IP — only the failure reason.
 * Does not queue or re-attempt a failed send: if Resend is down the submission is already
 * safe in Postgres.
 */
export async function sendFeedbackNotification(
  input: FeedbackEmailInput,
): Promise<SendEmailResult> {
  try {
    const payload = buildFeedbackEmail(input)
    const result = await sendEmail(payload)
    if (!result.ok) {
      console.error('[feedback] notification email failed:', result.error)
    }
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('[feedback] notification email failed:', message)
    return { ok: false, error: message }
  }
}
