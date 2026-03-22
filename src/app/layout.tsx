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
    default: 'Convert your CV to a Website',
    template: '%s | CVinBio',
  },
  description: 'Upload your CV and let AI generate a custom, mobile-ready personal website in seconds.',
  keywords: ['ai cv builder', 'cv to website', 'cv link', 'digital cv', 'online portfolio', 'professional bio', 'CVinBio'],
  authors: [{ name: 'CVinBio' }],
  creator: 'CVinBio',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'CVinBio',
    title: 'Build a personal website from your CV.',
    description: 'Let AI extract your experience and generate a professional portfolio link to share anywhere.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your CV, converted into a website using AI.',
    description: 'Launch your professional online portfolio in seconds.',
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
