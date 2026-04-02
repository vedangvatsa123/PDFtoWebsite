import { NextResponse, NextRequest } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Only these emails can access the admin dashboard
const ADMIN_EMAILS = ['vatsvedang@gmail.com'];

// ── PostHog HogQL helper ────────────────────────────────────────────────────
const PH_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PH_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const PH_HOST = 'https://us.posthog.com';

/** Map raw referrer domains to friendly names */
const SOURCE_MAP: Record<string, string> = {
  '$direct': 'Direct', '': 'Direct', 'direct': 'Direct',
  'www.google.com': 'Google', 'google.com': 'Google',
  'www.linkedin.com': 'LinkedIn', 'linkedin.com': 'LinkedIn', 'lnkd.in': 'LinkedIn',
  'www.facebook.com': 'Facebook', 'facebook.com': 'Facebook', 'm.facebook.com': 'Facebook', 'l.facebook.com': 'Facebook',
  'www.instagram.com': 'Instagram', 'instagram.com': 'Instagram', 'l.instagram.com': 'Instagram',
  'twitter.com': 'X', 'x.com': 'X', 't.co': 'X',
  'www.reddit.com': 'Reddit', 'reddit.com': 'Reddit',
  'wa.me': 'WhatsApp', 'web.whatsapp.com': 'WhatsApp', 'whatsapp.com': 'WhatsApp',
  't.me': 'Telegram', 'web.telegram.org': 'Telegram',
  'bsky.app': 'Bluesky',
  'www.tumblr.com': 'Tumblr', 'tumblr.com': 'Tumblr',
  'dev.to': 'Dev.to', 'hashnode.com': 'Hashnode',
  'www.youtube.com': 'YouTube', 'youtube.com': 'YouTube', 'youtu.be': 'YouTube',
  'github.com': 'GitHub', 'www.github.com': 'GitHub',
  'mail.google.com': 'Gmail',
  'outlook.live.com': 'Outlook', 'outlook.office.com': 'Outlook',
};
function friendlySource(raw: string): string {
  if (!raw) return 'Direct';
  const lower = raw.toLowerCase().trim();
  if (SOURCE_MAP[lower]) return SOURCE_MAP[lower];
  // Give back the exact raw source if we don't know it, ensuring we don't hide granularity
  return raw;
}

