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
          // OpenAI
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          // Anthropic
          'ClaudeBot',
          'Claude-Web',
          'Claude-SearchBot',
          // Google
          'Googlebot',
          'GoogleOther',
          'Google-Extended',
          // Perplexity
          'PerplexityBot',
          'Perplexity-User',
          // Meta
          'Meta-ExternalAgent',
          'facebookexternalhit',
          // Apple
          'Applebot',
          'Applebot-Extended',
          // Amazon
          'Amazonbot',
          // ByteDance
          'Bytespider',
          // Hugging Face
          'HuggingFaceBot',
          // Common Crawl
          'CCBot',
          // Microsoft
          'Bingbot',
          'BingPreview',
          // Cohere
          'cohere-ai',
          // AI2
          'AI2Bot',
          // You.com
          'YouBot',
        ],
        allow: '/',
        disallow: ['/editor', '/api/', '/admin'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
