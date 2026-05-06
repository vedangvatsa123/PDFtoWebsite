import { NextResponse } from 'next/server';

// ── Tech news RSS sources ──
const RSS_FEEDS = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', icon: 'techcrunch.com' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', icon: 'theverge.com' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', icon: 'arstechnica.com' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage?count=30', icon: 'news.ycombinator.com' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', icon: 'technologyreview.com' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', icon: 'wired.com' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', icon: 'venturebeat.com' },
  { name: 'The Information', url: 'https://www.theinformation.com/feed', icon: 'theinformation.com' },
];

interface NewsItem {
  title: string;
  url: string;
  source: string;
  sourceIcon: string;
  publishedAt: string;
  description: string;
}

// Simple XML tag extraction (no dependency needed)
function extractTag(xml: string, tag: string): string {
  // Try <tag>...<![CDATA[...]]></tag> first
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i'));
  if (cdataMatch) return cdataMatch[1].trim();
  // Then plain <tag>...</tag>
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(text: string, max = 180): string {
  if (!text || text.length <= max) return text || '';
  const trimmed = text.slice(0, max);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
}

function parseRSS(xml: string, source: string, icon: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // RSS 2.0 format
  const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const item of rssItems.slice(0, 15)) {
    const title = stripHtml(extractTag(item, 'title'));
    const link = extractTag(item, 'link') || '';
    const pubDate = extractTag(item, 'pubDate');
    const description = truncateAtWord(stripHtml(extractTag(item, 'description')));
    
    if (title && link) {
      items.push({
        title,
        url: link,
        source,
        sourceIcon: icon,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        description,
      });
    }
  }
  
  // Atom format (<entry>)
  if (items.length === 0) {
    const entries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
    for (const entry of entries.slice(0, 15)) {
      const title = stripHtml(extractTag(entry, 'title'));
      // Atom links: <link href="..." />
      const linkMatch = entry.match(/<link[^>]*href="([^"]+)"[^>]*\/?\s*>/i);
      const link = linkMatch?.[1] || extractTag(entry, 'link') || '';
      const updated = extractTag(entry, 'updated') || extractTag(entry, 'published');
      const summary = truncateAtWord(stripHtml(extractTag(entry, 'summary') || extractTag(entry, 'content')));
      
      if (title && link) {
        items.push({
          title,
          url: link,
          source,
          sourceIcon: icon,
          publishedAt: updated ? new Date(updated).toISOString() : new Date().toISOString(),
          description: summary,
        });
      }
    }
  }
  
  return items;
}

// ── Filter out promotional, buying guide, and lifestyle content ──
const PROMO_PATTERNS = /\b(best\s+\w+\s+(for|of|in|to|we|tested|under|you)|buying guide|gift guide|deals?\s+(of|this|today)|coupon|discount|sale\s+alert|promo code|affiliate|tested\s+in\s+our|our\s+top\s+(pick|recommendation)|vs\.?\s+\w+\s+vs\.?|percent\s+off|%\s+off|\$\d+\s+off|budget.?friendly|how\s+to\s+save|where\s+to\s+buy|best\s+cheap|mattress|bed\s+frame|pillow|blender|vacuum|air\s+fryer|coffee\s+maker|headphone|earbud|smartwatch|fitness\s+tracker|luggage|backpack|skin\s*care|moisturizer|shampoo|sunscreen|supplement|vitamin|protein\s+powder|recipe|cookbook|diet\s+plan|meal\s+kit|cleaning\s+product|laundry|dishwasher|refrigerator|washer|dryer|air\s+purifier|dehumidifier|humidifier|space\s+heater|lawn\s+mower|grill|smoker|fire\s+pit|patio|outdoor\s+furniture|garden|plant|pet\s+food|dog\s+bed|cat\s+litter)\b/i;

function isPromoContent(item: NewsItem): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return PROMO_PATTERNS.test(text);
}

// In-memory cache (60s TTL)
let cache: { items: NewsItem[]; ts: number } | null = null;
const CACHE_TTL = 60_000;

async function fetchAllNews(): Promise<NewsItem[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.items;

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'cvin.bio/news-aggregator' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRSS(xml, feed.name, feed.icon);
      } catch {
        return [];
      }
    })
  );

  const allItems: NewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') allItems.push(...r.value);
  }

  // Sort by date (newest first) and deduplicate by URL
  allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const seen = new Set<string>();
  const deduped = allItems.filter(item => {
    if (seen.has(item.url)) return false;
    if (isPromoContent(item)) return false;
    seen.add(item.url);
    return true;
  });

  cache = { items: deduped, ts: Date.now() };
  return deduped;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const source = searchParams.get('source');
  const q = searchParams.get('q')?.toLowerCase().trim();

  let items = await fetchAllNews();

  // Filter by source
  if (source && source !== 'all') {
    items = items.filter(i => i.source.toLowerCase().includes(source.toLowerCase()));
  }

  // Search
  if (q) {
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }

  const total = items.length;
  const offset = (page - 1) * limit;
  const paged = items.slice(offset, offset + limit);

  const response = NextResponse.json({
    items: paged,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
    sources: RSS_FEEDS.map(f => f.name),
  });

  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return response;
}
