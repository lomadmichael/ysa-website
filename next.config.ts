import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node-ical 및 의존성은 Node 런타임에서만 동작하므로 번들링에서 제외
  serverExternalPackages: ['node-ical'],
  images: {
    // Supabase Storage(보도자료 OG 썸네일 등)에서 next/image로 로드 허용
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
