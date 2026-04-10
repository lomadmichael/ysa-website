import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node-ical 및 의존성은 Node 런타임에서만 동작하므로 번들링에서 제외
  serverExternalPackages: ['node-ical'],
};

export default nextConfig;
