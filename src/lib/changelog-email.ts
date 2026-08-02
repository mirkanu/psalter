/**
 * Changelog broadcast email — rendering + fire-and-forget send wrapper.
 *
 * Origin: Phase 09 (Changelog), CHLG-05. Builds on Phase 07's `sendEmail` primitive
 * (`./email`) — this module never constructs its own Resend client.
 *
 * Post title and body are admin-authored, but they still cross into an email header
 * (subject) and an HTML document, so they get the same escaping and CR/LF discipline
 * Phase 08 applied to anonymous feedback. `buildChangelogEmail` is pure;
 * `sendChangelogBroadcastEmail` never throws, so one bad recipient can never abort a
 * broadcast loop or roll back the post that triggered it.
 */
import { sendEmail, type SendEmailResult } from './email'

export const MAX_SUBJECT_LENGTH = 120
export const DEFAULT_SITE_BASE_URL = 'https://psalter.gsdlabs.dev'

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
 * strips) CR/LF in the subject, so an unsanitised title would silently drop the entire
 * broadcast rather than just mangling one header.
 */
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Public site origin, no trailing slash. Used to build absolute links in outbound mail.
 * Falls back to a literal, matching feedback-email.ts's hardcoded-string precedent.
 */
export function getSiteBaseUrl(): string {
  const raw = process.env.BETTER_AUTH_URL || DEFAULT_SITE_BASE_URL
  return raw.replace(/\/+$/, '')
}

/**
 * Per-subscriber unsubscribe landing page. The token is encoded so a value containing
 * `&`, `#`, or whitespace cannot append or truncate query parameters.
 */
export function buildUnsubscribeUrl(token: string): string {
  return `${getSiteBaseUrl()}/changelog/unsubscribe?token=${encodeURIComponent(token)}`
}

/** 'jane@example.com' -> 'j***@example.com'. Never reveals the true local-part length. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || !local) return email
  return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 3))}@${domain}`
}

export type ChangelogEmailInput = {
  to: string
  title: string
  body: string
  unsubscribeToken: string
}

export type ChangelogEmailPayload = {
  to: string
  subject: string
  html: string
  text: string
}

export function buildChangelogEmail(input: ChangelogEmailInput): ChangelogEmailPayload {
  const { to, title, body, unsubscribeToken } = input

  const safeTitle = sanitizeHeaderValue(title)
  const subject = `CPRC Psalter update: ${safeTitle}`.slice(0, MAX_SUBJECT_LENGTH)

  const changelogUrl = `${getSiteBaseUrl()}/changelog`
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken)

  const text = [
    safeTitle,
    '',
    body,
    '',
    `Read all updates: ${changelogUrl}`,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n')

  const html = [
    `<p><strong>${escapeHtml(safeTitle)}</strong></p>`,
    `<p style="white-space:pre-wrap">${escapeHtml(body)}</p>`,
    `<p><a href="${escapeHtml(changelogUrl)}">Read all updates on psalter.gsdlabs.dev</a></p>`,
    '<hr>',
    `<p style="font-size:12px;color:#666">Unsubscribe: <a href="${escapeHtml(unsubscribeUrl)}">${escapeHtml(unsubscribeUrl)}</a></p>`,
  ].join('\n')

  return { to, subject, html, text }
}

/**
 * Fire-and-forget wrapper: builds the broadcast for one subscriber, sends it through
 * Phase 07's `sendEmail`, and never throws. The publish route calls this once per
 * subscriber in a sequential loop — a single bad recipient must never abort the rest of
 * the broadcast or affect the already-committed post.
 *
 * Never logs the recipient address or the post body — only the failure reason.
 */
export async function sendChangelogBroadcastEmail(
  input: ChangelogEmailInput,
): Promise<SendEmailResult> {
  try {
    const payload = buildChangelogEmail(input)
    const result = await sendEmail(payload)
    if (!result.ok) {
      console.error('[changelog] broadcast email failed:', result.error)
    }
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('[changelog] broadcast email failed:', message)
    return { ok: false, error: message }
  }
}
