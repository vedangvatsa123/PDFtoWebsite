import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { SupabaseClientProvider } from '@/auth';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CVinBio — Turn Your CV into a Website',
    template: '%s | CVinBio',
  },
  description: 'Upload your PDF CV and instantly get a beautiful, shareable professional profile website. Free, fast, and no coding required.',
  keywords: ['CV to website', 'CV to bio', 'online CV', 'professional profile', 'CV website builder', 'CVinBio'],
  authors: [{ name: 'CVinBio' }],
  creator: 'CVinBio',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'CVinBio',
    title: 'CVinBio — Turn Your CV into a Website',
    description: 'Upload your PDF CV and instantly get a beautiful, shareable professional profile website.',
    images: [{ url: '/images/cvtopdf.png', width: 200, height: 200, alt: 'CVinBio' }],
  },
  twitter: {
    card: 'summary',
    title: 'CVinBio — Turn Your CV into a Website',
    description: 'Upload your PDF CV and instantly get a beautiful, shareable professional profile website.',
    images: ['/images/cvtopdf.png'],
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
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'CVinBio',
              url: siteUrl,
              description: 'Turn your PDF CV into a beautiful, shareable professional profile website.',
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/{slug}` },
                'query-input': 'required name=slug',
              },
            }),
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
          </ThemeProvider>
        </SupabaseClientProvider>
      </body>
    </html>
  );
}
