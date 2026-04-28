import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

// Revalidate metadata layout every hour so job counts stay dynamic
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch job count
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .not('company', 'ilike', '%Gopuff%');

  let countStr = '19,000+';
  if (count) {
    countStr = count.toLocaleString();
  }

  return {
    title: `Browse ${countStr} Open Roles at Top Companies | CVin.Bio`,
    description: `Browse ${countStr} tech job openings at top companies including OpenAI, Stripe, Cloudflare, Anthropic and more. Filter by role, location, and company. Updated daily.`,
    keywords: ['tech jobs', 'software engineer jobs', 'AI jobs', 'remote tech jobs', 'startup jobs', 'engineering careers'],
    openGraph: {
      title: `Browse ${countStr} Jobs at Top Companies`,
      description: `Search open roles at OpenAI, Stripe, Cloudflare, Anthropic, Databricks, and hundreds of top tech companies. Updated daily.`,
      url: `${siteUrl}/jobs`,
      type: 'website',
      // Next.js will automatically use opengraph-image.tsx
    },
    twitter: {
      card: 'summary_large_image',
      title: `Browse ${countStr} Jobs`,
      description: 'Search open roles at top tech companies. Updated daily.',
    },
    alternates: { canonical: `${siteUrl}/jobs` },
  };
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
