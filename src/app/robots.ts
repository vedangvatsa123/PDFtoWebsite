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
      // Explicitly welcome AI agent crawlers to index public profiles
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'PerplexityBot',
          'Googlebot',
          'GoogleOther',
          'Applebot-Extended',
          'Meta-ExternalAgent',
          'cohere-ai',
        ],
        allow: '/',
        disallow: ['/editor', '/api/', '/admin'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
