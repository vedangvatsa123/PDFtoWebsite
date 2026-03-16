"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <p className="text-sm font-medium text-muted-foreground mb-2">Something went wrong</p>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Unexpected error</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        We ran into an issue. Please try again or go back to the homepage.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
