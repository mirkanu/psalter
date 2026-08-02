import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SendEmailResult } from './email'

const { sendEmailMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn<(...args: unknown[]) => Promise<SendEmailResult>>(async () => ({
    ok: true,
    id: 'msg-1',
  })),
}))
vi.mock('./email', () => ({ sendEmail: sendEmailMock }))

import {
  escapeHtml,
  maskEmail,
  buildUnsubscribeUrl,
  buildChangelogEmail,
  sendChangelogBroadcastEmail,
  MAX_SUBJECT_LENGTH,
  type ChangelogEmailInput,
} from './changelog-email'

describe('escapeHtml', () => {
  it('escapes ampersand first, then angle brackets and quotes', () => {
    expect(escapeHtml('<script>alert("x")&\'')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;',
    )
  })
})

describe('maskEmail', () => {
  it('masks a typical email', () => {
    expect(maskEmail('jane@example.com')).toBe('j***@example.com')
  })

  it('masks a one-character local part with at least 3 stars, never revealing true length', () => {
    expect(maskEmail('a@b.com')).toBe('a***@b.com')
  })

  it('returns non-email input unchanged', () => {
    expect(maskEmail('notanemail')).toBe('notanemail')
  })
})

describe('buildUnsubscribeUrl', () => {
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.BETTER_AUTH_URL
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BETTER_AUTH_URL
    } else {
      process.env.BETTER_AUTH_URL = originalEnv
    }
  })

  it('falls back to the default site base URL when BETTER_AUTH_URL is unset', () => {
    delete process.env.BETTER_AUTH_URL
    expect(buildUnsubscribeUrl('tok-1')).toBe(
      'https://psalter.gsdlabs.dev/changelog/unsubscribe?token=tok-1',
    )
  })

  it('honours BETTER_AUTH_URL and strips a trailing slash', () => {
    process.env.BETTER_AUTH_URL = 'https://x.test/'
    expect(buildUnsubscribeUrl('tok-1')).toBe(
      'https://x.test/changelog/unsubscribe?token=tok-1',
    )
  })

  it('percent-encodes the token, so & or a space cannot inject extra query parameters', () => {
    delete process.env.BETTER_AUTH_URL
    const url = buildUnsubscribeUrl('a b&c')
    expect(url).toBe(
      'https://psalter.gsdlabs.dev/changelog/unsubscribe?token=a%20b%26c',
    )
  })
})

describe('buildChangelogEmail', () => {
  const base: ChangelogEmailInput = {
    to: 'jane@example.com',
    title: 'Ship it',
    body: 'Line one\nLine two',
    unsubscribeToken: 'tok-abc',
  }

  it('subject is exactly "CPRC Psalter update: Ship it"', () => {
    const payload = buildChangelogEmail(base)
    expect(payload.subject).toBe('CPRC Psalter update: Ship it')
  })

  it('a title containing CR/LF produces a subject with no CR/LF characters', () => {
    const payload = buildChangelogEmail({ ...base, title: 'Ship\r\nit' })
    expect(/[\r\n]/.test(payload.subject)).toBe(false)
  })

  it('a 300-character title produces a subject of at most MAX_SUBJECT_LENGTH characters', () => {
    const payload = buildChangelogEmail({ ...base, title: 'x'.repeat(300) })
    expect(payload.subject.length).toBeLessThanOrEqual(MAX_SUBJECT_LENGTH)
  })

  it('html body contains the escaped title and no raw <script> when title is hostile', () => {
    const payload = buildChangelogEmail({ ...base, title: '<script>x</script>' })
    expect(payload.html).toContain('&lt;script&gt;')
    expect(payload.html).not.toContain('<script>x</script>')
  })

  it('html body escapes the post body and wraps it in white-space:pre-wrap, keeping newlines', () => {
    const payload = buildChangelogEmail({ ...base, body: 'line one\nline two' })
    expect(payload.html).toContain('white-space:pre-wrap')
    expect(payload.html).toContain('line one\nline two')
  })

  it('html body contains an absolute link to /changelog', () => {
    const payload = buildChangelogEmail(base)
    expect(payload.html).toContain('href="https://psalter.gsdlabs.dev/changelog"')
  })

  it('both html and text bodies contain the unsubscribe URL for the given token', () => {
    const payload = buildChangelogEmail(base)
    expect(payload.html).toContain('changelog/unsubscribe?token=tok-abc')
    expect(payload.text).toContain('changelog/unsubscribe?token=tok-abc')
  })

  it('two different tokens produce two different unsubscribe URLs', () => {
    const payloadA = buildChangelogEmail({ ...base, unsubscribeToken: 'tok-a' })
    const payloadB = buildChangelogEmail({ ...base, unsubscribeToken: 'tok-b' })
    expect(payloadA.html).not.toBe(payloadB.html)
    expect(payloadA.text).not.toBe(payloadB.text)
  })

  it("the returned payload's to equals the to passed in, and no replyTo is set", () => {
    const payload = buildChangelogEmail(base)
    expect(payload.to).toBe(base.to)
    expect((payload as { replyTo?: string }).replyTo).toBeUndefined()
  })

  it('the text body contains the raw, unescaped post body and is non-empty', () => {
    const payload = buildChangelogEmail({ ...base, body: '<b>raw</b>' })
    expect(payload.text).toContain('<b>raw</b>')
    expect(payload.text.length).toBeGreaterThan(0)
  })
})

describe('sendChangelogBroadcastEmail', () => {
  const base: ChangelogEmailInput = {
    to: 'jane@example.com',
    title: 'Ship it',
    body: 'Body text',
    unsubscribeToken: 'tok-abc',
  }

  beforeEach(() => {
    sendEmailMock.mockReset()
    sendEmailMock.mockResolvedValue({ ok: true, id: 'msg-1' })
  })

  it('returns the sendEmail result unchanged on success', async () => {
    const result = await sendChangelogBroadcastEmail(base)
    expect(result).toEqual({ ok: true, id: 'msg-1' })
  })

  it('returns the result and does not throw when sendEmail resolves ok:false', async () => {
    sendEmailMock.mockResolvedValue({ ok: false, error: 'Domain not verified' })
    const result = await sendChangelogBroadcastEmail(base)
    expect(result).toEqual({ ok: false, error: 'Domain not verified' })
  })

  it('resolves ok:false and does not throw when sendEmail throws', async () => {
    sendEmailMock.mockRejectedValue(new Error('boom'))
    const result = await sendChangelogBroadcastEmail(base)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('boom')
    }
  })
})
