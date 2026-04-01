import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  title: 'The Remote Talent Report 2026',
  description: 'A data-driven analysis of the remote workforce. 34 million Americans work remotely. Companies offering flexibility see 3x larger candidate pools. Read the full report.',
  keywords: ['remote work report', 'remote talent', 'hybrid work statistics', 'remote work data 2026', 'future of work'],
  alternates: { canonical: `${siteUrl}/remote-talent-report` },
  openGraph: {
    title: 'The Remote Talent Report 2026',
    description: 'Data-driven research on the remote workforce. Stanford, McKinsey, and proprietary CVin.Bio data.',
    url: `${siteUrl}/remote-talent-report`,
    siteName: 'CVin.Bio',
    type: 'article',
    images: [{ url: `${siteUrl}/remote-talent-report/opengraph-image`, width: 1200, height: 630, alt: 'The Remote Talent Report 2026' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Remote Talent Report 2026',
    description: '27% of knowledge workers are fully remote. What does this mean for hiring?',
    creator: '@cvinbio',
    images: [`${siteUrl}/remote-talent-report/opengraph-image`],
  },
};

export default function RemoteTalentReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Report',
            name: 'The Remote Talent Report 2026',
            description: 'A data-driven analysis of the state of remote work in 2026.',
            author: { '@type': 'Organization', name: 'CVin.Bio', url: siteUrl },
            datePublished: '2026-03-31',
            publisher: { '@type': 'Organization', name: 'CVin.Bio' },
            about: { '@type': 'Thing', name: 'Remote Work' },
          }),
        }}
      />
      {children}
    </>
  );
}
