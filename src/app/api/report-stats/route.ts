import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cache stats for 5 minutes to avoid hammering DB
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  }

  // Fetch all jobs
  const allJobs: any[] = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('company, location, tags, title, job_type')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allJobs.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  const totalJobs = allJobs.length;

  // Unique companies
  const companySet = new Set<string>();
  const companyCounts: Record<string, number> = {};
  allJobs.forEach(j => {
    if (j.company && !j.company.includes('...')) {
      const key = j.company.toLowerCase().trim();
      companySet.add(key);
      companyCounts[key] = (companyCounts[key] || 0) + 1;
    }
  });
  const totalCompanies = companySet.size;

  // Top 10 companies by job count
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Remote stats
  const remoteJobs = allJobs.filter(j => j.location?.toLowerCase().includes('remote')).length;
  const remotePercent = Math.round((remoteJobs / totalJobs) * 100);

  // AI/ML roles
  const aiJobs = allJobs.filter(j =>
    j.title?.toLowerCase().match(/\b(ai|ml|machine learning|llm|genai|deep learning|nlp|computer vision)\b/)
  ).length;
  const aiPercent = Math.round((aiJobs / totalJobs) * 100);

  // Top locations
  const locationCounts: Record<string, number> = {};
  allJobs.forEach(j => {
    if (j.location) {
      const loc = j.location.split(',')[0].trim();
      if (loc && loc.length < 35 && !loc.includes('/') && !loc.includes('http')) {
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    }
  });
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Top tags
  const tagCounts: Record<string, number> = {};
  allJobs.forEach(j => {
    if (j.tags) j.tags.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  // Seniority breakdown
  const seniority: Record<string, number> = { senior: 0, staff: 0, lead: 0, principal: 0, director: 0, vp: 0, intern: 0 };
  allJobs.forEach(j => {
    if (j.title) {
      const t = j.title.toLowerCase();
      Object.keys(seniority).forEach(r => { if (t.includes(r)) seniority[r]++; });
    }
  });

  // Engineering vs. other roles
  const engineerJobs = allJobs.filter(j => j.title?.toLowerCase().includes('engineer')).length;
  const managerJobs = allJobs.filter(j => j.title?.toLowerCase().includes('manager')).length;
  const designerJobs = allJobs.filter(j => j.title?.toLowerCase().includes('design')).length;

  const stats = {
    totalJobs,
    totalCompanies,
    remoteJobs,
    remotePercent,
    aiJobs,
    aiPercent,
    engineerJobs,
    managerJobs,
    designerJobs,
    topCompanies,
    topLocations,
    topTags,
    seniority,
    updatedAt: new Date().toISOString(),
  };

  cache = { data: stats, ts: Date.now() };

  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
