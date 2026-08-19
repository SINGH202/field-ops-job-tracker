import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function valueFromRootEnv(name: string): string | undefined {
  const envPath = path.join(__dirname, "../../.env");
  if (!fs.existsSync(envPath)) return undefined;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}

const apiProxyTarget =
  process.env.API_PROXY_TARGET ||
  valueFromRootEnv("API_PROXY_TARGET") ||
  "http://127.0.0.1:3001";

console.log(`[web] proxy /backend → ${apiProxyTarget}`);

const nextConfig: NextConfig = {
  transpilePackages: ["@field-ops/contracts"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
