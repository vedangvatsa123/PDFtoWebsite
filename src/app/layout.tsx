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
    default: 'Convert your CV to a Website',
    template: '%s | CVin.Bio',
  },
  description: 'Upload your PDF CV and let our AI generate a custom, mobile-ready personal website and portfolio link in seconds. Stop sending PDFs and start sharing your professional URL.',
  keywords: ['ai cv builder', 'cv to website', 'cv link', 'digital cv', 'online portfolio', 'professional bio', 'CVin.Bio'],
  authors: [{ name: 'CVin.Bio' }],
  creator: 'CVin.Bio',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'CVin.Bio',
    title: 'Build a personal website from your CV.',
    description: 'Upload your PDF CV and let our AI generate a custom, mobile-ready personal website and portfolio link in seconds. Stop sending PDFs and start sharing your professional URL.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your CV, converted into a website using AI.',
    description: 'Upload your PDF CV and let our AI generate a custom, mobile-ready personal website and portfolio link in seconds. Stop sending PDFs and start sharing your professional URL.',
  },
  robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' as const, 'max-video-preview': -1 },
  alternates: { canonical: siteUrl },
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
        <link rel="ai-context" href="/llms.txt" />
        <link rel="ai-context-full" href="/llms-full.txt" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'CVin.Bio',
                url: siteUrl,
                description: 'Upload your PDF CV and let our AI generate a custom, mobile-ready personal website and portfolio link in seconds. Stop sending PDFs and start sharing your professional URL.',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/{search_term_string}` },
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'CVin.Bio',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'All',
                url: siteUrl,
                description: 'Upload your PDF CV and let our AI generate a custom, mobile-ready personal website and portfolio link in seconds. Stop sending PDFs and start sharing your professional URL.',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                },
              }
            ]),
          }}
        />
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', 
        inter.variable
        )}>
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
