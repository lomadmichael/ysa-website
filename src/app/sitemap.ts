import type { MetadataRoute } from 'next';

const BASE_URL = 'https://ysa-website.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/about',
    '/about/purpose',
    '/about/history',
    '/about/organization',
    '/about/location',
    '/business',
    '/business/competition',
    '/business/education',
    '/business/youth',
    '/business/safety',
    '/programs',
    '/programs/instructor',
    '/programs/referee',
    '/programs/specialized',
    '/schedule',
    '/schedule/open',
    '/schedule/closed',
    '/schedule/results',
    '/festival',
    '/notice',
    '/notice/press',
    '/notice/gallery',
    '/notice/docs',
    '/notice/faq',
    '/contact',
    '/contact/membership',
    '/contact/partnership',
  ];

  return staticPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.split('/').length <= 2 ? 0.8 : 0.6,
  }));
}
