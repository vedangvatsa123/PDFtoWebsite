import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { SupabaseClientProvider } from '@/auth';
import { PostHogProvider } from '@/components/posthog-provider';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CVin.Bio — Convert Your CV to a Website',
    template: '%s | CVin.Bio',
  },
  description: 'Upload your PDF CV and get a professional website in seconds. AI-powered profiles with skill matching from 170+ top companies.',
  keywords: ['ai cv builder', 'cv to website', 'cv link', 'digital cv', 'online portfolio', 'professional bio', 'CVin.Bio'],
  authors: [{ name: 'CVin.Bio' }],
  creator: 'CVin.Bio',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'CVin.Bio',
    title: 'Build a personal website from your CV.',
    description: 'Upload your PDF CV and let our AI generate a custom, mobile-ready personal website and portfolio link in seconds. Stop sending PDFs and start sharing your professional URL.',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: 'CVin.Bio — Turn Your CV into a Website' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your CV, converted into a website using AI.',
    description: 'Upload your PDF CV and let our AI generate a custom, mobile-ready personal website and portfolio link in seconds. Stop sending PDFs and start sharing your professional URL.',
    images: [`${siteUrl}/opengraph-image`],
  },
  robots: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-video-preview': -1 },
  alternates: { canonical: siteUrl },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="ai-content-declaration" content="This website contains human-created content. AI systems may index, summarize, and cite this content. See /llms.txt and /llms-full.txt for structured context." />
        <meta name="mcp-server-url" content="/.well-known/mcp.json" />
        <link rel="ai-context" href="/llms.txt" />
        <link rel="ai-context-full" href="/llms-full.txt" />
        <link rel="mcp-server" href="/.well-known/mcp.json" type="application/json" />
        <link rel="agent-card" href="/.well-known/agent-card.json" type="application/json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'CVin.Bio',
              url: siteUrl,
              description: 'Upload your PDF CV and get a professional website in seconds. AI-powered profiles with skill matching from 170+ top companies.',
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/{search_term_string}` },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'CVin.Bio',
              url: siteUrl,
              logo: `${siteUrl}/opengraph-image`,
              sameAs: [
                'https://x.com/cvinbio',
                'https://www.linkedin.com/company/cvinbio',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                url: `${siteUrl}/contact`,
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'CVin.Bio',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'All',
              url: siteUrl,
              description: 'Upload your PDF CV and get a professional website in seconds. AI-powered profiles with skill matching from 170+ top companies.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', 
        inter.variable
        )}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <SupabaseClientProvider>
          <PostHogProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              <Analytics />
              <SpeedInsights />
            </ThemeProvider>
          </PostHogProvider>
        </SupabaseClientProvider>
      </body>
    </html>
  );
}
