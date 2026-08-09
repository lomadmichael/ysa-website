import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/apply/surf-camp/my',
          '/apply/surf-camp/admin',
        ],
      },
    ],
    sitemap: 'https://ysakorea.com/sitemap.xml',
    host: 'https://ysakorea.com',
  };
}
