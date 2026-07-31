import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  DEFAULT_FEEDBACK_TO_ADDRESS,
  MAX_SUBJECT_LENGTH,
  buildFeedbackEmail,
  escapeHtml,
  getFeedbackToAddress,
  type FeedbackEmailInput,
} from './feedback-email'

const base: FeedbackEmailInput = {
  message: 'Nice site',
  name: 'Alice',
  email: 'alice@example.com',
  pageUrl: 'https://psalter.gsdlabs.dev/psalms/23',
  submittedAt: new Date('2026-07-31T10:00:00.000Z'),
}

describe('escapeHtml', () => {
  it('escapes script tags', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('escapes ampersand first, without double-escaping', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes quotes', () => {
    const result = escapeHtml('"quoted" and \'single\'')
    expect(result).toContain('&quot;')
    expect(result).toContain('&#39;')
    expect(result).not.toContain('"')
    expect(result).not.toContain("'")
  })

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('plain text')).toBe('plain text')
  })
})

describe('getFeedbackToAddress', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the default when unset', () => {
    vi.stubEnv('PSALTER_FEEDBACK_TO_ADDRESS', undefined as unknown as string)
    expect(getFeedbackToAddress()).toBe('manuelkuhs@gmail.com')
  })

  it('returns the default when empty string', () => {
    vi.stubEnv('PSALTER_FEEDBACK_TO_ADDRESS', '')
    expect(getFeedbackToAddress()).toBe('manuelkuhs@gmail.com')
  })

  it('returns the env value when set', () => {
    vi.stubEnv('PSALTER_FEEDBACK_TO_ADDRESS', 'other@example.com')
    expect(getFeedbackToAddress()).toBe('other@example.com')
  })
})

describe('buildFeedbackEmail', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('to equals getFeedbackToAddress()', () => {
    const payload = buildFeedbackEmail(base)
    expect(payload.to).toBe(getFeedbackToAddress())
  })

  it('subject includes the submitter name', () => {
    const payload = buildFeedbackEmail(base)
    expect(payload.subject).toBe('CPRC Psalter feedback from Alice')
  })

  it('subject falls back to anonymous when name is null', () => {
    const payload = buildFeedbackEmail({ ...base, name: null })
    expect(payload.subject).toBe('CPRC Psalter feedback from anonymous')
  })

  it('subject falls back to anonymous when name is whitespace only', () => {
    const payload = buildFeedbackEmail({ ...base, name: '   ' })
    expect(payload.subject).toBe('CPRC Psalter feedback from anonymous')
  })

  it('subject has no CR/LF and is flattened when name contains header injection', () => {
    const payload = buildFeedbackEmail({ ...base, name: 'Alice\r\nBcc: evil@example.com' })
    expect(payload.subject).not.toContain('\r')
    expect(payload.subject).not.toContain('\n')
    expect(payload.subject).toBe('CPRC Psalter feedback from Alice Bcc: evil@example.com')
  })

  it('subject is capped at MAX_SUBJECT_LENGTH characters', () => {
    const payload = buildFeedbackEmail({ ...base, name: 'x'.repeat(500) })
    expect(payload.subject.length).toBeLessThanOrEqual(MAX_SUBJECT_LENGTH)
  })

  it('text contains the raw, unescaped message', () => {
    const payload = buildFeedbackEmail(base)
    expect(payload.text).toContain('Nice site')
  })

  it('text contains labels and the ISO timestamp', () => {
    const payload = buildFeedbackEmail(base)
    expect(payload.text).toContain('From:')
    expect(payload.text).toContain('Email:')
    expect(payload.text).toContain('Page:')
    expect(payload.text).toContain('Submitted:')
    expect(payload.text).toContain('2026-07-31T10:00:00.000Z')
  })

  it('text shows (not given) for null name/email/pageUrl', () => {
    const payload = buildFeedbackEmail({
      ...base,
      name: null,
      email: null,
      pageUrl: null,
    })
    const notGivenCount = (payload.text.match(/\(not given\)/g) || []).length
    expect(notGivenCount).toBe(3)
  })

  it('html escapes a script tag in the message', () => {
    const payload = buildFeedbackEmail({ ...base, message: '<script>alert(1)</script>' })
    expect(payload.html).toContain('&lt;script&gt;')
    expect(payload.html).not.toContain('<script>')
  })

  it('html escapes an onerror attribute in the name', () => {
    const payload = buildFeedbackEmail({ ...base, name: '<img src=x onerror=alert(1)>' })
    expect(payload.html).not.toContain('onerror=alert(1)')
    expect(payload.html).not.toMatch(/<img/)
  })

  it('html renders a javascript: pageUrl as escaped plain text, never a link', () => {
    const payload = buildFeedbackEmail({ ...base, pageUrl: 'javascript:alert(1)' })
    expect(payload.html).not.toContain('href=')
  })

  it('html never contains href= for the base input', () => {
    const payload = buildFeedbackEmail(base)
    expect((payload.html.match(/href=/g) || []).length).toBe(0)
  })

  it('html contains white-space:pre-wrap', () => {
    const payload = buildFeedbackEmail(base)
    expect(payload.html).toContain('white-space:pre-wrap')
  })

  it('replyTo equals the submitter email for the base input', () => {
    const payload = buildFeedbackEmail(base)
    expect(payload.replyTo).toBe('alice@example.com')
  })

  it('replyTo is undefined when email is null', () => {
    const payload = buildFeedbackEmail({ ...base, email: null })
    expect(payload.replyTo).toBeUndefined()
  })

  it('replyTo is undefined when email is not a valid email', () => {
    const payload = buildFeedbackEmail({ ...base, email: 'not-an-email' })
    expect(payload.replyTo).toBeUndefined()
  })

  it('replyTo is undefined when email contains header injection', () => {
    const payload = buildFeedbackEmail({
      ...base,
      email: 'alice@example.com\r\nBcc: evil@example.com',
    })
    expect(payload.replyTo).toBeUndefined()
  })

  it('submittedAt defaults to now when omitted', () => {
    const { submittedAt: _submittedAt, ...rest } = base
    const payload = buildFeedbackEmail(rest)
    const match = payload.text.match(/Submitted: (.+)/)
    expect(match).not.toBeNull()
    const parsed = new Date(match![1])
    expect(Number.isNaN(parsed.getTime())).toBe(false)
  })
})

