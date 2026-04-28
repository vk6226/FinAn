import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Ignore type errors during build for demo stability
    ignoreBuildErrors: true,
  },
  eslint: {
    // Modern way to ignore ESLint during project builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
