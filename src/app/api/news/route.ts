import { NextResponse } from 'next/server';

// ── High-signal tech news sources (curated/ranked, no lifestyle) ──
const RSS_FEEDS = [
  // Curated aggregators (highest signal)
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage?count=30', icon: 'news.ycombinator.com' },
  // Tier 1 tech publications
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', icon: 'techcrunch.com' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', icon: 'theverge.com' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', icon: 'arstechnica.com' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', icon: 'venturebeat.com' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', icon: 'technologyreview.com' },
  { name: 'The Information', url: 'https://www.theinformation.com/feed', icon: 'theinformation.com' },
  // AI/startup focused
  { name: 'Wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss', icon: 'wired.com' },
  { name: 'Bloomberg Tech', url: 'https://feeds.bloomberg.com/technology/news.rss', icon: 'bloomberg.com' },
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
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i'));
  if (cdataMatch) return cdataMatch[1].trim();
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '\u2013').replace(/&#8212;/g, '\u2014').replace(/&#8230;/g, '\u2026')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean up verbose titles: strip author attribution
function cleanTitle(title: string): string {
  // Strip (Author/Publication) attribution at the end
  let clean = title.replace(/\s*\([A-Z][\w\s.''-]+\/[A-Z][\w\s.&''-]+\)\s*$/g, '').trim();
  // Strip trailing source attribution like "— Source Name" or "| Source"  
  clean = clean.replace(/\s*[—–|]\s*[A-Z][\w\s.&''-]{2,30}$/, '').trim();
  return clean;
}

function parseRSS(xml: string, source: string, icon: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // RSS 2.0 format
  const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const item of rssItems.slice(0, 20)) {
    const rawTitle = stripHtml(extractTag(item, 'title'));
    const title = cleanTitle(rawTitle);
    const link = extractTag(item, 'link') || '';
    const pubDate = extractTag(item, 'pubDate');
    const rawDesc = extractTag(item, 'description');
    const description = stripHtml(rawDesc).slice(0, 300);
    
    const url = link;
    
    if (title && url) {
      items.push({
        title,
        url,
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
    for (const entry of entries.slice(0, 20)) {
      const title = cleanTitle(stripHtml(extractTag(entry, 'title')));
      const linkMatch = entry.match(/<link[^>]*href="([^"]+)"[^>]*\/?\s*>/i);
      const link = linkMatch?.[1] || extractTag(entry, 'link') || '';
      const updated = extractTag(entry, 'updated') || extractTag(entry, 'published');
      const summary = stripHtml(extractTag(entry, 'summary') || extractTag(entry, 'content')).slice(0, 300);
      
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

// ── Content quality filters ──

// Promotional / buying guide / review patterns
const PROMO_RE = /\b(best\s+\w+|buying guide|gift guide|deals?\s+(of|this|today)|coupon|discount|promo code|affiliate|tested\s+in\s+our|our\s+top\s+(pick|recommendation)|percent\s+off|%\s+off|\$\d+\s+off|where\s+to\s+buy|review:|\breview\b.*\bresults\b|mixed results|we tested|we recommend|top picks|editor.?s choice|how\s+to\s+choose|cheaper|cheapest|price drop|on sale)\b/i;

// Lifestyle / consumer product topics
const LIFESTYLE_RE = /\b(mattress|bed\s*frame|pillow|blender|mixer|soundbar|vacuum|roomba|robot\s+vacuum|air\s+fryer|coffee\s+maker|headphone|earbud|smartwatch|fitness\s+tracker|luggage|backpack|skin\s*care|moisturizer|shampoo|sunscreen|supplement|vitamin|recipe|cookbook|diet\s+plan|meal\s+kit|cleaning|laundry|dishwasher|refrigerator|washer|dryer|air\s+purifier|humidifier|space\s+heater|lawn\s+mower|grill|fire\s+pit|patio|outdoor\s+furniture|garden|pet\s+food|dog\s+bed|cat\s+litter|water\s+leak|leak\s+detector|shower|faucet|toilet|knitting|crochet|sewing|fashion|outfit|sneaker|shoe|makeup|fragrance|perfume|candle|home\s+decor|rug|curtain|bedding|comforter|duvet|speaker\s+review)\b/i;

function isJunk(item: NewsItem): boolean {
  const text = `${item.title} ${item.description}`;
  if (PROMO_RE.test(text) || LIFESTYLE_RE.test(text)) return true;

  // Curated sources always pass (already editor-filtered)
  const curated = ['The Information', 'Bloomberg Tech'];
  if (curated.includes(item.source)) return false;

  // Other sources must contain at least one tech-relevant signal
  const TECH_SIGNAL = /\b(ai\b|artificial intelligence|machine learning|llm|gpt|openai|anthropic|google|apple|microsoft|meta|amazon|nvidia|tesla|startup|funding|venture|ipo|acquisition|valuation|revenue|billion|million|software|hardware|chip|semiconductor|data|cloud|cyber|security|privacy|hack|breach|open.?source|developer|engineer|programming|api|saas|platform|robot|autonomous|self.?driving|crypto|bitcoin|blockchain|web3|token|defi|nft|social media|app|mobile|browser|search|ads|regulation|antitrust|lawsuit|congress|fcc|ftc|eu\b|gdpr|deepfake|quantum|biotech|spacex|rocket|satellite|drone|vr\b|ar\b|headset|wearable|gaming|console|gpu|cpu|server|database|linux|windows|android|ios|iphone|pixel|galaxy|intel|amd|qualcomm|broadcom|tsmc|samsung|huawei|bytedance|tiktok|snapchat|x\.com|twitter|reddit|discord|slack|zoom|teams|notion|figma|github|gitlab|docker|kubernetes|aws|azure|gcp|vercel|cloudflare|stripe|plaid|fintech|neobank|payment)\b/i;
  return !TECH_SIGNAL.test(text);
}

// ── Title-based dedup (same story from multiple sources) ──
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ').slice(0, 6).join(' '); // First 6 words as fingerprint (tighter dedup)
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
  const MAX_PER_SOURCE = 8; // Prevent any single feed from dominating
  for (const r of results) {
    if (r.status === 'fulfilled') allItems.push(...r.value.slice(0, MAX_PER_SOURCE));
  }

  // 24h freshness cutoff — only show recent news
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const fresh = allItems.filter(item => new Date(item.publishedAt).getTime() > cutoff);

  // Sort by date (newest first)
  fresh.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Deduplicate by URL AND by similar title (cross-source same story)
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped = fresh.filter(item => {
    if (seenUrls.has(item.url)) return false;
    if (isJunk(item)) return false;
    const fingerprint = normalizeTitle(item.title);
    if (seenTitles.has(fingerprint)) return false;
    seenUrls.add(item.url);
    seenTitles.add(fingerprint);
    return true;
  });

  cache = { items: deduped, ts: Date.now() };
  return deduped;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30')));
  const source = searchParams.get('source');
  const q = searchParams.get('q')?.toLowerCase().trim();

  let items = await fetchAllNews();

  if (source && source !== 'all') {
    items = items.filter(i => i.source.toLowerCase().includes(source.toLowerCase()));
  }

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
