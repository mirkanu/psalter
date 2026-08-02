import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  escapeHtml,
  maskEmail,
  buildUnsubscribeUrl,
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
