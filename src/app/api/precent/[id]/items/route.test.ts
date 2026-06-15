// Wave 0 stub (RED) — turned GREEN in plan 03
import { describe, it, expect } from 'vitest'
import { POST } from './route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
function req(body: unknown) {
  return new Request('http://test/api/precent/1/items', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/precent/[id]/items', () => {
  it('rejects missing psalmId with 400', async () => {
    const res = await POST(req({}) as any, ctx('1') as any)
    expect(res.status).toBe(400)
  })
  it('rejects non-integer set id with 400', async () => {
    const res = await POST(req({ psalmId: 23 }) as any, ctx('abc') as any)
    expect(res.status).toBe(400)
  })
})
