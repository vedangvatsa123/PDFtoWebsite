import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── ATS URL Parsers ──
function parseLeverUrl(url: string) {
  // https://jobs.lever.co/mistral/55c2e8f4-...
  const m = url.match(/jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/);
  return m ? { company: m[1], postingId: m[2] } : null;
}

function parseAshbyUrl(url: string) {
  // https://jobs.ashbyhq.com/pinecone/24f9a4e3-...
  const m = url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([a-f0-9-]+)/);
  return m ? { company: m[1], jobId: m[2] } : null;
}

function parseGreenhouseUrl(url: string) {
  // https://boards.greenhouse.io/flexport/jobs/7733595
  // or ?gh_jid=7733595
  const boardMatch = url.match(/boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (boardMatch) return { boardToken: boardMatch[1], jobId: boardMatch[2] };
  const ghJidMatch = url.match(/gh_jid=(\d+)/);
  const boardMatch2 = url.match(/job-boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (boardMatch2) return { boardToken: boardMatch2[1], jobId: boardMatch2[2] };
  if (ghJidMatch) return { boardToken: null, jobId: ghJidMatch[1] };
  return null;
}

// ── Anti-block: realistic browser fingerprint ──
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// Random delay (1-3s) to avoid machine-timing fingerprinting
function jitterDelay(): Promise<void> {
  const ms = 1000 + Math.random() * 2000;
  return new Promise(r => setTimeout(r, ms));
}

// ── Rate limiter (in-memory, per user + per company) ──
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const companyLimits = new Map<string, { count: number; resetAt: number }>();
const DAILY_LIMIT_FREE = 3;
const DAILY_LIMIT_PRO = 50;
const COMPANY_HOURLY_LIMIT = 5; // Max 5 apps to same company per hour across all users
const MIN_INTERVAL_MS = 5000; // 5 seconds between applies
const lastApplyTime = new Map<string, number>();

function checkRateLimit(userId: string, isPro: boolean, company?: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const limit = isPro ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE;

  // Check minimum interval
  const lastTime = lastApplyTime.get(userId) || 0;
  if (now - lastTime < MIN_INTERVAL_MS) {
    return { allowed: false, reason: 'Please wait a few seconds between applications' };
  }

  // Check daily limit
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${today}`;
  const entry = rateLimits.get(key);
  if (entry && entry.count >= limit) {
    return { allowed: false, reason: `Daily limit of ${limit} applications reached. ${isPro ? '' : 'Upgrade to Pro for 50/day.'}` };
  }

  // Check per-company hourly limit (prevents flooding a single ATS)
  if (company) {
    const companyKey = `company:${company.toLowerCase()}`;
    const compEntry = companyLimits.get(companyKey);
    if (compEntry) {
      if (now > compEntry.resetAt) {
        companyLimits.delete(companyKey); // Reset after 1 hour
      } else if (compEntry.count >= COMPANY_HOURLY_LIMIT) {
        return { allowed: false, reason: `Too many applications to ${company} recently. Try again later.` };
      }
    }
  }

  return { allowed: true };
}

function recordApply(userId: string, company?: string) {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${today}`;
  const entry = rateLimits.get(key);
  if (entry) {
    entry.count++;
  } else {
    rateLimits.set(key, { count: 1, resetAt: now + 86400000 });
  }
  lastApplyTime.set(userId, now);

  // Track per-company
  if (company) {
    const companyKey = `company:${company.toLowerCase()}`;
    const compEntry = companyLimits.get(companyKey);
    if (compEntry) {
      compEntry.count++;
    } else {
      companyLimits.set(companyKey, { count: 1, resetAt: now + 3600000 }); // 1 hour window
    }
  }
}

// ── Lever Submit ──
async function submitLever(company: string, postingId: string, userData: any): Promise<{ success: boolean; error?: string }> {
  try {
    // First fetch the apply page to get CSRF token
    const applyPageRes = await fetch(`https://jobs.lever.co/${company}/${postingId}/apply`, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!applyPageRes.ok) {
      return { success: false, error: `Lever apply page returned ${applyPageRes.status}` };
    }

    const html = await applyPageRes.text();

    // Extract CSRF token from the form
    const csrfMatch = html.match(/name="csrf[_-]?token"\s+value="([^"]+)"/i)
      || html.match(/"csrfToken"\s*:\s*"([^"]+)"/);

    // Build form data
    const formData = new FormData();
    formData.append('name', userData.fullName);
    formData.append('email', userData.email);
    if (userData.phone) formData.append('phone', userData.phone);
    if (userData.linkedIn) formData.append('urls[LinkedIn]', userData.linkedIn);
    if (userData.github) formData.append('urls[GitHub]', userData.github);
    if (userData.website) formData.append('urls[Portfolio]', userData.website);
    if (userData.org) formData.append('org', userData.org);

    // Attach resume if available
    if (userData.resumeUrl) {
      try {
        const resumeRes = await fetch(userData.resumeUrl);
        if (resumeRes.ok) {
          const blob = await resumeRes.blob();
          formData.append('resume', blob, 'resume.pdf');
        }
      } catch { /* skip resume if fetch fails */ }
    }

    if (csrfMatch) {
      formData.append('csrf_token', csrfMatch[1]);
    }

    // Add jitter delay before submission
    await jitterDelay();

    // Submit
    const submitRes = await fetch(`https://jobs.lever.co/${company}/${postingId}/apply`, {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': BROWSER_UA,
        'Referer': `https://jobs.lever.co/${company}/${postingId}/apply`,
        'Origin': `https://jobs.lever.co`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (submitRes.ok || submitRes.status === 302) {
      return { success: true };
    }

    return { success: false, error: `Lever returned ${submitRes.status}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Ashby Submit ──
async function submitAshby(company: string, jobId: string, userData: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch job posting info to get required form fields
    const infoRes = await fetch('https://api.ashbyhq.com/posting-api/job-board/' + company, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!infoRes.ok) {
      return { success: false, error: `Ashby job board API returned ${infoRes.status}` };
    }

    // Build application payload
    const payload: any = {
      jobPostingId: jobId,
      applicationForm: {
        '_systemfield_name': userData.fullName,
        '_systemfield_email': userData.email,
      },
    };

    if (userData.phone) payload.applicationForm['_systemfield_phone'] = userData.phone;
    if (userData.linkedIn) payload.applicationForm['_systemfield_linkedin'] = userData.linkedIn;
    if (userData.website) payload.applicationForm['_systemfield_website'] = userData.website;

    // Add jitter delay before submission
    await jitterDelay();

    // Submit via Ashby's public posting API
    const submitRes = await fetch('https://api.ashbyhq.com/posting-api/application-form/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': BROWSER_UA,
        'Origin': 'https://jobs.ashbyhq.com',
        'Referer': `https://jobs.ashbyhq.com/${company}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await submitRes.json().catch(() => ({}));

    if (submitRes.ok && result.success !== false) {
      return { success: true };
    }

    return { success: false, error: result.error || `Ashby returned ${submitRes.status}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Main API Handler ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, userId, userData } = body;

    if (!jobId || !userId || !userData?.fullName || !userData?.email) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, userId, userData (fullName, email)' },
        { status: 400 }
      );
    }

    // Check rate limit (basic check first, company check after job fetch)
    const rateCheck = checkRateLimit(userId, userData.isPro || false);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.reason }, { status: 429 });
    }

    // Check for duplicate application
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 409 });
    }

    // Fetch job details from DB
    const { data: job } = await supabase
      .from('jobs')
      .select('id, title, company, source, apply_url')
      .eq('id', jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let status = 'redirect';
    let method = 'redirect';
    let atsResponse: any = null;
    let errorMessage: string | null = null;

    // Check per-company rate limit (now that we know the company)
    const companyRateCheck = checkRateLimit(userId, userData.isPro || false, job.company);
    if (!companyRateCheck.allowed) {
      return NextResponse.json({ error: companyRateCheck.reason }, { status: 429 });
    }

    // Route to the correct ATS handler
    const applyUrl = job.apply_url || '';

    if (job.source === 'lever') {
      const parsed = parseLeverUrl(applyUrl);
      if (parsed) {
        method = 'api';
        const result = await submitLever(parsed.company, parsed.postingId, userData);
        status = result.success ? 'submitted' : 'failed';
        errorMessage = result.error || null;
        atsResponse = { method: 'lever_form', ...result };
      }
    } else if (job.source === 'ashby') {
      const parsed = parseAshbyUrl(applyUrl);
      if (parsed) {
        method = 'api';
        const result = await submitAshby(parsed.company, parsed.jobId, userData);
        status = result.success ? 'submitted' : 'failed';
        errorMessage = result.error || null;
        atsResponse = { method: 'ashby_api', ...result };
      }
    }
    // Greenhouse and others: redirect (user opens apply URL)

    // Record the application
    const { error: insertError } = await supabase.from('applications').insert({
      user_id: userId,
      job_id: jobId,
      job_title: job.title,
      company: job.company,
      source: job.source,
      apply_url: job.apply_url,
      status,
      method,
      ats_response: atsResponse,
      error_message: errorMessage,
    });

    if (insertError) {
      console.error('Failed to record application:', insertError);
    }

    // Record rate limit
    recordApply(userId, job.company);

    return NextResponse.json({
      success: status === 'submitted' || status === 'redirect',
      status,
      method,
      apply_url: status === 'redirect' ? job.apply_url : undefined,
      error: errorMessage,
    });

  } catch (e: any) {
    console.error('Apply API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── GET: Fetch user's applications ──
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data || [] });
}
