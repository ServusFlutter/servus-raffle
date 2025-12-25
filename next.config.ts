import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: cacheComponents disabled because it conflicts with auth flows
  // that require cookies (admin pages, etc.)
};

export default nextConfig;