const { sendEmailMock } = vi.hoisted(() => ({ sendEmailMock: vi.fn() }))
vi.mock('./email', () => ({ sendEmail: sendEmailMock }))

describe('sendFeedbackNotification', () => {
  beforeEach(() => {
    sendEmailMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls sendEmail exactly once with the built payload', async () => {
    const { sendFeedbackNotification } = await import('./feedback-email')
    sendEmailMock.mockResolvedValue({ ok: true, id: 'msg-1' })

    await sendFeedbackNotification(base)

    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendEmailMock).toHaveBeenCalledWith(buildFeedbackEmail(base))
  })

  it('returns the ok:true result on success', async () => {
    const { sendFeedbackNotification } = await import('./feedback-email')
    sendEmailMock.mockResolvedValue({ ok: true, id: 'msg-1' })

    const result = await sendFeedbackNotification(base)

    expect(result).toEqual({ ok: true, id: 'msg-1' })
  })

  it('returns ok:false and does not throw when sendEmail resolves ok:false', async () => {
    const { sendFeedbackNotification } = await import('./feedback-email')
    sendEmailMock.mockResolvedValue({ ok: false, error: 'Domain not verified' })

    const result = await sendFeedbackNotification(base)

    expect(result.ok).toBe(false)
  })

  it('returns ok:false and does not throw when sendEmail rejects', async () => {
    const { sendFeedbackNotification } = await import('./feedback-email')
    sendEmailMock.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await sendFeedbackNotification(base)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('ECONNREFUSED')
    }
  })

  it('logs a console.error beginning with the feedback prefix on failure', async () => {
    const { sendFeedbackNotification } = await import('./feedback-email')
    sendEmailMock.mockResolvedValue({ ok: false, error: 'Domain not verified' })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await sendFeedbackNotification(base)

    expect(errorSpy).toHaveBeenCalledWith(
      '[feedback] notification email failed:',
      'Domain not verified',
    )
  })

  it('does not log on the success path', async () => {
    const { sendFeedbackNotification } = await import('./feedback-email')
    sendEmailMock.mockResolvedValue({ ok: true, id: 'msg-1' })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await sendFeedbackNotification(base)

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('resolves (never rejects) when sendEmail rejects', async () => {
    const { sendFeedbackNotification } = await import('./feedback-email')
    sendEmailMock.mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(sendFeedbackNotification(base)).resolves.toBeDefined()
  })
})
