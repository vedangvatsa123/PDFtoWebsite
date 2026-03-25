import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/editor', '/api/', '/admin'],
      },
      // Allow AI crawlers to index public profile pages
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Googlebot'],
        allow: '/',
        disallow: ['/editor', '/api/', '/admin'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
