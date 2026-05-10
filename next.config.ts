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
};

export default nextConfig;
