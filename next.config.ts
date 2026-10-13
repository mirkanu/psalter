import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/search',
        destination: '/psalms',
        permanent: true,
      },
    ]
  },
  images: {
    // Phase 15.2 Plan 01: declare the single quality the site uses so any
    // future `quality` prop on <Image> is validated against this list
    // (Next.js 16 emits a config warning otherwise). Default is 75; we do
    // not override it anywhere, so this matches the runtime default exactly.
    qualities: [75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.softr-files.com',
        pathname: '/applications/408bc320-dc3f-4d12-8434-de0ccf926f90/assets/**',
      },
    ],
  },
  async headers() {
    // Phase 19 PERF-03 (Layer 3 — defence in depth): emit s-maxage=1y on T2 path
    // globs so Vercel edge emits the right Cache-Control header even before the
    // Cloudflare Cache Rule takes effect. The Cloudflare Cache Rule (created in
    // Task 4) is the canonical mechanism — these headers cover the brief window
    // between deploy and Cache Rule propagation.
    const t2CacheControl = [
      { key: 'Cache-Control', value: 'public, s-maxage=31536000, stale-while-revalidate=604800' },
    ]
    return [
      {
        source: '/psalms/:id/study',
        headers: t2CacheControl,
      },
      {
        source: '/tunes/:slug',
        headers: t2CacheControl,
      },
      {
        source: '/explore/authors/:author',
        headers: t2CacheControl,
      },
      {
        source: '/explore/topics/:slug',
        headers: t2CacheControl,
      },
      {
        source: '/explore/naves/:slug',
        headers: t2CacheControl,
      },
      {
        source: '/explore/messianic',
        headers: t2CacheControl,
      },
      {
        source: '/precent/:id(\\d+)',
        headers: t2CacheControl,
      },
      {
        source: '/precent/:id(\\d+)/sing/:pos(\\d+)',
        headers: t2CacheControl,
      },
    ]
  },
  // Phase 04.9.15 Plan 05 (Rule 3 - blocking-issue fix): this Hetzner VPS has
  // only 3.7GB RAM total and runs at ~2.4GB baseline across other services
  // (see CLAUDE.md "Hetzner VPS memory constraints"). Default build worker
  // concurrency was consistently getting SIGTERM'd mid-build on this box
  // (system-level OOM pressure killing a build worker, reproduced with both
  // Turbopack and webpack) before this fix. Limiting to a single worker
  // process keeps peak RSS low enough for `next build` to complete reliably
  // here — combined with adding temporary swap headroom for this session
  // (see quick-task notes), the build now completes in ~2 minutes.
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
