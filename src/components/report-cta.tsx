import Link from 'next/link';

interface ReportCTAProps {
  jobCount: string;
  headline?: string;
  subline?: string;
}

export default function ReportCTA({ jobCount, headline, subline }: ReportCTAProps) {
  return (
    <div className="p-10 bg-zinc-900 dark:bg-zinc-100 rounded-2xl text-center">
      {headline && <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-2">{headline}</p>}
      {subline && <p className="text-lg font-serif font-semibold text-white dark:text-zinc-900 mb-5">{subline}</p>}
      {!headline && !subline && <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-5">See which roles are open right now</p>}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Browse {jobCount} jobs on CVin.Bio
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white dark:text-zinc-900 bg-zinc-700 dark:bg-zinc-300 hover:bg-zinc-600 dark:hover:bg-zinc-400 rounded-lg transition-colors"
        >
          Turn your CV into a website
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      </div>
    </div>
  );
}
