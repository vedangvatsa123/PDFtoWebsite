import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import Link from 'next/link';
import { Building2, Briefcase, MapPin, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Companies Hiring Now | CVin.Bio',
  description: 'Browse all companies actively hiring on CVin.Bio. Discover open roles at top tech companies including Stripe, Anthropic, Figma, GitLab, and more.',
  alternates: { canonical: 'https://cvin.bio/companies' },
  openGraph: {
    type: 'website',
    url: 'https://cvin.bio/companies',
    title: 'Companies Hiring Now | CVin.Bio',
    description: 'Browse all companies actively hiring on CVin.Bio. Discover open roles at top tech companies.',
    siteName: 'CVin.Bio',
  },
  twitter: { card: 'summary_large_image', title: 'Companies Hiring Now | CVin.Bio' },
  robots: { index: true, follow: true },
};

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

export default async function CompaniesPage() {
  // Fetch all jobs to compute per-company stats
  let allJobs: any[] = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('company, company_logo, location, published_at, created_at')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allJobs.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  // Aggregate per company
  const companyMap: Record<string, { name: string; logo: string | null; count: number; locations: Set<string>; latest: string | null }> = {};
  allJobs.forEach(job => {
    if (!job.company || job.company.includes('...')) return;
    const key = job.company;
    if (!companyMap[key]) {
      companyMap[key] = { name: key, logo: job.company_logo, count: 0, locations: new Set(), latest: null };
    }
    companyMap[key].count++;
    if (job.location) {
      const loc = job.location.split(',')[0].trim();
      if (loc) companyMap[key].locations.add(loc);
    }
    const d = job.published_at || job.created_at;
    if (d && (!companyMap[key].latest || d > companyMap[key].latest!)) {
      companyMap[key].latest = d;
    }
  });

  const companies = Object.values(companyMap)
    .sort((a, b) => b.count - a.count);

  const totalJobs = companies.reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Companies Hiring Now</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-5">
            {companies.length} companies · {totalJobs.toLocaleString()} open roles
          </p>

          {/* Logo strip — top companies with logos */}
          {(() => {
            const withLogos = companies.filter(c => c.logo).slice(0, 20);
            return withLogos.length > 0 ? (
              <div className="flex items-center gap-5 overflow-x-auto pb-1 scrollbar-hide">
                {withLogos.map(c => (
                  <Link key={c.name} href={`/${toSlug(c.name)}`} className="shrink-0 group" title={c.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.logo!}
                      alt={c.name}
                      className="h-8 w-auto object-contain opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-200"
                    />
                  </Link>
                ))}
              </div>
            ) : null;
          })()}
        </div>

        {/* Company Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {companies.map(company => {
            const slug = toSlug(company.name);
            const topLocs = [...company.locations].slice(0, 3);
            const logo = company.logo || null;
            return (
              <Link
                key={company.name}
                href={`/${slug}`}
                className="group flex gap-3.5 p-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-white/5 transition-all"
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={company.name}
                    className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white shrink-0 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500">{company.name[0].toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors truncate">
                      {company.name}
                    </h2>
                    <span className="text-[11px] font-semibold text-zinc-400 tabular-nums whitespace-nowrap shrink-0">{company.count} {company.count === 1 ? 'role' : 'roles'}</span>
                  </div>
                  {topLocs.length > 0 && (
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {topLocs.join(' · ')}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <MicroFooter />
    </div>
  );
}
