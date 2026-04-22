import { createClient } from '@supabase/supabase-js';

/**
 * Server-side utility to get live platform stats.
 * Used by /story, /llms.txt, and any server component that needs current numbers.
 * Results are cached in-memory for 5 minutes to avoid hammering the DB.
 */

let cache: { data: PlatformStats; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export interface PlatformStats {
  totalJobs: number;
  totalCompanies: number;
  totalUsers: number;
  /** e.g. "19,000+" */
  jobCountDisplay: string;
  /** e.g. "490+" */
  companyCountDisplay: string;
  /** e.g. "329" */
  userCountDisplay: string;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get job count
  const { count: totalJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  // Get unique companies (paginated)
  const companySet = new Set<string>();
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('company')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    data.forEach(j => {
      if (j.company && !j.company.includes('...')) {
        companySet.add(j.company.toLowerCase().trim());
      }
    });
    if (data.length < 1000) break;
    page++;
  }

  // Get user count
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const jobs = totalJobs || 0;
  const companies = companySet.size;
  const users = totalUsers || 0;

  // Format display strings: round down to nearest 1000 for jobs
  const jobThousands = Math.floor(jobs / 1000);
  const jobCountDisplay = `${jobThousands.toLocaleString()},000+`;
  const companyCountDisplay = `${companies}+`;
  const userCountDisplay = `${users}`;

  const stats: PlatformStats = {
    totalJobs: jobs,
    totalCompanies: companies,
    totalUsers: users,
    jobCountDisplay,
    companyCountDisplay,
    userCountDisplay,
  };

  cache = { data: stats, ts: Date.now() };
  return stats;
}
