import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force Turbopack to use the correct project root
  turbopack: {
    resolveAlias: {
      "@/*": ["./src/*"],
    },
  },
};

export default nextConfig;
