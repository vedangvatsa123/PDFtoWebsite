import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  title: 'The Tech Layoffs Report 2026 | CVin.Bio',
  description: 'A data-driven analysis of tech layoffs from 2020 to 2026. 750,000+ workers displaced. Who is cutting, why, and what happens next. Research from Layoffs.fyi, Challenger, BLS, and Crunchbase.',
  keywords: ['tech layoffs 2026', 'layoff statistics', 'tech job cuts', 'layoffs report', 'AI layoffs', 'DOGE layoffs'],
  alternates: { canonical: `${siteUrl}/layoffs-report` },
  openGraph: {
    title: 'The Tech Layoffs Report 2026',
    description: '750,000+ tech workers displaced since 2020. Data from Layoffs.fyi, Challenger, and BLS JOLTS.',
    url: `${siteUrl}/layoffs-report`,
    siteName: 'CVin.Bio',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Tech Layoffs Report 2026',
    description: '750K+ tech workers laid off since 2020. What does the data actually show?',
    creator: '@cvinbio',
  },
};

export default function LayoffsReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Report',
            name: 'The Tech Layoffs Report 2026',
            description: 'A data-driven analysis of tech industry layoffs from 2020 through 2026.',
            author: { '@type': 'Organization', name: 'CVin.Bio', url: siteUrl },
            datePublished: '2026-03-31',
            publisher: { '@type': 'Organization', name: 'CVin.Bio' },
            about: { '@type': 'Thing', name: 'Tech Layoffs' },
          }),
        }}
      />
      {children}
    </>
  );
}
