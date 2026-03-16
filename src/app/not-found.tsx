
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <p className="text-sm font-medium text-muted-foreground mb-2">404</p>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        The profile or page you're looking for doesn't exist or may have been removed.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/editor"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Create Your Profile
        </Link>
      </div>
    </div>
  );
}
