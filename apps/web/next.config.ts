import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@field-ops/contracts"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
