import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Role keyword families for title matching ──
const ROLE_FAMILIES: Record<string, string[]> = {
  frontend:    ['frontend', 'front-end', 'front end', 'react', 'vue', 'angular', 'ui engineer', 'ui developer', 'css', 'next.js', 'nextjs'],
  backend:     ['backend', 'back-end', 'back end', 'server', 'api', 'node', 'python', 'java', 'golang', 'go developer', 'ruby', 'django', 'flask', 'express', 'spring'],
  fullstack:   ['full stack', 'fullstack', 'full-stack'],
  mobile:      ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
  devops:      ['devops', 'sre', 'site reliability', 'infrastructure', 'platform engineer', 'cloud engineer', 'kubernetes', 'docker', 'terraform', 'ci/cd'],
  data:        ['data engineer', 'data scientist', 'data analyst', 'analytics', 'etl', 'data platform', 'business intelligence', 'bi engineer'],
  ml:          ['machine learning', 'ml engineer', 'ai engineer', 'deep learning', 'nlp', 'computer vision', 'llm'],
  security:    ['security', 'cybersecurity', 'infosec', 'penetration', 'appsec'],
  design:      ['designer', 'ux', 'ui/ux', 'product design', 'design system', 'figma'],
  product:     ['product manager', 'program manager', 'product owner', 'product lead', 'tpm'],
  qa:          ['qa', 'quality', 'test engineer', 'sdet', 'automation engineer'],
  embedded:    ['embedded', 'firmware', 'hardware', 'iot', 'fpga'],
};

// ── Seniority levels and their numeric rank ──
const SENIORITY_MAP: Record<string, number> = {
  intern: 1, internship: 1, trainee: 1, apprentice: 1,
  junior: 2, associate: 2, entry: 2, 'early career': 2,
  mid: 3, intermediate: 3,
  senior: 4, 'sr.': 4, 'sr': 4,
  staff: 5, principal: 5,
  lead: 6, 'team lead': 6, 'tech lead': 6,
  director: 7, head: 7,
  vp: 8, 'vice president': 8,
  cto: 9, ceo: 9, coo: 9, cfo: 9, 'c-level': 9,
};

/** Extract seniority level from a title string */
function extractSeniority(title: string): number {
  const lower = title.toLowerCase();
  for (const [keyword, level] of Object.entries(SENIORITY_MAP)) {
    if (lower.includes(keyword)) return level;
  }
  return 3; // default to mid-level
}

/** Extract role families from a title string */
function extractRoleFamilies(title: string): string[] {
  const lower = title.toLowerCase();
  const families: string[] = [];
  for (const [family, keywords] of Object.entries(ROLE_FAMILIES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      families.push(family);
    }
  }
  return families;
}

/** Normalize location string for comparison */
function normalizeLocation(loc: string): { isRemote: boolean; tokens: string[] } {
  const lower = loc.toLowerCase().trim();
  const isRemote = /remote|anywhere|distributed|worldwide|global/i.test(lower);
  const tokens = lower
    .replace(/[,\-\/|·•]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !['and', 'the', 'or'].includes(t));
  return { isRemote, tokens };
}

interface UserProfile {
  skills: string[];
  experience: Array<{ title?: string; company?: string; description?: string }>;
  location: string;
  about: string;
}

/**
 * Compute a match score (0–100) between a user profile and a job listing.
 * 
 * Weights:
 * - Skills overlap:     40 points max
 * - Title/role match:   30 points max
 * - Seniority match:    15 points max
 * - Location match:     15 points max
 */
