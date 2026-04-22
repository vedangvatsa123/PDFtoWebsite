import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  title: 'The Tech Layoffs Report 2026 — Data, Trends, and Analysis',
  description: 'Since 2020, 750,000+ tech workers have been laid off. This report examines the data: who is cutting, why, and what it means for the labor market in 2026 and beyond.',
  keywords: ['tech layoffs 2026', 'tech layoffs report', 'layoff tracker', 'tech industry layoffs', 'mass layoffs technology'],
  openGraph: {
    title: 'The Tech Layoffs Report 2026',
    description: 'Since 2020, 750,000+ tech workers have been laid off. Data-driven analysis of who is cutting, why, and what happens next.',
    url: `${siteUrl}/layoffs-report`,
    type: 'article',
    images: [{ url: `${siteUrl}/layoffs-report/opengraph-image`, width: 1200, height: 630, alt: 'Tech Layoffs Report 2026' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Tech Layoffs Report 2026',
    description: '750K+ tech workers laid off since 2020. The data behind the headlines.',
    images: [`${siteUrl}/layoffs-report/opengraph-image`],
  },
  alternates: { canonical: `${siteUrl}/layoffs-report` },
};

export default function LayoffsReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
