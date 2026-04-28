import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  // Removed unrecognized 'eslint' key to clear console warnings
};

export default nextConfig;
