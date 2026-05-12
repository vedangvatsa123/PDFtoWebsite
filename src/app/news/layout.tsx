import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cvin.bio';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Tech News | CVin.Bio',
    description: 'Latest tech news from TechCrunch, The Verge, Hacker News, Ars Technica, Wired, and more. Stay updated with the tech industry.',
    keywords: ['tech news', 'technology news', 'startup news', 'AI news', 'software news', 'hacker news'],
    openGraph: {
      title: 'Tech News Feed',
      description: 'Curated tech news from the top sources in one feed.',
      url: `${siteUrl}/news`,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Tech News Feed',
    },
    alternates: { canonical: `${siteUrl}/news` },
  };
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
