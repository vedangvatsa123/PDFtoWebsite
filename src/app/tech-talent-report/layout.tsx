import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  title: 'The Tech Talent Report 2026 — Skills, Roles, and Hiring Trends',
  description: 'Analysis of 17,000+ job listings across 170+ companies. Which skills are most in demand? Where is hiring happening? How much does AI matter? The data tells the story.',
  keywords: ['tech talent report 2026', 'tech hiring trends', 'AI jobs report', 'software engineer demand', 'tech skills demand', 'programming language trends'],
  openGraph: {
    title: 'The Tech Talent Report 2026',
    description: 'Analysis of 17,000+ listings across 170+ companies. Skills, roles, compensation, and regional hiring patterns.',
    url: `${siteUrl}/tech-talent-report`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Tech Talent Report 2026',
    description: '17,000+ jobs analyzed. What the data reveals about tech hiring in 2026.',
  },
  alternates: { canonical: `${siteUrl}/tech-talent-report` },
};

export default function TechTalentReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
