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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.softr-files.com',
        pathname: '/applications/408bc320-dc3f-4d12-8434-de0ccf926f90/assets/**',
      },
    ],
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
