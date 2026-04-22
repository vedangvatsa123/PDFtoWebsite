import type { Metadata } from 'next';
import { getPlatformStats } from '@/lib/get-platform-stats';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getPlatformStats();
  return {
    title: 'The Tech Talent Report 2026 — Skills, Roles, and Hiring Trends',
    description: `Analysis of ${stats.jobCountDisplay} job listings across ${stats.companyCountDisplay} companies. Which skills are most in demand? Where is hiring happening? How much does AI matter? The data tells the story.`,
    keywords: ['tech talent report 2026', 'tech hiring trends', 'AI jobs report', 'software engineer demand', 'tech skills demand', 'programming language trends'],
    openGraph: {
      title: 'The Tech Talent Report 2026',
      description: `Analysis of ${stats.jobCountDisplay} listings across ${stats.companyCountDisplay} companies. Skills, roles, compensation, and regional hiring patterns.`,
      url: `${siteUrl}/tech-talent-report`,
      type: 'article',
      images: [{ url: `${siteUrl}/tech-talent-report/opengraph-image`, width: 1200, height: 630, alt: 'Tech Talent Report 2026' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'The Tech Talent Report 2026',
      description: `${stats.jobCountDisplay} jobs analyzed. What the data reveals about tech hiring in 2026.`,
      images: [`${siteUrl}/tech-talent-report/opengraph-image`],
    },
    alternates: { canonical: `${siteUrl}/tech-talent-report` },
  };
}

export default function TechTalentReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
