/**
 * In-memory sliding-window rate limiter + client IP extraction.
 *
 * Origin: Phase 08 / FEED-02. `/api/feedback` is an unauthenticated POST that
 * triggers an outbound email on every success — without a throttle, a single
 * script can both fill the `feedback_submissions` table and burn the Resend
 * account quota.
 *
 * This app is a single long-lived Node process (pm2 `fork_mode`, `next start`
 * on port 3005), not serverless and not multi-instance, so a module-scope
 * `Map` shared by every request is the correct store — there is no Redis,
 * Upstash, or ioredis dependency in this project, and adding one is
 * explicitly out of scope for this single-instance personal-use app.
 *
 * Accepted tradeoff, documented here rather than assumed: the counters reset
 * on `pm2 restart` / redeploy. For a site whose only goal is stopping
 * runaway email, that is fine — a redeploy briefly grants everyone a fresh
 * budget.
 */

export const MAX_TRACKED_KEYS = 10_000

export type RateLimitOptions = { limit: number; windowMs: number; now?: number }

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterSeconds: number }

/** Sliding-window log: key -> array of accepted-hit timestamps. Module scope
 * because `next start` runs one long-lived process serving every request. */
const store = new Map<string, number[]>()

/**
 * Delete every key whose newest timestamp is at or before the window cutoff.
 * If the store is still at capacity after the sweep, fail open by clearing
 * it entirely — an attacker rotating `X-Forwarded-For` values could
 * otherwise grow the map without bound (memory DoS on a 3.7GB VPS). The
 * limiter exists to stop accidental/naive flooding, not to be an
 * unbreakable defence, so failing open with a bounded map is the right
 * tradeoff.
 */
function sweep(now: number, windowMs: number): void {
  const cutoff = now - windowMs
  for (const [key, hits] of store) {
    const newest = hits.length > 0 ? hits[hits.length - 1] : -Infinity
    if (newest <= cutoff) store.delete(key)
  }
  if (store.size >= MAX_TRACKED_KEYS) {
    store.clear()
    console.warn('[rate-limit] key store full, cleared')
  }
}

/**
 * Ask "has this key exceeded `limit` requests in the last `windowMs` ms?"
 *
 * Rejected requests are NOT appended to the hit log. Recording rejects would
 * turn the limiter into an ever-extending ban, so a bot behind a shared
 * NAT/CGNAT address could lock out every real visitor sharing that IP
 * indefinitely. With this rule, any client always recovers exactly
 * `windowMs` after its last *accepted* request.
 *
 * Never log the key value here — client IPs are personal data and PM2 logs
 * are unencrypted on the VPS.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now()
  if (store.size >= MAX_TRACKED_KEYS) sweep(now, options.windowMs)

  const cutoff = now - options.windowMs
  const hits = (store.get(key) ?? []).filter((t) => t > cutoff)

  if (hits.length >= options.limit) {
    store.set(key, hits)
    // Math.max(1, ...) because a Retry-After: 0 header tells a client to
    // retry immediately, which defeats the throttle.
    const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + options.windowMs - now) / 1000))
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  hits.push(now)
  store.set(key, hits)
  return { allowed: true, remaining: options.limit - hits.length }
}

/** Clears one key's history, or every key's history when called with no argument. */
export function resetRateLimit(key?: string): void {
  if (key) {
    store.delete(key)
  } else {
    store.clear()
  }
}

/** Number of distinct keys currently tracked — exported so the bounding behaviour is assertable. */
export function trackedKeyCount(): number {
  return store.size
}

export const UNKNOWN_CLIENT_IP = 'unknown'

/** Only characters valid in an IPv4/IPv6 literal, capped at 45 chars (max IPv6 literal length). */
const IP_LIKE = /^[0-9a-fA-F:.]{1,45}$/

/**
 * Turn a `Request` into a bounded, log-safe client-IP string for use as a
 * rate-limit key.
 *
 * Trust boundary: this value is client-controlled at the TCP level and is
 * only trustworthy because Cloudflare Tunnel is the sole public ingress for
 * psalter.gsdlabs.dev and overwrites `x-forwarded-for`. Anyone able to reach
 * port 3005 directly on the VPS can forge it and bypass the limit; that is
 * an accepted risk for this deployment, not a silently assumed one.
 *
 * All clients failing validation share the single `UNKNOWN_CLIENT_IP`
 * bucket, which means they collectively share one budget. Accepted: in
 * normal operation behind the tunnel this bucket is empty.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  // The first entry is the original client — proxies append themselves to the right.
  let candidate = forwardedFor ? forwardedFor.split(',')[0].trim() : ''
  if (!candidate) {
    candidate = req.headers.get('x-real-ip')?.trim() ?? ''
  }
  // Character-class + length check only (no full IPv4/IPv6 semantic validation):
  // (a) this value becomes a Map key, so an attacker must not be able to supply
  //     arbitrary-length garbage; (b) it must never reach a log line with CR/LF
  //     in it (log injection). An over-strict semantic regex would risk silently
  //     collapsing real clients into the shared 'unknown' bucket instead.
  if (!candidate || !IP_LIKE.test(candidate)) {
    return UNKNOWN_CLIENT_IP
  }
  return candidate
}
