import NextLink from "next/link";
import type { ComponentProps } from "react";

type NextLinkProps = ComponentProps<typeof NextLink>;

/**
 * Default-on-no-prefetch wrapper around next/link.
 *
 * Next.js App Router prefetches linked routes by default, which holds the
 * current page render until those prefetches resolve. On pages with many
 * authenticated or expensive sibling routes (e.g. /precent/[id]/sing/[pos])
 * this turns into a multi-second blocking delay before the page is
 * interactive. Defaulting to prefetch={false} keeps the current page
 * fast; opt back in per-link only where the next-click latency saving
 * is worth the cost.
 */
const Link = ({ prefetch, ...rest }: NextLinkProps) => (
  <NextLink {...rest} prefetch={prefetch ?? false} />
);

export default Link;
