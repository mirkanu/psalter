/**
 * Site-wide default Link wrapper (issue #82, Phase 1.2).
 *
 * Re-exports next/link as a non-blocking Link. Prefetch is disabled by default
 * because we cache HTML at the Vercel / Cloudflare edges (cache-tactics.md) —
 * prefetching renders on hover would waste requests on routes that already
 * return instantly.
 *
 * Opt back in by passing `prefetch` explicitly:
 *   <Link href="…" prefetch />             // hover prefetch on this link
 *   <Link href="…" prefetch={null} />      // autosize prefetch on this link
 *
 * Use explicit `prefetch` only on links the visitor-workflows doc identifies
 * as latency-critical (currently: modal psalm picker's Mode A/C left/right
 * nav, which warm the next psalm pre-emptively for the sing page).
 */
import NextLink from "next/link"
import type { ComponentProps } from "react"

export type LinkProps = ComponentProps<typeof NextLink>

export default function Link({ prefetch, ...rest }: LinkProps) {
  if (prefetch === undefined) {
    return <NextLink {...rest} prefetch={false} />
  }
  return <NextLink {...rest} prefetch={prefetch} />
}