async function hogql(query: string, name?: string): Promise<any[] | null> {
  if (!PH_API_KEY || !PH_PROJECT_ID) return null;
  try {
    const res = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT_ID}/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PH_API_KEY}`,
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query },
        ...(name ? { name } : {}),
      }),
    });
    if (!res.ok) {
      console.error('PostHog query failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    // HogQL returns { columns: [...], results: [[...], ...] }
    if (!data.results || !data.columns) return null;
    return data.results.map((row: any[]) => {
      const obj: any = {};
      data.columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj;
    });
  } catch (e) {
    console.error('PostHog query error:', e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check — verify token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided', debug: 'Authorization header missing' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createAdminClient(supabaseUrl, serviceKey || anonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized', debug: { authError: authError?.message, email: user?.email, hasUser: !!user } }, { status: 403 });
    }

    // ── Supabase queries (existing) ───────────────────────────────────────
    const [profilesRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, profile_picture_url, views, skills, experience, education, custom_sections, links, created_at, updated_at'),
    ]);

    let parseLogsRes: any = { data: null };
    try { parseLogsRes = await supabase.from('parse_logs').select('id, user_id, ip, created_at').order('created_at', { ascending: false }).limit(500); } catch { /* table may not exist */ }

    let contactRes: any = { data: null };
    try { contactRes = await supabase.from('contact_submissions').select('id, email, purpose, message, is_read, created_at').order('created_at', { ascending: false }).limit(50); } catch { /* table may not exist */ }

    let jobsRes: any = { count: 0 };
    try { jobsRes = await supabase.from('jobs').select('*', { count: 'exact', head: true }); } catch { /* table may not exist */ }

    let authUsers: any[] = [];
    if (serviceKey) {
      try {
        const authUsersRes = await supabase.auth.admin.listUsers({ perPage: 1000 });
        authUsers = authUsersRes.data?.users || [];
      } catch { /* service role key not available */ }
    }

    const profiles = profilesRes.data || [];
    const parseLogs = parseLogsRes.data || [];
    const contactSubmissions = contactRes.data || [];

    // ── PostHog queries (new — all run in parallel) ──────────────────────
    const [
      phPageviewsByDay,
      phUniqueVisitors,
      phTopPages,
      phTopReferrers,
      phDeviceTypes,
      phTopCountries,
      phTopBrowsers,
      phProfileViews,
      phAvgTimeOnProfile,
      phFunnelEvents,
      phShareEvents,
      phPageviewsTotal,
      phActiveUsersToday,
      phCvParsesTotal,
      phCvParsesByDay,
      phJobClicksTotal,
      phOsTypes,
    ] = await Promise.all([
      // 1. Pageviews by day (last 30 days)
      hogql(`
        SELECT
          toDate(timestamp) AS day,
          count() AS views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 30 day
        GROUP BY day
        ORDER BY day
      `, 'admin_pageviews_by_day'),

      // 2. Unique visitors last 7 days vs previous 7 days
      hogql(`
        SELECT
          uniqIf(distinct_id, timestamp >= now() - interval 7 day) AS this_week,
          uniqIf(distinct_id, timestamp >= now() - interval 14 day AND timestamp < now() - interval 7 day) AS last_week
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 14 day
      `, 'admin_unique_visitors'),

      // 3. Top pages by pageviews (last 7 days)
      hogql(`
        SELECT
          properties.$pathname AS page,
          count() AS views,
          countDistinct(distinct_id) AS uniques
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 7 day
          AND properties.$pathname != ''
        GROUP BY page
        ORDER BY views DESC
        LIMIT 20
      `, 'admin_top_pages'),

      // 4. Top referrers (last 7 days), prioritizing utm_source
      hogql(`
        SELECT
          multiIf(
            properties.utm_source != '', properties.utm_source,
            properties.$referring_domain != '', properties.$referring_domain,
            'Direct'
          ) AS referrer,
          count() AS visits
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 7 day
        GROUP BY referrer
        ORDER BY visits DESC
        LIMIT 25
      `, 'admin_top_referrers'),

      // 5. Device type breakdown (last 7 days)
      hogql(`
        SELECT
          properties.$device_type AS device,
          count() AS cnt
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 7 day
        GROUP BY device
        ORDER BY cnt DESC
      `, 'admin_device_types'),

      // 6. Top countries (last 7 days)
      hogql(`
        SELECT
          properties.$geoip_country_name AS country,
          count() AS visits
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 7 day
          AND properties.$geoip_country_name != ''
        GROUP BY country
        ORDER BY visits DESC
        LIMIT 10
      `, 'admin_top_countries'),

      // 7. Top browsers (last 7 days)
      hogql(`
        SELECT
          properties.$browser AS browser,
          count() AS cnt
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 7 day
          AND properties.$browser != ''
        GROUP BY browser
        ORDER BY cnt DESC
        LIMIT 8
      `, 'admin_top_browsers'),

      // 8. Profile views trend (profile_viewed events last 30 days)
      hogql(`
        SELECT
          toDate(timestamp) AS day,
          count() AS views,
          countDistinct(distinct_id) AS unique_viewers
        FROM events
        WHERE event = 'profile_viewed'
          AND timestamp >= now() - interval 30 day
        GROUP BY day
        ORDER BY day
      `, 'admin_profile_views_trend'),

      // 9. Average time spent on profiles
      hogql(`
        SELECT
          avg(toFloat64OrNull(toString(properties.seconds))) AS avg_seconds,
          max(toFloat64OrNull(toString(properties.seconds))) AS max_seconds,
          count() AS sample_size
        FROM events
        WHERE event = 'profile_time_spent'
          AND timestamp >= now() - interval 7 day
      `, 'admin_avg_time_on_profile'),

      // 10. Funnel events (landing → signup → editor → profile)
      hogql(`
        SELECT
          event,
          count() AS cnt,
          countDistinct(distinct_id) AS unique_users
        FROM events
        WHERE event IN (
          'landing_cv_upload_started',
          'landing_cv_upload_completed',
          'landing_cv_upload_failed',
          'auth_google_started',
          'auth_magic_link_sent',
          'editor_cv_parse_started',
          'editor_cv_parse_saved',
          'editor_cv_parse_anonymous',
          'editor_photo_updated',
          'editor_slug_changed',
          'profile_viewed',
          'profile_celebration_shown',
          'editor_account_deleted',
          'user_logout',
          'jobs_interstitial_modal_shown',
          'jobs_interstitial_upload_cv_started',
          'jobs_interstitial_upload_cv_completed',
          'jobs_interstitial_skip_apply_clicked'
        )
          AND timestamp >= now() - interval 30 day
        GROUP BY event
        ORDER BY cnt DESC
      `, 'admin_funnel_events'),

      // 11. Share events breakdown
      hogql(`
        SELECT
          event,
          count() AS cnt
        FROM events
        WHERE event IN (
          'editor_share_x',
          'editor_share_linkedin',
          'editor_share_facebook',
          'editor_share_link_copied',
          'editor_share_message_copied',
          'profile_share_link_copied',
          'profile_share_linkedin',
          'profile_share_x',
          'profile_share_facebook',
          'profile_share_whatsapp',
          'profile_story_card_downloaded'
        )
          AND timestamp >= now() - interval 30 day
        GROUP BY event
        ORDER BY cnt DESC
      `, 'admin_share_events'),

      // 12. Total pageviews last 7d vs previous 7d
      hogql(`
        SELECT
          countIf(timestamp >= now() - interval 7 day) AS this_week,
          countIf(timestamp >= now() - interval 14 day AND timestamp < now() - interval 7 day) AS last_week
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 14 day
      `, 'admin_pageviews_wow'),

      // 13. Active distinct users today
      hogql(`
        SELECT countDistinct(distinct_id) AS active_today
        FROM events
        WHERE timestamp >= now() - interval 24 hour
          AND event = '$pageview'
      `, 'admin_active_today'),

      // 14. Total CV parses (PostHog)
      hogql(`
        SELECT count() AS total
        FROM events
        WHERE event = 'editor_cv_parse_started'
          AND timestamp >= now() - interval 30 day
      `, 'admin_cv_parses_total'),

      // 15. CV parses by day (for trend chart)
      hogql(`
        SELECT toDate(timestamp) AS day, count() AS cnt
        FROM events
        WHERE event = 'editor_cv_parse_started'
          AND timestamp >= now() - interval 14 day
        GROUP BY day ORDER BY day
      `, 'admin_cv_parses_by_day'),

      // 16. Total Job Clicks
      hogql(`
        SELECT count() AS total
        FROM events
        WHERE event = 'job_clicked'
          AND timestamp >= now() - interval 30 day
      `, 'admin_job_clicks_total'),

      // 17. OS Types breakdown
      hogql(`
        SELECT
          properties.$os AS os,
          count() AS cnt
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 7 day
        GROUP BY os
        ORDER BY cnt DESC
      `, 'admin_os_types'),
    ]);

    // ── Supabase KPIs (existing) ─────────────────────────────────────────
    const totalUsers = profiles.length;
    const totalViews = profiles.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
    const totalParses = phCvParsesTotal?.[0]?.total || parseLogs.length;
    const usersWithPhoto = profiles.filter((p: any) => p.profile_picture_url && p.profile_picture_url.trim() !== '').length;
    const usersWithExperience = profiles.filter((p: any) => Array.isArray(p.experience) && p.experience.length > 0).length;
    const usersWithEducation = profiles.filter((p: any) => Array.isArray(p.education) && p.education.length > 0).length;
    const usersWithSkills = profiles.filter((p: any) => Array.isArray(p.skills) && p.skills.length > 0).length;
    const usersWithCustomSections = profiles.filter((p: any) => Array.isArray(p.custom_sections) && p.custom_sections.length > 0).length;
    const usersWithLinks = profiles.filter((p: any) => Array.isArray(p.links) && p.links.length > 0).length;
    const avgViews = totalUsers > 0 ? Math.round(totalViews / totalUsers) : 0;
    const totalJobs = jobsRes.count || 0;

    // ── Signup trend ──
    const signupsByDay: Record<string, number> = {};
    const now = new Date();
    const earliestDate = profiles.reduce((min: Date, p: any) => {
      if (!p.created_at) return min;
      const d = new Date(p.created_at);
      return d < min ? d : min;
    }, now);
    const daysSinceFirst = Math.max(Math.ceil((now.getTime() - earliestDate.getTime()) / (86400000)), 1);
    for (let i = daysSinceFirst; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      signupsByDay[key] = 0;
    }
    const signupSource = authUsers.length > 0 ? authUsers : profiles;
    for (const u of signupSource) {
      const createdAt = u.created_at;
      if (!createdAt) continue;
      const day = new Date(createdAt).toISOString().split('T')[0];
      if (day in signupsByDay) signupsByDay[day]++;
    }
    const signupTrend = Object.entries(signupsByDay).map(([date, count]) => ({ date, count }));

    // ── Top profiles ──
    const topProfiles = [...profiles]
      .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
      .slice(0, 15)
      .map((p: any) => ({ name: p.full_name || p.username || 'Unknown', slug: p.username, views: p.views || 0 }));

    // ── Parse trend (prefer PostHog, fallback to parse_logs) ──
    let parseTrend: { date: string; count: number }[] = [];
    if (phCvParsesByDay && phCvParsesByDay.length > 0) {
      const parsesByDay: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        parsesByDay[d.toISOString().split('T')[0]] = 0;
      }
      for (const row of phCvParsesByDay) {
        if (row.day in parsesByDay) parsesByDay[row.day] = row.cnt;
      }
      parseTrend = Object.entries(parsesByDay).map(([date, count]) => ({ date, count }));
    } else {
      const parsesByDay: Record<string, number> = {};
      for (let i = daysSinceFirst; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        parsesByDay[d.toISOString().split('T')[0]] = 0;
      }
      for (const log of parseLogs) {
        const day = new Date(log.created_at).toISOString().split('T')[0];
        if (day in parsesByDay) parsesByDay[day]++;
      }
      parseTrend = Object.entries(parsesByDay).map(([date, count]) => ({ date, count }));
    }

    // ── Profile completeness ──
    const completeness = {
      hasPhoto: usersWithPhoto,
      noPhoto: totalUsers - usersWithPhoto,
      hasExperience: usersWithExperience,
      noExperience: totalUsers - usersWithExperience,
      hasEducation: usersWithEducation,
      noEducation: totalUsers - usersWithEducation,
      hasSkills: usersWithSkills,
      noSkills: totalUsers - usersWithSkills,
      hasCustomSections: usersWithCustomSections,
      hasLinks: usersWithLinks,
    };

    // ── Auth providers ──
    const providerCounts: Record<string, number> = {};
    if (authUsers.length > 0) {
      for (const u of authUsers) {
        const provider = u.app_metadata?.provider || 'unknown';
        providerCounts[provider] = (providerCounts[provider] || 0) + 1;
      }
    } else {
      providerCounts['google'] = totalUsers;
    }
    const authProviders = Object.entries(providerCounts).map(([provider, count]) => ({ provider, count }));

    // ── Recent signups ──
    let recentUsers: any[] = [];
    if (authUsers.length > 0) {
      recentUsers = [...authUsers]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((u: any) => {
          const profile = profiles.find((p: any) => p.id === u.id);
          return {
            email: u.email || '',
            name: profile?.full_name || u.user_metadata?.full_name || '',
            slug: profile?.username || '',
            views: profile?.views || 0,
            provider: u.app_metadata?.provider || 'unknown',
            createdAt: u.created_at,
            lastSignIn: u.last_sign_in_at || null,
            hasPhoto: !!(profile?.profile_picture_url && profile.profile_picture_url.trim()),
            hasResume: Array.isArray(profile?.experience) && profile.experience.length > 0,
          };
        });
    } else {
      recentUsers = [...profiles]
        .filter((p: any) => p.created_at)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((p: any) => {
          const emailLink = Array.isArray(p.links) ? p.links.find((l: any) => l.type === 'email') : null;
          return {
            email: emailLink?.value || '',
            name: p.full_name || '',
            slug: p.username || '',
            views: p.views || 0,
            provider: 'google',
            createdAt: p.created_at,
            lastSignIn: p.updated_at || null,
            hasPhoto: !!(p.profile_picture_url && p.profile_picture_url.trim()),
            hasResume: Array.isArray(p.experience) && p.experience.length > 0,
          };
        });
    }

    // ── Additional metrics ──
    const usersUpdatedLast7d = profiles.filter((p: any) => {
      if (!p.updated_at) return false;
      const diff = Date.now() - new Date(p.updated_at).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    const totalSkillsCount = profiles.reduce((sum: number, p: any) => sum + (Array.isArray(p.skills) ? p.skills.length : 0), 0);
    const avgSkillsPerUser = totalUsers > 0 ? Math.round(totalSkillsCount / totalUsers * 10) / 10 : 0;

    const totalLinksCount = profiles.reduce((sum: number, p: any) => sum + (Array.isArray(p.links) ? p.links.length : 0), 0);

    const viewsSorted = profiles.map((p: any) => p.views || 0).sort((a: number, b: number) => a - b);
    const medianViews = viewsSorted.length > 0 ? viewsSorted[Math.floor(viewsSorted.length / 2)] : 0;
    const zeroViewProfiles = profiles.filter((p: any) => !p.views || p.views === 0).length;

    const totalWorkEntries = profiles.reduce((sum: number, p: any) => sum + (Array.isArray(p.experience) ? p.experience.length : 0), 0);
    const totalEduEntries = profiles.reduce((sum: number, p: any) => sum + (Array.isArray(p.education) ? p.education.length : 0), 0);

    // ── Product Timeline ──
    const productTimeline = [
      { date: '2026-03-26', tag: 'analytics', title: 'PostHog Deep Analytics for Admin', desc: 'Pageviews, referrers, countries, devices, funnel events, share analytics, profile engagement — all from PostHog HogQL' },
      { date: '2026-03-25', tag: 'security', title: 'Admin Dashboard & Schema Hardening', desc: 'Admin analytics, server-side account deletion, Supabase-backed rate limiting, 8 schema fixes' },
      { date: '2026-03-25', tag: 'legal', title: 'Contact Email & Legal Updates', desc: 'Added hi@cvin.bio to Privacy Policy and Terms of Service' },
      { date: '2026-03-24', tag: 'feature', title: 'Celebration Modal & Social Sharing', desc: 'Confetti, share to LinkedIn/X/WhatsApp/Facebook, story card generator, 15 rotating copy options per platform' },
      { date: '2026-03-24', tag: 'feature', title: 'Social Links Editor', desc: 'Add/remove Twitter, Instagram, Dribbble, or any custom platform link' },
      { date: '2026-03-24', tag: 'design', title: 'OG Image Overhaul', desc: 'Symmetrical OG card with proportional type scale, smart caching, avatar proxy for social unfurling' },
      { date: '2026-03-24', tag: 'feature', title: 'Complete 404 Page Redesign', desc: 'Beautiful CTA-driven 404 with feature showcase' },
      { date: '2026-03-24', tag: 'fix', title: 'QA Audit — 18 Bug Fixes', desc: '5 rounds of QA: data loss prevention, race conditions, UX polish' },
      { date: '2026-03-23', tag: 'feature', title: 'Real-Time Editor Preview', desc: 'Live preview tab synced via BroadcastChannel, avatar cropping' },
      { date: '2026-03-23', tag: 'content', title: 'Blog Architecture Refactor', desc: '69 GEO-optimized FAQs, hydration fixes, article guidelines doc' },
      { date: '2026-03-23', tag: 'fix', title: 'QA — 13 Edge Cases Fixed', desc: 'Critical data loss bugs, stale localStorage prevention, guest avatar handling' },
      { date: '2026-03-23', tag: 'seo', title: 'SEO Pipeline Hardening', desc: 'Sitemap, llms.txt, AI crawler indexing, semantic metadata' },
      { date: '2026-03-22', tag: 'security', title: 'XSS & CORS Vulnerability Patched', desc: 'Stored XSS in schema-ld, CORS poisoning in PDF exports sealed' },
      { date: '2026-03-22', tag: 'feature', title: 'Multi-Format CV Upload', desc: 'PDF, DOC, DOCX, RTF, TXT, and image (photo of CV) support' },
      { date: '2026-03-22', tag: 'feature', title: 'AI Resume Parser — Gemini 2.5 Flash', desc: 'Vision + text pipeline, retry logic, regex fallback, OCR cleaning' },
      { date: '2026-03-22', tag: 'feature', title: 'One-Click PDF Download', desc: 'html2pdf.js export with Name-CVinBio.pdf naming' },
      { date: '2026-03-22', tag: 'feature', title: 'Magic Link Authentication', desc: 'Passwordless sign-in via email magic links + Google OAuth' },
      { date: '2026-03-22', tag: 'feature', title: 'Real-Time Slug Validation', desc: 'Live URL availability checking with uniqueness enforcement' },
      { date: '2026-03-22', tag: 'design', title: 'Professional Favicon & PWA', desc: 'Sharp SVG favicon, PWA manifest, apple touch icons' },
      { date: '2026-03-22', tag: 'content', title: 'Blog Launch — 8 Original Articles', desc: 'Human-written content with FAQs, internal linking, read-next sections' },
      { date: '2026-03-22', tag: 'feature', title: 'Guest CV Upload', desc: 'Parse and preview your resume without creating an account' },
    ];

    return NextResponse.json({
      kpis: {
        totalUsers,
        totalViews,
        totalParses,
        avgViews,
        medianViews,
        usersWithPhoto,
        usersWithExperience,
        usersWithEducation,
        usersWithSkills,
        usersUpdatedLast7d,
        zeroViewProfiles,
        avgSkillsPerUser,
        totalLinksCount,
        totalWorkEntries,
        totalEduEntries,
        totalJobs,
      },
      signupTrend,
      topProfiles,
      parseTrend,
      completeness,
      authProviders,
      recentUsers,
      productTimeline,
      contactSubmissions,
      // ── PostHog analytics (null if key not configured) ──
      posthog: {
        available: !!(PH_API_KEY && PH_PROJECT_ID),
        pageviewsByDay: phPageviewsByDay,
        uniqueVisitors: phUniqueVisitors?.[0] || null,
        topPages: phTopPages,
        topReferrers: (phTopReferrers || []).map((r: any) => ({ ...r, referrer: friendlySource(r.referrer) })),
        deviceTypes: phDeviceTypes,
        osTypes: phOsTypes,
        topCountries: phTopCountries,
        topBrowsers: phTopBrowsers,
        profileViewsTrend: phProfileViews,
        avgTimeOnProfile: phAvgTimeOnProfile?.[0] || null,
        funnelEvents: phFunnelEvents,
        shareEvents: phShareEvents,
        pageviewsWoW: phPageviewsTotal?.[0] || null,
        activeToday: phActiveUsersToday?.[0]?.active_today || 0,
        jobClicksTotal: phJobClicksTotal?.[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal error', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
