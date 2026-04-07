import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  title: 'Tech Jobs — Browse 17,000+ Open Roles at Top Companies',
  description: 'Browse 17,000+ tech job openings at 170+ companies including OpenAI, Stripe, Cloudflare, Anthropic and more. Filter by role, location, and company. Updated daily.',
  keywords: ['tech jobs', 'software engineer jobs', 'AI jobs', 'remote tech jobs', 'startup jobs', 'engineering careers'],
  openGraph: {
    title: 'Browse 17,000+ Tech Jobs at Top Companies',
    description: 'Search open roles at OpenAI, Stripe, Cloudflare, Anthropic, Databricks, and 170+ top tech companies. Updated daily.',
    url: `${siteUrl}/jobs`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse 17,000+ Tech Jobs',
    description: 'Search open roles at top tech companies. Updated daily.',
  },
  alternates: { canonical: `${siteUrl}/jobs` },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
