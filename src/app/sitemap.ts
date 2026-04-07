import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-data';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/remote-talent-report`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/layoffs-report`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/ai-discovery`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Add /companies listing page
  staticEntries.push({
    url: `${siteUrl}/companies`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Dynamic user profile URLs
  let profileEntries: MetadataRoute.Sitemap = [];
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('username, updated_at, full_name, about, skills, experience, education')
      .not('username', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (profiles) {
      profileEntries = profiles
        .filter(p => {
          if (!p.username || p.username.length < 3) return false;
          const hasRealName = p.full_name && p.full_name !== 'Your Name' && p.full_name.length > 1;
          const hasContent = (p.about && p.about.length > 10)
            || (Array.isArray(p.skills) && p.skills.length > 0)
            || (Array.isArray(p.experience) && p.experience.length > 0)
            || (Array.isArray(p.education) && p.education.length > 0);
          return hasRealName && hasContent;
        })
        .map(p => ({
          url: `${siteUrl}/${p.username}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch profiles', e);
  }

  // Dynamic company page URLs
  let companyEntries: MetadataRoute.Sitemap = [];
  try {
    let allJobs: any[] = [];
    let page = 0;
    while (true) {
      const { data } = await supabase
        .from('jobs')
        .select('company')
        .range(page * 1000, (page + 1) * 1000 - 1);
      if (!data || data.length === 0) break;
      allJobs.push(...data);
      if (data.length < 1000) break;
      page++;
    }
    const companyNames = new Set<string>();
    allJobs.forEach(j => {
      if (j.company && !j.company.includes('...')) companyNames.add(j.company);
    });
    const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
    const seenSlugs = new Set<string>();
    companyNames.forEach(name => {
      const slug = toSlug(name);
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        companyEntries.push({
          url: `${siteUrl}/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        });
      }
    });
  } catch (e) {
    console.error('Sitemap: failed to fetch companies', e);
  }

  return [...staticEntries, ...blogEntries, ...profileEntries, ...companyEntries];
}
