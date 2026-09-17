import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: isProd ? '/cloudphone-2025meichuhackathon-demo/' : '',
  basePath: isProd ? '/cloudphone-2025meichuhackathon-demo' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
