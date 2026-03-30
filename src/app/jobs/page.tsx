'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import { Briefcase, ExternalLink, Search, Target, Clock, ChevronDown, Sparkles, UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import posthog from 'posthog-js';

interface Job {
  id: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string;
  job_type: string | null;
  salary: string | null;
  tags: string[];
  apply_url: string;
  category: string | null;
  source: string;
  published_at: string | null;
  matched_skills: string[];
  match_count: number;
  match_score: number;
  match_signals: string[];
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  userSkills: string[];
  profileComplete: boolean;
}

const JOB_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];

const LOCATIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'remote', label: 'Remote Only' },
  { value: 'onsite', label: 'On-site' },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function JobTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const labels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    freelance: 'Freelance',
  };
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors">
      {labels[type] || type}
    </span>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [type, setType] = useState('all');
  const [loc, setLoc] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [matchOnly, setMatchOnly] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchJobs = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);

    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '50' });
      if (type !== 'all') params.set('type', type);
      if (loc !== 'all') params.set('loc', loc);
      if (search) params.set('q', search);
      if (matchOnly) params.set('match', 'true');

      const res = await fetch(`/api/jobs?${params}`);
      const data: JobsResponse = await res.json();

      if (append) {
        setJobs(prev => [...prev, ...data.jobs]);
      } else {
        setJobs(data.jobs);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
      setUserSkills(data.userSkills);
      setProfileComplete(data.profileComplete);
    } catch (e) {
      console.error('Failed to fetch jobs:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [type, loc, search, matchOnly]);

  useEffect(() => {
    setPage(1);
    fetchJobs(1);
  }, [fetchJobs]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchJobs(next, true);
  };

  // Infinite scroll with IntersectionObserver
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

  // ── View tracking: batch visible job IDs and flush every 3s ──
  const viewedIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const flush = () => {
      if (viewedIds.current.size === 0) return;
      const ids = Array.from(viewedIds.current);
      viewedIds.current.clear();
      fetch('/api/jobs/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'view' }),
      }).catch(() => {});
    };
    const timer = setInterval(flush, 3000);
    return () => { flush(); clearInterval(timer); };
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll('[data-job-id]');
    if (cards.length === 0) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = (e.target as HTMLElement).dataset.jobId;
          if (id) viewedIds.current.add(id);
        }
      });
    }, { threshold: 0.5 });
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, [jobs]);

  const trackClick = (jobId: string, job: Job) => {
    posthog.capture('job_clicked', { job_id: job.id, title: job.title, company: job.company, source: job.source, match_count: job.match_count });
    fetch('/api/jobs/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [jobId], action: 'click' }),
    }).catch(() => {});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-primary/10 transition-colors duration-200 flex flex-col">
      <Header />
      <main className="w-full max-w-5xl mx-auto px-6 py-12 md:py-20 lg:py-24 pb-32 flex-1">
        {/* Hero */}
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3 transition-colors">
            Job Board
          </h1>
          {/* Company logos strip */}
          <div className="flex items-center gap-3 mt-3">
            {[
              { name: 'Stripe', domain: 'stripe.com' },
              { name: 'Airbnb', domain: 'airbnb.com' },
              { name: 'Cloudflare', domain: 'cloudflare.com' },
              { name: 'Discord', domain: 'discord.com' },
              { name: 'Reddit', domain: 'reddit.com' },
              { name: 'Coinbase', domain: 'coinbase.com' },
              { name: 'Figma', domain: 'figma.com' },
              { name: 'GitLab', domain: 'gitlab.com' },
              { name: 'Lyft', domain: 'lyft.com' },
              { name: 'Pinterest', domain: 'pinterest.com' },
              { name: 'Spotify', domain: 'spotify.com' },
            ].map((c, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c.name} src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`} alt={c.name} title={c.name}
                className={`h-5 w-5 sm:h-6 sm:w-6 rounded-md opacity-80 hover:opacity-100 transition-all shrink-0 ${i >= 6 ? 'hidden sm:block' : ''}`}
                loading="lazy" />
            ))}
            <span className="text-xs text-zinc-400 shrink-0">+60 more</span>
          </div>
          {profileComplete && userSkills.length > 0 && (
            <button
              onClick={() => setMatchOnly(m => !m)}
              className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                matchOnly
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'
              }`}
            >
              <Target className="h-3 w-3" />
              {matchOnly ? `Showing matched (${userSkills.slice(0, 4).join(', ')}${userSkills.length > 4 ? '…' : ''})` : 'Show matched only'}
            </button>
          )}
          {userSkills.length > 0 && !profileComplete && (
            <Link href="/editor" className="inline-flex items-center gap-1.5 mt-3 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
              <Target className="h-3 w-3" />
              Complete your profile to unlock skill matching →
            </Link>
          )}
          {userSkills.length === 0 && (
            <label htmlFor="jobs-cv-upload" className={`inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <UploadCloud className="h-4 w-4 text-primary" />}
              {isUploading ? 'Parsing CV...' : 'Upload your CV for personalized matches →'}
              <input
                id="jobs-cv-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png,.webp,.heic"
                disabled={isUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    toast({ variant: 'destructive', title: 'Too Large', description: 'Max 10MB.' });
                    e.target.value = ''; return;
                  }
                  setIsUploading(true);
                  toast({ title: 'Parsing CV...', description: 'Extracting your details.' });
                  try {
                    const fd = new FormData(); fd.append('resume', file);
                    const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });
                    if (!res.ok) { toast({ variant: 'destructive', title: 'Failed', description: 'Could not parse your CV.' }); return; }
                    const parsed = await res.json();
                    sessionStorage.setItem('parsedResume', JSON.stringify(parsed));
                    try { localStorage.setItem('parsedResume', JSON.stringify(parsed)); } catch {}
                    router.push('/editor');
                  } catch {
                    toast({ variant: 'destructive', title: 'Error', description: 'Network error.' });
                  } finally {
                    e.target.value = '';
                    setIsUploading(false);
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by title or company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </form>
          <div className="relative shrink-0">
            <select
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer appearance-none"
            >
              {LOCATIONS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Job count */}
        {!loading && (
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-4 uppercase tracking-wider">
            {total} {total === 1 ? 'job' : 'jobs'} found
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-primary rounded-full animate-spin" />
            <p className="mt-4 text-sm text-zinc-500">Loading jobs...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">No jobs found</p>
            <p className="text-sm text-zinc-500 mt-2">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Job Cards — 2-column grid */}
        {!loading && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {jobs.map((job) => (
              <a
                key={job.id}
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                data-job-id={job.id}
                className="group flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-white/5 transition-all"
                onClick={() => trackClick(job.id, job)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.company_logo || `https://www.google.com/s2/favicons?domain=${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com&sz=32`}
                  alt={`${job.company} logo`}
                  className="h-5 w-5 rounded shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    const parent = el.parentElement;
                    if (!parent) return;
                    const span = document.createElement('span');
                    span.className = 'h-5 w-5 rounded shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400';
                    span.textContent = job.company.charAt(0).toUpperCase();
                    parent.replaceChild(span, el);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors truncate">
                      {job.title}
                    </h3>
                    {job.match_score >= 50 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full" title={job.match_signals.join(' · ')}>
                        <Sparkles className="h-2.5 w-2.5" />Great match
                      </span>
                    )}
                    {job.match_score >= 25 && job.match_score < 50 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full" title={job.match_signals.join(' · ')}>
                        <Target className="h-2.5 w-2.5" />Good match
                      </span>
                    )}
                    {job.match_score > 0 && job.match_score < 25 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0" title={job.match_signals.join(' · ')}>
                        <Target className="h-2.5 w-2.5" />Partial
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 min-w-0">
                    <span className="font-medium truncate shrink-0 max-w-[40%]">{job.company}</span>
                    {job.location && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700 shrink-0">·</span>
                        <span className="truncate">{job.location}</span>
                      </>
                    )}
                    {job.published_at && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <span className="shrink-0">{timeAgo(job.published_at)}</span>
                      </>
                    )}
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
