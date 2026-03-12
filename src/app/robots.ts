import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/editor', '/api/'],
      },
      // Allow AI crawlers to index public profile pages
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Googlebot'],
        allow: '/',
        disallow: ['/editor', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
