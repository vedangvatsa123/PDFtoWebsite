import { NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/get-platform-stats';

/**
 * /.well-known/agents.json — AI Agent Discovery Protocol
 * Tells AI agents what capabilities this site offers and how to interact.
 * Similar to robots.txt but for agentic AI systems.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';
  const stats = await getPlatformStats();

  return NextResponse.json({
    schema_version: '1.0',
    domain: 'cvin.bio',
    name: 'CVin.Bio',
    description: `Convert PDF CVs to professional websites. Browse ${stats.jobCountDisplay} tech jobs at ${stats.companyCountDisplay} companies with AI-powered skill matching.`,
    url: siteUrl,

    // AI systems that are welcome to crawl and index this site
    welcomed_agents: [
      // OpenAI
      { name: 'GPTBot', organization: 'OpenAI', purpose: 'GPT model training' },
      { name: 'ChatGPT-User', organization: 'OpenAI', purpose: 'Live web browsing in ChatGPT' },
      { name: 'OAI-SearchBot', organization: 'OpenAI', purpose: 'SearchGPT web results' },
      { name: 'GPTBot-Extended', organization: 'OpenAI', purpose: 'Extended training data' },
      // Anthropic
      { name: 'ClaudeBot', organization: 'Anthropic', purpose: 'Claude web search' },
      { name: 'Claude-Web', organization: 'Anthropic', purpose: 'Claude web browsing' },
      { name: 'Claude-SearchBot', organization: 'Anthropic', purpose: 'Claude search indexing' },
      { name: 'anthropic-ai', organization: 'Anthropic', purpose: 'Training data collection' },
      // Google
      { name: 'Google-Extended', organization: 'Google', purpose: 'Gemini AI training' },
      { name: 'Googlebot', organization: 'Google', purpose: 'Google Search indexing' },
      { name: 'Googlebot-Image', organization: 'Google', purpose: 'Google Image Search' },
      { name: 'GoogleOther', organization: 'Google', purpose: 'Google R&D crawling' },
      { name: 'Storebot-Google', organization: 'Google', purpose: 'Google Shopping' },
      // Microsoft
      { name: 'Bingbot', organization: 'Microsoft', purpose: 'Bing Search & Copilot' },
      { name: 'BingPreview', organization: 'Microsoft', purpose: 'Link preview generation' },
      { name: 'msnbot', organization: 'Microsoft', purpose: 'MSN Search crawling' },
      { name: 'adidxbot', organization: 'Microsoft', purpose: 'Bing Ads indexing' },
      // Apple
      { name: 'Applebot', organization: 'Apple', purpose: 'Siri & Spotlight search' },
      { name: 'Applebot-Extended', organization: 'Apple', purpose: 'Apple Intelligence training' },
      // Amazon
      { name: 'Amazonbot', organization: 'Amazon', purpose: 'Alexa & Amazon Q' },
      // Meta
      { name: 'Meta-ExternalAgent', organization: 'Meta', purpose: 'Meta AI / Llama training' },
      { name: 'Meta-ExternalFetcher', organization: 'Meta', purpose: 'Content fetching for AI' },
      { name: 'facebookexternalhit', organization: 'Meta', purpose: 'Link preview & sharing' },
      { name: 'Facebot', organization: 'Meta', purpose: 'Facebook crawler' },
      // Perplexity
      { name: 'PerplexityBot', organization: 'Perplexity', purpose: 'Perplexity AI search' },
      { name: 'Perplexity-User', organization: 'Perplexity', purpose: 'Live search queries' },
      // ByteDance
      { name: 'Bytespider', organization: 'ByteDance', purpose: 'TikTok / Doubao AI' },
      // Cohere
      { name: 'cohere-ai', organization: 'Cohere', purpose: 'Cohere model training' },
      // Mistral
      { name: 'MistralBot', organization: 'Mistral AI', purpose: 'Mistral model training' },
      // xAI
      { name: 'xAI-Grok', organization: 'xAI', purpose: 'Grok AI training' },
      // You.com
      { name: 'YouBot', organization: 'You.com', purpose: 'You.com AI search engine' },
      // Huawei
      { name: 'PanguBot', organization: 'Huawei', purpose: 'PanGu model training' },
      // Samsung
      { name: 'SamsungBot', organization: 'Samsung', purpose: 'Bixby & Samsung AI' },
      // Baidu
      { name: 'Baiduspider', organization: 'Baidu', purpose: 'Baidu Search & ERNIE' },
      // Yandex
      { name: 'YandexBot', organization: 'Yandex', purpose: 'Yandex Search & YandexGPT' },
      // Naver
      { name: 'NaverBot', organization: 'Naver', purpose: 'Naver Search & HyperCLOVA' },
      { name: 'Yeti', organization: 'Naver', purpose: 'Naver web crawler' },
      // DuckDuckGo
      { name: 'DuckDuckBot', organization: 'DuckDuckGo', purpose: 'DuckDuckGo AI search' },
      // Brave
      { name: 'BraveBot', organization: 'Brave', purpose: 'Brave Search & Leo AI' },
      // Qwant
      { name: 'Qwantify', organization: 'Qwant', purpose: 'Qwant EU search engine' },
      // Hugging Face
      { name: 'HuggingFaceBot', organization: 'Hugging Face', purpose: 'Dataset & model indexing' },
      // Common Crawl
      { name: 'CCBot', organization: 'Common Crawl', purpose: 'Open web dataset' },
      // Allen Institute
      { name: 'AI2Bot', organization: 'Allen Institute for AI', purpose: 'AI research indexing' },
      // Diffbot
      { name: 'Diffbot', organization: 'Diffbot', purpose: 'Knowledge graph extraction' },
      // Neeva
      { name: 'Neevabot', organization: 'Neeva/Snowflake', purpose: 'AI search (now Snowflake)' },
      // iAsk
      { name: 'iaskspider', organization: 'iAsk.AI', purpose: 'iAsk AI search engine' },
      // Timpi
      { name: 'Timpibot', organization: 'Timpi', purpose: 'Decentralized web search' },
      // Mojeek
      { name: 'MojeekBot', organization: 'Mojeek', purpose: 'Independent search engine' },
      // PetalBot
      { name: 'PetalBot', organization: 'Huawei/Petal', purpose: 'Petal Search' },
      // Sogou
      { name: 'Sogou', organization: 'Sogou/Tencent', purpose: 'Sogou Search' },
      // Seznam
      { name: 'SeznamBot', organization: 'Seznam', purpose: 'Czech search engine' },
      // Social & Link Preview
      { name: 'Twitterbot', organization: 'X/Twitter', purpose: 'Tweet card previews' },
      { name: 'LinkedInBot', organization: 'LinkedIn', purpose: 'Post link previews' },
      { name: 'Slackbot', organization: 'Slack', purpose: 'Link unfurling' },
      { name: 'WhatsApp', organization: 'WhatsApp/Meta', purpose: 'Link previews' },
      { name: 'TelegramBot', organization: 'Telegram', purpose: 'Link previews' },
      { name: 'Discordbot', organization: 'Discord', purpose: 'Embed previews' },
      { name: 'redditbot', organization: 'Reddit', purpose: 'Link previews' },
      { name: 'Pinterestbot', organization: 'Pinterest', purpose: 'Pin previews' },
      // Archive & Academic
      { name: 'archive.org_bot', organization: 'Internet Archive', purpose: 'Wayback Machine archiving' },
      { name: 'ScholarBot', organization: 'Google Scholar', purpose: 'Academic indexing' },
      // Webz.io & Data
      { name: 'Webzio-Extended', organization: 'Webz.io', purpose: 'Web data platform' },
      { name: 'DataForSeoBot', organization: 'DataForSEO', purpose: 'SEO data API' },
      // Scrapy ecosystem
      { name: 'Scrapy', organization: 'Scrapy', purpose: 'Open-source web scraping' },
      { name: 'VelenPublicWebCrawler', organization: 'Velen', purpose: 'Public web indexing' },
      { name: 'Nicecrawler', organization: 'Nicecrawler', purpose: 'Web crawling' },
      { name: 'omgilibot', organization: 'Omgili/Webz', purpose: 'Discussion indexing' },
      { name: 'ICC-Crawler', organization: 'NICT Japan', purpose: 'Research crawler' },
      { name: 'Kangaroo Bot', organization: 'Kangaroo', purpose: 'Web crawling' },
    ],

    capabilities: [
      {
        name: 'Job Search',
        description: `Search ${stats.jobCountDisplay} tech job listings across ${stats.companyCountDisplay} companies. Filter by role, location, company, and job type.`,
        endpoint: `${siteUrl}/api/jobs`,
        method: 'GET',
        parameters: {
          q: 'Search query (title or company name)',
          type: 'Job type filter: full_time, contract, part_time, internship, freelance',
          location: 'Location filter: remote, onsite',
          page: 'Page number (default: 1)',
          limit: 'Results per page (default: 20, max: 100)',
        },
      },
      {
        name: 'Company Careers',
        description: 'View all open roles at a specific company with hiring data, locations, and FAQ',
        url_pattern: `${siteUrl}/{company-slug}`,
        examples: [
          `${siteUrl}/stripe`,
          `${siteUrl}/openai`,
          `${siteUrl}/anthropic`,
          `${siteUrl}/cloudflare`,
          `${siteUrl}/figma`,
        ],
      },
      {
        name: 'Professional Profile Lookup',
        description: 'View structured professional profiles with schema.org Person markup, work history, education, skills, and social links',
        url_pattern: `${siteUrl}/{username}`,
        structured_data: 'schema.org/Person',
      },
      {
        name: 'CV to Website Conversion',
        description: 'Upload a PDF CV and get a professional website with a permanent URL',
        url: `${siteUrl}/signup`,
      },
    ],

    content_resources: [
      {
        name: 'Tech Talent Report 2026',
        url: `${siteUrl}/tech-talent-report`,
        description: `Analysis of ${stats.jobCountDisplay} tech job listings. Skills demand, hiring trends, and compensation data.`,
        type: 'research_report',
      },
      {
        name: 'Tech Layoffs Report 2026',
        url: `${siteUrl}/layoffs-report`,
        description: '750,000+ tech workers laid off since 2020. Data on who is cutting, why, and labor market impact.',
        type: 'research_report',
      },
      {
        name: 'Remote Talent Report 2026',
        url: `${siteUrl}/remote-talent-report`,
        description: '34 million remote workers. Hiring trends, compensation premiums, and RTO mandate data.',
        type: 'research_report',
      },
      {
        name: 'Career Articles & Blog',
        url: `${siteUrl}/blog`,
        description: 'Practical career guides, resume strategies, ATS optimization, and job search insights.',
        type: 'blog',
      },
    ],

    context_files: {
      llms_txt: `${siteUrl}/llms.txt`,
      llms_full: `${siteUrl}/llms-full.txt`,
      ai_plugin: `${siteUrl}/.well-known/ai-plugin.json`,
      sitemap: `${siteUrl}/sitemap.xml`,
      robots: `${siteUrl}/robots.txt`,
    },

    contact: {
      email: 'hello@cvin.bio',
      url: `${siteUrl}/contact`,
    },

    social: {
      x: 'https://x.com/cvinbio',
      linkedin: 'https://www.linkedin.com/company/cvinbio',
      telegram: 'https://t.me/cvinbio',
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
