import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { SupabaseClientProvider } from '@/auth';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CVinBio | The Instant Portfolio Builder',
    template: '%s | CVinBio',
  },
  description: 'Drop in your PDF and let AI generate a stunning, mobile-ready personal website in seconds. Start building your professional brand today.',
  keywords: ['ai cv builder', 'cv to website', 'cv link', 'digital cv', 'online portfolio', 'professional bio', 'CVinBio'],
  authors: [{ name: 'CVinBio' }],
  creator: 'CVinBio',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'CVinBio',
    title: 'Build a striking personal website from your CV.',
    description: 'No coding required. Our AI extracts your experience and launches a beautiful portfolio link you can share anywhere.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your PDF CV, reborn as a sleek website.',
    description: 'Launch your professional brand in seconds with CVin.Bio.',
  },
  robots: { index: true, follow: true },
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'CVinBio',
                url: siteUrl,
                description: 'Turn your PDF CV into a beautiful, shareable professional profile website.',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/{search_term_string}` },
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'CVinBio',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'All',
                url: siteUrl,
                description: 'AI-powered resume parsing and portfolio generation platform for professionals.',
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
        </SupabaseClientProvider>
      </body>
    </html>
  );
}
