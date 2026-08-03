import { describe, it, expect, vi, beforeEach } from 'vitest'

const { fromMock, selectMock, sendMock } = vi.hoisted(() => {
  const fromMock = vi.fn(async () => [] as { email: string; unsubscribeToken: string }[])
  const selectMock = vi.fn(() => ({ from: fromMock }))
  const sendMock = vi.fn(async (_input: unknown) => ({ ok: true, id: 'm1' }))
  return { fromMock, selectMock, sendMock }
})
vi.mock('@/db', () => ({ db: { select: selectMock } }))
vi.mock('@/lib/changelog-email', () => ({ sendChangelogBroadcastEmail: sendMock }))

import { broadcastToSubscribers } from './changelog-broadcast'

const SUBS = [
  { email: 'a@x.test', unsubscribeToken: 'tok-a' },
  { email: 'b@x.test', unsubscribeToken: 'tok-b' },
  { email: 'c@x.test', unsubscribeToken: 'tok-c' },
]

describe('broadcastToSubscribers', () => {
  beforeEach(() => {
    selectMock.mockClear()
    fromMock.mockClear()
    sendMock.mockClear()
    fromMock.mockImplementation(async () => SUBS)
    sendMock.mockImplementation(async (_input: unknown) => ({ ok: true, id: 'm1' }))
  })

  it('calls sendChangelogBroadcastEmail exactly three times for three subscribers', async () => {
    await broadcastToSubscribers({ title: 't', body: 'b' }, { delayMs: 0 })
    expect(sendMock).toHaveBeenCalledTimes(3)
  })

  it('sends each call with that subscriber own to and unsubscribeToken, no cross-contamination', async () => {
    await broadcastToSubscribers({ title: 't', body: 'b' }, { delayMs: 0 })
    expect(sendMock.mock.calls[0][0]).toMatchObject({ to: 'a@x.test', unsubscribeToken: 'tok-a' })
    expect(sendMock.mock.calls[1][0]).toMatchObject({ to: 'b@x.test', unsubscribeToken: 'tok-b' })
    expect(sendMock.mock.calls[2][0]).toMatchObject({ to: 'c@x.test', unsubscribeToken: 'tok-c' })
  })

  it('sends each call with the post title and body unchanged', async () => {
    await broadcastToSubscribers({ title: 'My Title', body: 'My Body' }, { delayMs: 0 })
    for (const call of sendMock.mock.calls) {
      expect(call[0]).toMatchObject({ title: 'My Title', body: 'My Body' })
    }
  })

  it('sends strictly sequentially — no overlap between sends', async () => {
    const events: string[] = []
    sendMock.mockImplementation(async (input: unknown) => {
      const { to } = input as { to: string }
      events.push(`start:${to}`)
      await new Promise((resolve) => setTimeout(resolve, 5))
      events.push(`end:${to}`)
      return { ok: true, id: 'm1' }
    })
    await broadcastToSubscribers({ title: 't', body: 'b' }, { delayMs: 0 })
    expect(events).toEqual([
      'start:a@x.test',
      'end:a@x.test',
      'start:b@x.test',
      'end:b@x.test',
      'start:c@x.test',
      'end:c@x.test',
    ])
  })

  it('continues to the third subscriber when the second send resolves ok:false, and reports sent/failed', async () => {
    sendMock.mockImplementation(async (input: unknown) => {
      const { to } = input as { to: string }
      if (to === 'b@x.test') return { ok: false, error: 'bounced' }
      return { ok: true, id: 'm1' }
    })
    const summary = await broadcastToSubscribers({ title: 't', body: 'b' }, { delayMs: 0 })
    expect(sendMock).toHaveBeenCalledTimes(3)
    expect(summary).toEqual({ sent: 2, failed: 1 })
  })

  it('continues to the third subscriber when the second send throws, and reports sent/failed', async () => {
    sendMock.mockImplementation(async (input: unknown) => {
      const { to } = input as { to: string }
      if (to === 'b@x.test') throw new Error('network error')
      return { ok: true, id: 'm1' }
    })
    const summary = await broadcastToSubscribers({ title: 't', body: 'b' }, { delayMs: 0 })
    expect(sendMock).toHaveBeenCalledTimes(3)
    expect(summary).toEqual({ sent: 2, failed: 1 })
  })

  it('with zero subscribers, attempts no send and returns sent:0 failed:0', async () => {
    fromMock.mockImplementation(async () => [])
    const summary = await broadcastToSubscribers({ title: 't', body: 'b' }, { delayMs: 0 })
    expect(sendMock).not.toHaveBeenCalled()
    expect(summary).toEqual({ sent: 0, failed: 0 })
  })

  it('resolves sent:0 failed:0 and does not throw when the subscriber SELECT throws', async () => {
    fromMock.mockImplementation(async () => {
      throw new Error('db down')
    })
    const summary = await broadcastToSubscribers({ title: 't', body: 'b' }, { delayMs: 0 })
    expect(sendMock).not.toHaveBeenCalled()
    expect(summary).toEqual({ sent: 0, failed: 0 })
  })

  it('recipients come only from the DB — a to-like field on the post argument has no effect', async () => {
    await broadcastToSubscribers(
      { title: 't', body: 'b', to: 'attacker@evil.test' } as unknown as { title: string; body: string },
      { delayMs: 0 },
    )
    for (const call of sendMock.mock.calls) {
      expect((call[0] as { to: string }).to).not.toBe('attacker@evil.test')
    }
  })
})
