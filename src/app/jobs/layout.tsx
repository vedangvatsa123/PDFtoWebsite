import type { Metadata } from 'next';

import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export async function generateMetadata(): Promise<Metadata> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .not('company', 'ilike', '%Gopuff%');

  let countStr = '17,000+';
  if (count && count >= 1000) {
    countStr = `${Math.floor(count / 1000)},000+`;
  } else if (count) {
    countStr = `${count}`;
  }

  return {
    title: `Tech Jobs — Browse ${countStr} Open Roles at Top Companies`,
    description: `Browse ${countStr} tech job openings at 170+ companies including OpenAI, Stripe, Cloudflare, Anthropic and more. Filter by role, location, and company. Updated daily.`,
    keywords: ['tech jobs', 'software engineer jobs', 'AI jobs', 'remote tech jobs', 'startup jobs', 'engineering careers'],
    openGraph: {
      title: `Browse ${countStr} Tech Jobs at Top Companies`,
      description: `Search open roles at OpenAI, Stripe, Cloudflare, Anthropic, Databricks, and 170+ top tech companies. Updated daily.`,
      url: `${siteUrl}/jobs`,
      type: 'website',
      images: [{ url: `${siteUrl}/images/jobs-og.png`, width: 1200, height: 630, alt: 'CVin.Bio Tech Jobs' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Browse ${countStr} Tech Jobs`,
      description: 'Search open roles at top tech companies. Updated daily.',
      images: [`${siteUrl}/images/jobs-og.png`],
    },
    alternates: { canonical: `${siteUrl}/jobs` },
  };
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
