'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import { Newspaper, ExternalLink, Search, ChevronDown, Clock } from 'lucide-react';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  sourceIcon: string;
  publishedAt: string;
  description: string;
}

interface NewsResponse {
  items: NewsItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  sources: string[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// Source-specific accent colors
const SOURCE_COLORS: Record<string, string> = {
  'TechCrunch': 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  'The Verge': 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  'Ars Technica': 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'Hacker News': 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'MIT Tech Review': 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  'Wired': 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
  'VentureBeat': 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'The Information': 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
};

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [source, setSource] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sources, setSources] = useState<string[]>([]);

  const fetchNews = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);

    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '30' });
      if (source !== 'all') params.set('source', source);
      if (search) params.set('q', search);

      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsResponse = await res.json();

      if (append) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
      if (data.sources.length > 0) setSources(data.sources);
    } catch (e) {
      console.error('Failed to fetch news:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [source, search]);

  useEffect(() => {
    setPage(1);
    fetchNews(1);
  }, [fetchNews]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchNews(next, true);
  };

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-primary/10 transition-colors duration-200 flex flex-col">
      <Header />
      <main id="main-content" className="w-full max-w-5xl mx-auto px-6 py-12 md:py-20 lg:py-24 pb-32 flex-1">
        {/* Hero */}
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3 transition-colors">
            Tech News
          </h1>
          <div className="flex items-center gap-3">
            {[
              { name: 'TechCrunch', domain: 'techcrunch.com' },
              { name: 'The Verge', domain: 'theverge.com' },
              { name: 'Hacker News', domain: 'news.ycombinator.com' },
              { name: 'Ars Technica', domain: 'arstechnica.com' },
              { name: 'Bloomberg', domain: 'bloomberg.com' },
              { name: 'VentureBeat', domain: 'venturebeat.com' },
              { name: 'Wired', domain: 'wired.com' },
              { name: 'MIT Tech Review', domain: 'technologyreview.com' },
              { name: 'The Information', domain: 'theinformation.com' },
            ].map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.name} src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=64`} alt={s.name} title={s.name}
                className="h-5 w-5 sm:h-6 sm:w-6 rounded-md opacity-80 hover:opacity-100 transition-all shrink-0"
                loading="lazy" />
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <form onSubmit={handleSearch} className="flex-1 relative" role="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden="true" />
            <label htmlFor="news-search-input" className="sr-only">Search news</label>
            <input
              id="news-search-input"
              type="text"
              placeholder="Search news..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search news"
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </form>
          <div className="relative shrink-0">
            <label htmlFor="news-source-filter" className="sr-only">Filter by source</label>
            <select
              id="news-source-filter"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              aria-label="Filter news by source"
              className="h-10 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer appearance-none"
            >
              <option value="all">All Sources</option>
              {sources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-4 uppercase tracking-wider">
            {total} {total === 1 ? 'article' : 'articles'}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-primary rounded-full animate-spin" />
            <p className="mt-4 text-sm text-zinc-500">Loading news...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Newspaper className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">No articles found</p>
            <p className="text-sm text-zinc-500 mt-2">Try adjusting your search or source filter.</p>
          </div>
        )}

        {/* News items — 2-column grid */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {items.map((item, i) => (
              <a
                key={`${item.url}-${i}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-white/5 transition-all"
              >
                {/* Source favicon */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${item.sourceIcon}&sz=64`}
                  alt={item.source}
                  className="h-5 w-5 rounded shrink-0"
                  loading="lazy"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors line-clamp-3 leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 min-w-0">
                    <span className="font-medium shrink-0">{item.source}</span>
                    <span className="text-zinc-300 dark:text-zinc-700 shrink-0">·</span>
                    <span className="shrink-0">{timeAgo(item.publishedAt)}</span>
                  </div>
                </div>

                <ExternalLink className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-primary shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            {loadingMore && (
              <div className="h-5 w-5 border-2 border-zinc-300 dark:border-zinc-700 border-t-primary rounded-full animate-spin" />
            )}
          </div>
        )}
      </main>
      <MicroFooter />
    </div>
  );
}
