import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  title: 'Job Board | CVin.Bio',
  description: 'Browse 6,000+ tech jobs from Stripe, Airbnb, Coinbase, Discord, and 60+ companies. Filter by role, location, and job type. Upload your CV for personalized skill matching.',
  keywords: [
    'tech jobs', 'job board', 'remote jobs', 'software engineer jobs',
    'developer jobs', 'startup jobs', 'full time jobs', 'contract jobs',
    'internship', 'CVin.Bio jobs', 'skill matching', 'AI job matching',
  ],
  alternates: {
    canonical: `${siteUrl}/jobs`,
  },
  openGraph: {
    title: 'Job Board — 6,000+ Tech Jobs | CVin.Bio',
    description: 'Browse jobs from Stripe, Airbnb, Coinbase, Discord, and 60+ companies. Upload your CV for personalized skill matching.',
    url: `${siteUrl}/jobs`,
    siteName: 'CVin.Bio',
    images: [{ url: `${siteUrl}/images/jobs-og.png`, width: 1200, height: 630, alt: 'CVin.Bio Job Board — browse and apply to tech jobs' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Board — 6,000+ Tech Jobs | CVin.Bio',
    description: 'Browse jobs from Stripe, Airbnb, Coinbase & more. Upload your CV for personalized matches.',
    images: [`${siteUrl}/images/jobs-og.png`],
    creator: '@cvinbio',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large' as any,
    'max-video-preview': -1,
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Job Board | CVin.Bio',
            description: 'Browse 6,000+ tech jobs from top companies. Upload your CV for personalized skill matching.',
            url: `${siteUrl}/jobs`,
            isPartOf: {
              '@type': 'WebSite',
              name: 'CVin.Bio',
              url: siteUrl,
            },
            mainEntity: {
              '@type': 'ItemList',
              name: 'Tech Job Listings',
              description: 'Curated tech job listings from 60+ companies including Stripe, Airbnb, Coinbase, Discord, and more.',
              numberOfItems: 6000,
              itemListOrder: 'https://schema.org/ItemListUnordered',
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
                { '@type': 'ListItem', position: 2, name: 'Job Board', item: `${siteUrl}/jobs` },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  );
}
