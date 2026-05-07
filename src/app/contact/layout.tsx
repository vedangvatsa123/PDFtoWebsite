import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  title: 'Contact Us | CVin.Bio',
  description: 'Get in touch with the CVin.Bio team for feedback, partnerships, support, or feature requests.',
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    title: 'Contact Us | CVin.Bio',
    description: 'Get in touch with the CVin.Bio team.',
    url: `${siteUrl}/contact`,
  },
  twitter: { card: 'summary', title: 'Contact Us | CVin.Bio' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
