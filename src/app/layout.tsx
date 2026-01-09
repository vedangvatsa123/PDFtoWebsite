import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Inter, Montserrat, Playfair_Display, Manrope, Lato } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope'});
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato'});


export const metadata: Metadata = {
  title: 'PDFtoPortfolio',
  description: 'Create a professional web profile from your resume.',
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
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', 
        inter.variable, 
        montserrat.variable, 
        playfair.variable,
        manrope.variable,
        lato.variable
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
