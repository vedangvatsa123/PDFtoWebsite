import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import Link from 'next/link';
import { Building2, Briefcase } from 'lucide-react';
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
  const withLogos = companies.filter(c => c.logo).slice(0, 12);
  const extraLogoCount = companies.filter(c => c.logo).length - withLogos.length;

  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-primary/10 transition-colors duration-200 flex flex-col">
      <Header />
      <main className="w-full max-w-5xl mx-auto px-6 py-12 md:py-20 lg:py-24 pb-32 flex-1">
        {/* Hero */}
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3 transition-colors">
            Companies
          </h1>
          {/* Logo strip */}
          <div className="flex items-center gap-3 mt-3">
            {withLogos.map((c, i) => (
              <Link key={c.name} href={`/${toSlug(c.name)}`} title={c.name} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.logo!}
                  alt={c.name}
                  className={`h-5 w-5 sm:h-6 sm:w-6 rounded-md opacity-80 hover:opacity-100 transition-all shrink-0 ${i >= 8 ? 'hidden sm:block' : ''}`}
                  loading="lazy"
                />
              </Link>
            ))}
            {extraLogoCount > 0 && (
              <span className="text-xs text-zinc-400 shrink-0">+{extraLogoCount} more</span>
            )}
          </div>
          <Link href="/jobs" className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline">
            <Briefcase className="h-4 w-4 text-primary" />
            Browse all {totalJobs.toLocaleString()} open roles →
          </Link>
        </div>

        {/* Company count */}
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-4 uppercase tracking-wider">
          {companies.length} {companies.length === 1 ? 'company' : 'companies'} found
        </p>

        {/* Company Cards — 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {companies.map(company => {
            const slug = toSlug(company.name);
            const topLocs = [...company.locations].slice(0, 3);
            const logo = company.logo;
            return (
              <Link
                key={company.name}
                href={`/${slug}`}
                className="group flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-white/5 transition-all"
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={company.name} className="h-5 w-5 rounded shrink-0" loading="lazy" />
                ) : (
                  <span className="h-5 w-5 rounded shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    {company.name[0].toUpperCase()}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors truncate">
                    {company.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 min-w-0">
                    <span className="font-medium shrink-0">{company.count} {company.count === 1 ? 'role' : 'roles'}</span>
                    {topLocs.length > 0 && (
                      <>
                        <span className="shrink-0 text-zinc-300 dark:text-zinc-600">·</span>
                        <span className="truncate">{topLocs.join(', ')}</span>
                      </>
                    )}
                  </div>
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
