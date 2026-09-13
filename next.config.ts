import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const dir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: dir,
  turbopack: { root: dir },
  webpack: (config) => {
    config.watchOptions = { ignored: ["**/node_modules/**", "**/.git/**"] };
    return config;
  },
};

export default nextConfig;
