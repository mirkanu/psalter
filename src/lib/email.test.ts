import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sendMock = vi.fn()
const ResendMock = vi.fn(() => ({ emails: { send: sendMock } }))

vi.mock('resend', () => ({
  Resend: ResendMock,
}))

// Imports must come after vi.mock so the mock is in place before module evaluation.
import { sendEmail, getFromAddress, isEmailConfigured, DEFAULT_FROM_ADDRESS } from './email'

describe('getFromAddress', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns PSALTER_RESEND_FROM_ADDRESS when set', () => {
    vi.stubEnv('PSALTER_RESEND_FROM_ADDRESS', 'Custom Sender <custom@mail.gsdlabs.dev>')
    expect(getFromAddress()).toBe('Custom Sender <custom@mail.gsdlabs.dev>')
  })

  it('returns DEFAULT_FROM_ADDRESS when unset', () => {
    vi.stubEnv('PSALTER_RESEND_FROM_ADDRESS', undefined as unknown as string)
    expect(getFromAddress()).toBe(DEFAULT_FROM_ADDRESS)
  })

  it('returns DEFAULT_FROM_ADDRESS when empty string', () => {
    vi.stubEnv('PSALTER_RESEND_FROM_ADDRESS', '')
    expect(getFromAddress()).toBe(DEFAULT_FROM_ADDRESS)
  })
})

describe('isEmailConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns false when PSALTER_RESEND_API_KEY is unset', () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', undefined as unknown as string)
    expect(isEmailConfigured()).toBe(false)
  })

  it('returns true when PSALTER_RESEND_API_KEY is set', () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')
    expect(isEmailConfigured()).toBe(true)
  })
})

describe('sendEmail', () => {
  beforeEach(() => {
    sendMock.mockReset()
    ResendMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('resolves ok:false and never constructs the client when the API key is absent', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', undefined as unknown as string)

    const result = await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('PSALTER_RESEND_API_KEY')
    }
    expect(ResendMock).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('resolves ok:true with the id on success', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')
    sendMock.mockResolvedValue({ data: { id: 'test-id-123' }, error: null })

    const result = await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(result).toEqual({ ok: true, id: 'test-id-123' })
  })

  it('sends from getFromAddress() with both html and text in the payload', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')
    vi.stubEnv('PSALTER_RESEND_FROM_ADDRESS', undefined as unknown as string)
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null })

    await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(sendMock).toHaveBeenCalledWith({
      from: DEFAULT_FROM_ADDRESS,
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })
  })

  it('ignores any caller-supplied from field', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null })

    await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
      from: 'evil@example.com',
    } as never)

    const callArgs = sendMock.mock.calls[0][0]
    expect(callArgs.from).toBe(getFromAddress())
  })

  it('resolves ok:false without throwing on an in-band SDK error', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'Domain not verified', name: 'validation_error' },
    })

    const result = await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Domain not verified')
    }
  })

  it('resolves ok:false without throwing when the SDK rejects', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')
    sendMock.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('ECONNREFUSED')
    }
  })

  it('never leaks the API key in the error string', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_SENTINEL_TESTKEY_0123456789')
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'Some SDK failure', name: 'error' },
    })

    const result = await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).not.toContain('SENTINEL')
    }
  })

  it('rejects header injection in to/subject/replyTo without calling the SDK', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')

    const resultTo = await sendEmail({
      to: 'someone@example.com\r\nBcc: evil@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })
    expect(resultTo.ok).toBe(false)
    if (!resultTo.ok) expect(resultTo.error).toContain('invalid')

    const resultSubject = await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello\nBcc: evil@example.com',
      html: '<p>Hi</p>',
      text: 'Hi',
    })
    expect(resultSubject.ok).toBe(false)
    if (!resultSubject.ok) expect(resultSubject.error).toContain('invalid')

    const resultReplyTo = await sendEmail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
      replyTo: 'someone@example.com\r\nBcc: evil@example.com',
    })
    expect(resultReplyTo.ok).toBe(false)
    if (!resultReplyTo.ok) expect(resultReplyTo.error).toContain('invalid')

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects empty to (string) without calling the SDK', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')

    const result = await sendEmail({
      to: '',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(result.ok).toBe(false)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects empty to (array) without calling the SDK', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')

    const result = await sendEmail({
      to: [],
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(result.ok).toBe(false)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects empty subject without calling the SDK', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')

    const result = await sendEmail({
      to: 'someone@example.com',
      subject: '',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    expect(result.ok).toBe(false)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('accepts to as a string array and forwards it unchanged', async () => {
    vi.stubEnv('PSALTER_RESEND_API_KEY', 're_test_key_123')
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null })

    await sendEmail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })

    const callArgs = sendMock.mock.calls[0][0]
    expect(callArgs.to).toEqual(['a@example.com', 'b@example.com'])
  })
})
