import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PDFtoPortfolio — Turn Your Resume into a Website',
    template: '%s | PDFtoPortfolio',
  },
  description: 'Upload your PDF resume and instantly get a beautiful, shareable professional profile website. Free, fast, and no coding required.',
  keywords: ['resume to website', 'PDF to portfolio', 'online resume', 'professional profile', 'resume website builder'],
  authors: [{ name: 'PDFtoPortfolio' }],
  creator: 'PDFtoPortfolio',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'PDFtoPortfolio',
    title: 'PDFtoPortfolio — Turn Your Resume into a Website',
    description: 'Upload your PDF resume and instantly get a beautiful, shareable professional profile website.',
    images: [{ url: '/images/cvtopdf.png', width: 200, height: 200, alt: 'PDFtoPortfolio' }],
  },
  twitter: {
    card: 'summary',
    title: 'PDFtoPortfolio — Turn Your Resume into a Website',
    description: 'Upload your PDF resume and instantly get a beautiful, shareable professional profile website.',
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
              name: 'PDFtoPortfolio',
              url: siteUrl,
              description: 'Turn your PDF resume into a beautiful, shareable professional profile website.',
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
        <FirebaseClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