function computeMatchScore(
  user: UserProfile,
  job: { title: string; tags: string[]; location: string; company: string }
): { score: number; matchedSkills: string[]; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  // ── 1. Skills overlap (40 pts) ──
  const userSkillsLower = user.skills.map(s => s.toLowerCase());
  const jobTagsLower = (job.tags || []).map(t => t.toLowerCase());
  const jobTitleLower = job.title.toLowerCase();
  // Match against both tags AND job title
  const matchedSkills = user.skills.filter(s => {
    const sl = s.toLowerCase();
    return jobTagsLower.includes(sl) || jobTitleLower.includes(sl);
  });
  if (matchedSkills.length > 0) {
    const skillScore = Math.min(40, matchedSkills.length * 10);
    score += skillScore;
    signals.push(`${matchedSkills.length} skill${matchedSkills.length > 1 ? 's' : ''}`);
  }

  // ── 2. Title/role match (30 pts) ──
  // Extract role families from user's most recent job titles
  const userRoleFamilies = new Set<string>();
  for (const exp of (user.experience || []).slice(0, 3)) {
    if (exp.title) {
      for (const f of extractRoleFamilies(exp.title)) {
        userRoleFamilies.add(f);
      }
    }
  }
  // Also extract from user's about/summary
  if (user.about) {
    for (const f of extractRoleFamilies(user.about)) {
      userRoleFamilies.add(f);
    }
  }
  // Also extract from skills (e.g., "React" → frontend)
  const skillText = userSkillsLower.join(' ');
  for (const f of extractRoleFamilies(skillText)) {
    userRoleFamilies.add(f);
  }

  const jobRoleFamilies = new Set(extractRoleFamilies(job.title));
  // Also check job tags for role families
  const tagText = jobTagsLower.join(' ');
  for (const f of extractRoleFamilies(tagText)) {
    jobRoleFamilies.add(f);
  }

  const roleOverlap = [...userRoleFamilies].filter(f => jobRoleFamilies.has(f));
  if (roleOverlap.length > 0) {
    const roleScore = Math.min(30, roleOverlap.length * 15);
    score += roleScore;
    signals.push(`role: ${roleOverlap.join(', ')}`);
  }

  // ── 3. Seniority match (15 pts) ──
  // Get user's seniority from most recent title
  const userTitles = (user.experience || []).slice(0, 2).map(e => e.title || '');
  const userSeniority = userTitles.length > 0 ? Math.max(...userTitles.map(extractSeniority)) : 3;
  const jobSeniority = extractSeniority(job.title);
  const seniorityDiff = Math.abs(userSeniority - jobSeniority);
  if (seniorityDiff === 0) {
    score += 15;
    signals.push('seniority: exact');
  } else if (seniorityDiff === 1) {
    score += 10;
    signals.push('seniority: close');
  } else if (seniorityDiff === 2) {
    score += 5;
  }

  // ── 4. Location match (15 pts) ──
  if (user.location && job.location) {
    const userLoc = normalizeLocation(user.location);
    const jobLoc = normalizeLocation(job.location);

    if (jobLoc.isRemote) {
      // Remote jobs match everyone
      score += 15;
      signals.push('location: remote');
    } else if (userLoc.tokens.some(t => jobLoc.tokens.includes(t))) {
      // City/country overlap
      score += 15;
      signals.push('location: match');
    } else if (userLoc.isRemote && jobLoc.isRemote) {
      score += 15;
    }
  }

  return { score, matchedSkills, signals };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const type = searchParams.get('type'); // full_time, contract, etc.
  const loc = searchParams.get('loc');   // remote, hybrid, onsite
  const q = searchParams.get('q')?.toLowerCase().trim();
  const offset = (page - 1) * limit;

  // Try to get authenticated user's profile for matching
  let userProfile: UserProfile | null = null;
  let profileComplete = false;
  try {
    const anonClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll().map(c => ({ name: c.name, value: c.value })) } }
    );
    const { data: { user } } = await anonClient.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('skills, profile_picture_url, about, experience, education, links')
        .eq('id', user.id)
        .single();
      if (profile) {
        const skills = profile.skills || [];
        const links = profile.links || [];
        const location = links.find((l: any) => l.type === 'location')?.value || '';
        userProfile = {
          skills,
          experience: profile.experience || [],
          location,
          about: profile.about || '',
        };
        const hasSkills = skills.length > 0;
        const hasSummary = !!profile.about;
        profileComplete = hasSummary && hasSkills;
      }
    }
  } catch (_) {
    // Not authenticated — show all jobs unfiltered
  }

  // Build query
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false, nullsFirst: false });

  // Filter by job type
  if (type && type !== 'all') {
    query = query.eq('job_type', type);
  }

  // Filter by location type
  if (loc === 'remote') {
    query = query.or('location.ilike.%remote%,location.ilike.%anywhere%,location.ilike.%distributed%,location.ilike.%worldwide%');
  } else if (loc === 'onsite') {
    query = query.not('location', 'ilike', '%remote%');
  }

  // Search by keyword in title or company
  if (q) {
    query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%`);
  }

  // If user has complete profile AND match=true, filter to jobs that match their skills
  const matchOnly = searchParams.get('match') === 'true';
  if (profileComplete && userProfile && userProfile.skills.length > 0 && matchOnly && !q) {
    // Build OR filter: match tags overlap OR any skill appears in the title
    const titleFilters = userProfile.skills.map(s => `title.ilike.%${s}%`).join(',');
    query = query.or(`tags.ov.{${userProfile.skills.join(',')}},${titleFilters}`);
  }

  // Paginate
  query = query.range(offset, offset + limit - 1);

  const { data: jobs, error, count } = await query;

  if (error) {
    console.error('Jobs query error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }

  // Calculate match scores per job
  const jobsWithMatches = (jobs || []).map(job => {
    let matchedSkills: string[] = [];
    let matchScore = 0;
    let matchSignals: string[] = [];

    if (userProfile && userProfile.skills.length > 0) {
      const result = computeMatchScore(userProfile, {
        title: job.title,
        tags: job.tags || [],
        location: job.location || '',
        company: job.company,
      });
      matchedSkills = result.matchedSkills;
      matchScore = result.score;
      matchSignals = result.signals;
    }

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      company_logo: job.company_logo,
      location: job.location,
      job_type: job.job_type,
      salary: job.salary,
      tags: job.tags || [],
      apply_url: job.apply_url,
      category: job.category,
      source: job.source,
      published_at: job.published_at,
      matched_skills: matchedSkills,
      match_count: matchedSkills.length,
      match_score: matchScore,
      match_signals: matchSignals,
    };
  });

  // Sort: highest match score first if user is authenticated
  if (userProfile && userProfile.skills.length > 0) {
    jobsWithMatches.sort((a, b) => b.match_score - a.match_score);
  }

  return NextResponse.json({
    jobs: jobsWithMatches,
    total: count || 0,
    page,
    limit,
    hasMore: offset + limit < (count || 0),
    userSkills: userProfile?.skills || [],
    profileComplete,
  });
}
