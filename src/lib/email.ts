/**
 * Psalter email client — a single, tested, non-throwing wrapper around the Resend SDK.
 *
 * Origin: Phase 07 (Email Foundation), EMAIL-01. This is the shared sending primitive that
 * Phase 8 (feedback notifications) and Phase 9 (changelog broadcasts) build on top of.
 *
 * Fire-and-forget contract: `sendEmail` NEVER throws. It always resolves a typed
 * `SendEmailResult`, so a Resend outage or misconfiguration can never break a caller's
 * surrounding logic (e.g. a DB write in the feedback route).
 *
 * Configuration lives outside this repo: `PSALTER_RESEND_API_KEY` and
 * `PSALTER_RESEND_FROM_ADDRESS` are set in `/home/services/.env.production` (the shared VPS
 * secrets file), not in this project's `.env`.
 */
import { Resend } from 'resend'

export const DEFAULT_FROM_ADDRESS = 'CPRC Psalter <psalter@mail.gsdlabs.dev>'

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
}

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string }

const CRLF_RE = /[\r\n]/

/** Resolves the From identity. Never caller-overridable — see sendEmail. */
export function getFromAddress(): string {
  return process.env.PSALTER_RESEND_FROM_ADDRESS || DEFAULT_FROM_ADDRESS
}

/** Whether a Resend API key is present. Does not validate the key itself. */
export function isEmailConfigured(): boolean {
  return !!process.env.PSALTER_RESEND_API_KEY
}

function hasContent(to: string | string[]): boolean {
  if (Array.isArray(to)) return to.length > 0
  return to.trim().length > 0
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const { to, subject, html, text, replyTo } = input

    if (!hasContent(to)) {
      return { ok: false, error: 'invalid recipient: "to" must not be empty' }
    }
    if (!subject || !subject.trim()) {
      return { ok: false, error: 'invalid subject: must not be empty' }
    }

    const toValues = Array.isArray(to) ? to : [to]
    if (toValues.some((value) => CRLF_RE.test(value))) {
      return { ok: false, error: 'invalid recipient/subject: line breaks are not allowed' }
    }
    if (CRLF_RE.test(subject)) {
      return { ok: false, error: 'invalid recipient/subject: line breaks are not allowed' }
    }
    if (replyTo && CRLF_RE.test(replyTo)) {
      return { ok: false, error: 'invalid recipient/subject: line breaks are not allowed' }
    }

    const apiKey = process.env.PSALTER_RESEND_API_KEY
    if (!apiKey) {
      return {
        ok: false,
        error: 'email not configured: PSALTER_RESEND_API_KEY is not set',
      }
    }

    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    })

    if (error) {
      console.error('[email] send failed:', error.message)
      return { ok: false, error: error.message }
    }

    return { ok: true, id: data!.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('[email] send failed:', message)
    return { ok: false, error: message }
  }
}
