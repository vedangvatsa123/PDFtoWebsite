import { NextResponse, NextRequest } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Only these emails can access the admin dashboard
const ADMIN_EMAILS = ['vatsvedang@gmail.com'];

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check — verify token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // supabase is already the service-role client from above

    // ── Parallel queries for speed ──
    const [
      profilesRes,
      authUsersRes,
      parseLogsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, profile_picture_url, views, skills, experience, education, custom_sections, links, created_at, updated_at'),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
      supabase.from('parse_logs').select('id, user_id, ip, created_at').order('created_at', { ascending: false }).limit(500),
    ]);

    const profiles = profilesRes.data || [];
    const authUsers = authUsersRes.data?.users || [];
    const parseLogs = parseLogsRes.data || [];

    // ── KPIs ──
    const totalUsers = profiles.length;
    const totalViews = profiles.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalParses = parseLogs.length;
    const usersWithPhoto = profiles.filter(p => p.profile_picture_url && p.profile_picture_url.trim() !== '').length;
    const usersWithExperience = profiles.filter(p => Array.isArray(p.experience) && p.experience.length > 0).length;
    const usersWithEducation = profiles.filter(p => Array.isArray(p.education) && p.education.length > 0).length;
    const usersWithSkills = profiles.filter(p => Array.isArray(p.skills) && p.skills.length > 0).length;
    const usersWithCustomSections = profiles.filter(p => Array.isArray(p.custom_sections) && p.custom_sections.length > 0).length;
    const usersWithLinks = profiles.filter(p => Array.isArray(p.links) && p.links.length > 0).length;
    const avgViews = totalUsers > 0 ? Math.round(totalViews / totalUsers) : 0;

    // ── Signup trend (last 30 days) ──
    const signupsByDay: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      signupsByDay[key] = 0;
    }
    for (const u of authUsers) {
      const day = new Date(u.created_at).toISOString().split('T')[0];
      if (day in signupsByDay) signupsByDay[day]++;
    }
    const signupTrend = Object.entries(signupsByDay).map(([date, count]) => ({ date, count }));

    // ── Views distribution (top 15 profiles) ──
    const topProfiles = [...profiles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 15)
      .map(p => ({ name: p.full_name || p.username || 'Unknown', slug: p.username, views: p.views || 0 }));

    // ── Parse trend (last 14 days) ──
    const parsesByDay: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      parsesByDay[key] = 0;
    }
    for (const log of parseLogs) {
      const day = new Date(log.created_at).toISOString().split('T')[0];
      if (day in parsesByDay) parsesByDay[day]++;
    }
    const parseTrend = Object.entries(parsesByDay).map(([date, count]) => ({ date, count }));

    // ── Profile completeness breakdown ──
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

    // ── Auth providers breakdown ──
    const providerCounts: Record<string, number> = {};
    for (const u of authUsers) {
      const provider = u.app_metadata?.provider || 'unknown';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    }
    const authProviders = Object.entries(providerCounts).map(([provider, count]) => ({ provider, count }));

    // ── Recent signups (last 10) ──
    const recentUsers = [...authUsers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(u => {
        const profile = profiles.find(p => p.id === u.id);
        return {
          email: u.email || '',
          name: profile?.full_name || u.user_metadata?.full_name || '',
          slug: profile?.username || '',
          views: profile?.views || 0,
          provider: u.app_metadata?.provider || 'unknown',
          createdAt: u.created_at,
          hasPhoto: !!(profile?.profile_picture_url && profile.profile_picture_url.trim()),
          hasResume: Array.isArray(profile?.experience) && profile.experience.length > 0,
        };
      });

    // ── Additional metrics ──
    const usersUpdatedLast7d = profiles.filter(p => {
      if (!p.updated_at) return false;
      const diff = Date.now() - new Date(p.updated_at).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    const totalSkillsCount = profiles.reduce((sum, p) => sum + (Array.isArray(p.skills) ? p.skills.length : 0), 0);
    const avgSkillsPerUser = totalUsers > 0 ? Math.round(totalSkillsCount / totalUsers * 10) / 10 : 0;

    const totalLinksCount = profiles.reduce((sum, p) => sum + (Array.isArray(p.links) ? p.links.length : 0), 0);

    const viewsSorted = profiles.map(p => p.views || 0).sort((a, b) => a - b);
    const medianViews = viewsSorted.length > 0 ? viewsSorted[Math.floor(viewsSorted.length / 2)] : 0;
    const zeroViewProfiles = profiles.filter(p => !p.views || p.views === 0).length;

    const totalWorkEntries = profiles.reduce((sum, p) => sum + (Array.isArray(p.experience) ? p.experience.length : 0), 0);
    const totalEduEntries = profiles.reduce((sum, p) => sum + (Array.isArray(p.education) ? p.education.length : 0), 0);

    // ── Product Timeline (curated milestones) ──
    const productTimeline = [
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
      },
      signupTrend,
      topProfiles,
      parseTrend,
      completeness,
      authProviders,
      recentUsers,
      productTimeline,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
