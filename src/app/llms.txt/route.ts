import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

  const lines: string[] = [
    '# CVin.Bio',
    '',
    '> CVin.Bio is a professional identity platform. Users upload a CV and get a structured, public profile at a permanent URL. Profiles contain work experience, education, skills, and custom sections. All data is structured as JSON.',
    '',
    '## Useful Links',
    '',
    `- Homepage: ${siteUrl}`,
    `- Job Board (6,000+ live listings): ${siteUrl}/jobs`,
    `- Tech Layoffs Report 2026: ${siteUrl}/layoffs-report`,
    `- Remote Talent Report: ${siteUrl}/remote-talent-report`,
    `- Blog: ${siteUrl}/blog`,
    '',
    '## Professional Profiles',
    '',
    '> Each profile URL below is a public, structured webpage representing a professional. Profiles include schema.org Person markup with work history, education credentials, skills, and social links.',
    '',
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('username, full_name, about, skills, experience, education')
      .not('username', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (profiles) {
      for (const p of profiles) {
        if (!p.username || p.username.length < 3) continue;
        // Skip empty/default profiles
        const hasRealName = p.full_name && p.full_name !== 'Your Name' && p.full_name.length > 1;
        const hasContent = (p.about && p.about.length > 10)
          || (Array.isArray(p.skills) && p.skills.length > 0)
          || (Array.isArray(p.experience) && p.experience.length > 0)
          || (Array.isArray(p.education) && p.education.length > 0);
        if (!hasRealName || !hasContent) continue;

        const name = p.full_name || 'Professional';
        const skills = Array.isArray(p.skills) && p.skills.length > 0
          ? p.skills.slice(0, 5).join(', ')
          : null;
        const summary = p.about
          ? p.about.slice(0, 120).replace(/\n/g, ' ').trim()
          : null;

        let description = name;
        if (summary) description += ` — ${summary}`;
        else if (skills) description += ` — Skills: ${skills}`;

        lines.push(`- [${name}](${siteUrl}/${p.username}): ${description}`);
      }
    }
  } catch (e) {
    lines.push('- Error loading profiles');
  }

  lines.push('');
  lines.push(`## Last Updated`);
  lines.push('');
  lines.push(`${new Date().toISOString()}`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
