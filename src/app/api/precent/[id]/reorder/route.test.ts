// Wave 0 stub (RED) — turned GREEN in plan 04
import { describe, it, expect } from 'vitest'
import { POST } from './route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
function req(body: unknown) {
  return new Request('http://test/api/precent/1/reorder', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/precent/[id]/reorder', () => {
  it('rejects a non-array ids body with 400', async () => {
    const res = await POST(req({ ids: 'nope' }) as any, ctx('1') as any)
    expect(res.status).toBe(400)
  })
  it('rejects ids containing non-numbers with 400', async () => {
    const res = await POST(req({ ids: [1, 'x', 3] }) as any, ctx('1') as any)
    expect(res.status).toBe(400)
  })
})
