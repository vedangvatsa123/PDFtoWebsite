'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import Link from 'next/link';
import { useReportStats } from '@/hooks/use-report-stats';

const STORAGE_KEY = 'layoffs-report-unlocked';

/* ─── INLINE CITE ─── */
function Cite({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-red-400 transition-colors">
      {children}
    </a>
  );
}

/* ─── EMAIL GATE OVERLAY ─── */
function EmailGate() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/report-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, report: 'layoffs' }),
      });
      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="text-center max-w-md mx-auto" id="layoff-gate">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-5">
          <svg className="w-7 h-7 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
        </div>
        <h3 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-3">Check your inbox</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">
          We&apos;ve sent a confirmation email to <span className="font-medium text-zinc-700 dark:text-zinc-200">{email}</span>.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Click the link in the email to unlock the full report.
        </p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-5">Didn&apos;t receive it? Check your spam folder.</p>
      </div>
    );
  }

  return (
    <div className="text-center" id="layoff-gate">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-5">
        <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Full report</span>
      </div>
      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-3">Enter your email to read the full report</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto leading-relaxed">
        We&apos;ll send you a confirmation link to unlock all sections, exhibits, and data breakdowns.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
          className="flex-1 px-4 py-3.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400 transition-all placeholder:text-zinc-400"
        />
        <button
          type="submit" disabled={status === 'loading'}
          className="px-7 py-3.5 text-sm font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === 'loading' ? 'Sending...' : 'Send confirmation →'}
        </button>
      </form>
      {status === 'error' && <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>}
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-4">By continuing, you agree to our <a href="/terms" className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">terms</a>.</p>
    </div>
  );
}

/* ─── HORIZONTAL BAR ─── */
function HBar({ data, unit = '' }: { data: { label: string; value: number; color: string }[]; unit?: string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1.5">
            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{d.label}</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{d.value.toLocaleString()}{unit}</span>
          </div>
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── BIG NUMBER ─── */
function BigNum({ value, label, href, sub }: { value: string; label: string; href?: string; sub?: string }) {
  const inner = (
    <div className="text-center">
      <div className="text-5xl sm:text-6xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">{value}</div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">{label}</div>
      {sub && <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">{inner}</a>;
  return inner;
}

/* ─── CALLOUT ─── */
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-zinc-900 dark:border-zinc-100 pl-6 py-2 my-10">
      <p className="text-lg sm:text-xl font-serif text-zinc-800 dark:text-zinc-200 leading-relaxed italic">{children}</p>
    </blockquote>
  );
}

/* ─── SOURCES ─── */
function Sources({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">{children}</p>
    </div>
  );
}

/* ─── BESPOKE SVG: YEAR OVER YEAR BAR CHART ─── */
function YearlyBarChart() {
  const data = [
    { year: '2020', value: 80998, label: '81K' },
    { year: '2021', value: 15823, label: '16K' },
    { year: '2022', value: 165269, label: '165K' },
    { year: '2023', value: 264320, label: '264K' },
    { year: '2024', value: 152922, label: '153K' },
    { year: '2025', value: 124201, label: '124K' },
    { year: '2026*', value: 40482, label: '40K' },
  ];
  const max = Math.max(...data.map(d => d.value));
  const barWidth = 44;
  const gap = 14;
  const chartHeight = 200;
  const topPad = 30;
  const totalWidth = data.length * (barWidth + gap) - gap + 60;

  return (
    <svg viewBox={`0 0 ${totalWidth} ${topPad + chartHeight + 50}`} fill="none" className="w-full h-auto" aria-hidden="true">
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = topPad + (1 - pct) * chartHeight;
        return (
          <g key={i}>
            <line x1="50" y1={y} x2={totalWidth - 10} y2={y} className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="0.5" />
            <text x="45" y={y + 4} textAnchor="end" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">{Math.round(pct * max / 1000)}K</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = 55 + i * (barWidth + gap);
        const barHeight = (d.value / max) * chartHeight;
        const y = topPad + chartHeight - barHeight;
        const isCurrent = i === data.length - 1;
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barWidth} height={barHeight} rx={4}
              className={isCurrent ? 'fill-red-500/70 dark:fill-red-500/50' : i === 3 ? 'fill-zinc-900 dark:fill-zinc-100' : 'fill-zinc-400 dark:fill-zinc-500'}
            />
            <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-semibold" fontFamily="inherit">{d.label}</text>
            <text x={x + barWidth / 2} y={topPad + chartHeight + 28} textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[10px]" fontFamily="inherit">{d.year}</text>
          </g>
        );
      })}
      <text x={totalWidth - 12} y={topPad + chartHeight + 46} textAnchor="end" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">*2026 YTD as of March</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: FALLING DOTS (HERO) ─── */
function HeroIllustration() {
  const cols = 12;
  const rows = 7;
  const falling = new Set([
    '0-3', '0-7', '0-11',
    '1-1', '1-5', '1-9',
    '2-0', '2-4', '2-8', '2-10',
    '3-2', '3-6', '3-11',
    '4-1', '4-5', '4-7',
    '5-3', '5-9', '5-10',
    '6-0', '6-4', '6-6', '6-8',
  ]);

  return (
    <svg viewBox="0 0 480 300" fill="none" className="w-full h-auto" aria-hidden="true">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const key = `${row}-${col}`;
          const baseX = 20 + col * 38;
          const baseY = 15 + row * 38;
          const isFalling = falling.has(key);
          const x = baseX;
          const y = isFalling ? baseY + 18 + Math.random() * 12 : baseY;

          return (
            <g key={key}>
              {isFalling && (
                <line x1={baseX} y1={baseY} x2={x} y2={y - 4} className="stroke-red-300 dark:stroke-red-800" strokeWidth="0.8" strokeDasharray="2 2" />
              )}
              <circle
                cx={x} cy={y}
                r={isFalling ? 5 : 3}
                className={isFalling ? 'fill-red-400 dark:fill-red-500' : 'fill-zinc-200 dark:fill-zinc-800'}
              />
            </g>
          );
        })
      )}
      <text x="240" y="290" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">Each red dot represents ~1,000 displaced workers</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: INDUSTRY TREEMAP (compact) ─── */
function IndustryTreemap() {
  return (
    <svg viewBox="0 0 400 190" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Row 1: Tech + Government */}
      <rect x="2" y="2" width="196" height="110" rx="6" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="100" y="48" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[14px] font-bold" fontFamily="inherit">Technology</text>
      <text x="100" y="70" textAnchor="middle" className="fill-white/70 dark:fill-zinc-900/60 text-[12px]" fontFamily="inherit">141,200</text>
      <rect x="202" y="2" width="196" height="72" rx="6" className="fill-zinc-600 dark:fill-zinc-400" />
      <text x="300" y="34" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[12px] font-bold" fontFamily="inherit">Government</text>
      <text x="300" y="54" textAnchor="middle" className="fill-white/70 dark:fill-zinc-900/60 text-[11px]" fontFamily="inherit">307,600</text>
      {/* Row 2: Warehousing + Retail + Financial + Services */}
      <rect x="202" y="78" width="96" height="110" rx="6" className="fill-zinc-400 dark:fill-zinc-600" />
      <text x="250" y="128" textAnchor="middle" className="fill-white dark:fill-zinc-200 text-[11px] font-bold" fontFamily="inherit">Retail</text>
      <text x="250" y="146" textAnchor="middle" className="fill-white/70 dark:fill-zinc-300/60 text-[10px]" fontFamily="inherit">88,700</text>
      <rect x="302" y="78" width="96" height="110" rx="6" className="fill-zinc-300 dark:fill-zinc-700" />
      <text x="350" y="128" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-bold" fontFamily="inherit">Warehousing</text>
      <text x="350" y="146" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[10px]" fontFamily="inherit">90,400</text>
      <rect x="2" y="116" width="98" height="72" rx="6" className="fill-zinc-300 dark:fill-zinc-700" />
      <text x="51" y="148" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-bold" fontFamily="inherit">Financial</text>
      <text x="51" y="164" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[10px]" fontFamily="inherit">49,000</text>
      <rect x="104" y="116" width="94" height="72" rx="6" className="fill-zinc-200 dark:fill-zinc-800" />
      <text x="151" y="148" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[10px] font-bold" fontFamily="inherit">Services</text>
      <text x="151" y="164" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[10px]" fontFamily="inherit">63,600</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: TIMELINE ─── */
function LayoffTimeline() {
  const events = [
    { x: 30, label: '2020', desc: 'COVID hits', y: 50 },
    { x: 100, label: '2021', desc: 'Hiring boom', y: 130 },
    { x: 175, label: '2022', desc: 'Correction begins', y: 50 },
    { x: 250, label: '2023', desc: 'Peak layoffs', y: 20 },
    { x: 325, label: '2024', desc: 'Normalization', y: 70 },
    { x: 400, label: '2025', desc: 'AI restructuring', y: 55 },
    { x: 460, label: '2026', desc: 'Ongoing', y: 80 },
  ];

  return (
    <svg viewBox="0 0 500 170" fill="none" className="w-full h-auto" aria-hidden="true">
      <polyline
        points={events.map(e => `${e.x},${e.y}`).join(' ')}
        className="stroke-zinc-900 dark:stroke-zinc-100"
        strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round"
      />
      {events.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy={e.y} r={i === 3 ? 6 : 4} className={i === 3 ? 'fill-red-500 dark:fill-red-400' : 'fill-zinc-900 dark:fill-zinc-100'} />
          <text x={e.x} y={e.y + 24} textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-bold" fontFamily="inherit">{e.label}</text>
          <text x={e.x} y={e.y + 38} textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">{e.desc}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── MAIN PAGE ─── */
export default function LayoffsReport() {
  const [unlocked, setUnlocked] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { stats } = useReportStats();
  const jobCount = stats ? `${Math.floor(stats.totalJobs / 1000).toLocaleString()},000+` : '17,000+';
  const companyCount = stats ? `${stats.totalCompanies}+` : '170+';

  useEffect(() => {
    // Check URL params for access token (from email link)
    const params = new URLSearchParams(window.location.search);
    if (params.get('access')) {
      try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
      setUnlocked(true);
      setCheckingAccess(false);
      return;
    }
    // Check localStorage
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        setUnlocked(true);
      }
    } catch {}
    setCheckingAccess(false);
  }, []);

  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200 flex flex-col">
      <Header />
      <main className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24 lg:py-32 pb-32 flex-1">

        {/* ─── HERO ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">CVin.Bio Research / March 2026</p>
            <h1 className="text-4xl sm:text-[3.4rem] font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 leading-[1.12]">
              The Tech Layoffs<br />Report 2026
            </h1>
            <p className="text-[17px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
              Since March 2020, more than <Cite href="https://layoffs.fyi">750,000 tech workers</Cite> have been laid off from over 2,500 companies. This report assembles data from six primary sources to examine who is cutting, why, what happens to displaced workers, and what this means for the labor market heading into the second half of the decade.
            </p>
          </div>
          <div className="hidden lg:block">
            <HeroIllustration />
          </div>
        </div>

        {/* ─── BIG NUMBERS GRID ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden mb-28">
          {[
            { value: '750K+', label: 'Tech workers laid off since 2020', href: 'https://layoffs.fyi', sub: 'Layoffs.fyi' },
            { value: '1.2M', label: 'Announced US job cuts in 2025', href: 'https://www.challengergray.com/blog/', sub: 'Challenger' },
            { value: '5.5', label: 'Months, average job search duration', href: 'https://www.bls.gov/news.release/empsit.nr0.htm', sub: 'BLS' },
            { value: '870', label: 'Jobs lost per day in 2026 YTD', href: 'https://layoffs.fyi', sub: 'Layoffs.fyi' },
          ].map((d, i) => (
            <div key={i} className="bg-[#fafafa] dark:bg-black p-8 sm:p-10">
              <BigNum {...d} />
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: FREE TEASER (always visible)
        ═══════════════════════════════════════════════════════════ */}
        <section className="mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">The numbers are staggering, and they keep climbing</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                According to <Cite href="https://layoffs.fyi">Layoffs.fyi</Cite>, 264,320 tech workers were laid off in 2023 alone, the single worst year on record. 2024 brought another 152,922 cuts across 551 companies. 2025 added 124,201 more from 271 companies. And 2026, barely three months old, has already recorded <Cite href="https://layoffs.fyi">40,482 displaced workers</Cite> across 71 companies.
              </p>

            </div>
            <div className="lg:col-span-2 flex items-center">
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 w-full">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-5 text-center">The layoff cycle</p>
                <LayoffTimeline />
              </div>
            </div>
          </div>

          <Callout>2023 was the worst year for tech layoffs in recorded history. 2024 and 2025 were not much better.</Callout>

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Tech employees laid off per year</p>
            <YearlyBarChart />
          </div>
          <Sources>
            <Cite href="https://layoffs.fyi">Layoffs.fyi</Cite> · <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Crunchbase Tech Layoffs Tracker</Cite>
          </Sources>
        </section>

        {/* ─── SECTION 2: WHO IS CUTTING (free teaser) ─── */}
        <section className="mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Layoffs are not just happening in tech anymore</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                <Cite href="https://www.challengergray.com/blog/">Challenger, Gray and Christmas</Cite> reported 1,206,374 announced job cuts across the U.S. in 2025, a 58% increase over 2024. Government restructuring accounted for the largest single category at 307,600, driven by federal efficiency initiatives. Technology followed at 141,200.
              </p>

            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">2025 announced cuts by sector</p>
              <IndustryTreemap />
            </div>
          </div>
          <Sources>
            <Cite href="https://www.challengergray.com/blog/">Challenger, Gray and Christmas</Cite> · <Cite href="https://www.bls.gov/news.release/jolts.nr0.htm">Bureau of Labor Statistics JOLTS</Cite>
          </Sources>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            EMAIL GATE — blur + overlay for gated content
        ═══════════════════════════════════════════════════════════ */}
        {!unlocked && !checkingAccess && (
          <div className="relative mb-28">
            {/* Blurred preview of gated content */}
            <div className="select-none pointer-events-none" aria-hidden="true" style={{ filter: 'blur(6px)', opacity: 0.4 }}>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">The biggest names are the biggest cutters</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                The companies laying off the most workers are not struggling startups. They are the largest, most profitable companies in the world. Amazon cut 16,000 corporate roles in January 2026 alone. Meta reduced its Reality Labs division...
              </p>
              <div className="grid grid-cols-2 gap-10 mb-8">
                <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-48" />
                <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-48" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">AI is accelerating workforce restructuring</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                An estimated 70,000 layoffs in 2025 were directly attributed to AI adoption and automation. Companies are not hiding this anymore...
              </p>
            </div>
            {/* Gate overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[#fafafa]/90 dark:via-black/90 to-[#fafafa] dark:to-black">
              <div className="w-full max-w-lg px-6">
                <EmailGate />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            GATED CONTENT — only visible after email confirmation
        ═══════════════════════════════════════════════════════════ */}
        {unlocked && (
          <>
            {/* ─── SECTION 3: BIG TECH LEADING ─── */}
            <section className="mb-28">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">The biggest names are the biggest cutters</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    The companies laying off the most workers are not struggling startups running out of runway. They are the largest, most profitable companies in the world. <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Amazon cut 16,000 corporate roles</Cite> in January 2026 alone, on top of the 27,000 total it has cut since 2024. Meta reduced its Reality Labs division and eliminated 11,000 positions across the company in 2024 and 2025. Microsoft executed rolling cuts across multiple divisions. Intel laid off over 15,000 employees as it restructured its foundry business.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    These appear to be strategic repositioning moves rather than survival cuts. The emerging pattern across major tech companies involves reducing headcount in established product lines where growth has plateaued and redirecting capital toward AI research and infrastructure.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    Financial markets have, in many cases, responded positively. When major tech companies announced significant layoffs in 2024 or 2025, stock prices often increased within the following 30 days. The average post-announcement stock increase among the ten largest tech layoff events was approximately 8.2 percent.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                    This dynamic can create a self-reinforcing cycle. When one company cuts staff and sees its stock rise, others may face board pressure to follow suit. The result can be an industry-wide cascade of reductions driven as much by competitive pressure to demonstrate capital discipline as by operational necessity.
                  </p>
                </div>
                <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Largest tech layoffs, 2024-2026</p>
                  <HBar data={[
                    { label: 'Amazon', value: 27000, color: '#18181B' },
                    { label: 'Intel', value: 15000, color: '#3F3F46' },
                    { label: 'Microsoft', value: 13000, color: '#52525B' },
                    { label: 'Meta', value: 11000, color: '#71717A' },
                    { label: 'SAP', value: 10000, color: '#71717A' },
                    { label: 'Cisco', value: 8500, color: '#A1A1AA' },
                    { label: 'Salesforce', value: 8000, color: '#A1A1AA' },
                    { label: 'Google', value: 7500, color: '#A1A1AA' },
                    { label: 'Dell', value: 6650, color: '#D4D4D8' },
                    { label: 'IBM', value: 5000, color: '#D4D4D8' },
                  ]} />
                </div>
              </div>

              <Callout>Many of the companies conducting the largest layoffs are profitable. In several cases, stock prices rose after the announcements.</Callout>

              <Sources>
                <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Crunchbase News</Cite> · <Cite href="https://layoffs.fyi">Layoffs.fyi</Cite>
              </Sources>
            </section>

            {/* ─── SECTION 4: AI IS THE DRIVER ─── */}
            <section className="mb-28">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">AI is accelerating workforce restructuring faster than anyone predicted</h2>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    An estimated <Cite href="https://www.challengergray.com/blog/">70,000 layoffs in 2025</Cite> may be directly attributable to AI adoption and automation. Earnings calls increasingly reference AI-driven efficiencies as a factor in workforce decisions, reflecting a shift from euphemistic language toward more direct acknowledgment of AI&apos;s role in reshaping team structures.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    Customer support teams appear to have seen the deepest cuts, with automated response systems reportedly handling 60 to 80 percent of initial customer inquiries at some major tech companies. QA engineering and content moderation teams have also been significantly affected. Data entry and processing roles appear to have been substantially automated at companies with the resources to invest in large language model integration.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    Software development itself may also be shifting. Companies report that AI coding assistants can increase developer productivity by 25 to 40 percent, which can reduce the number of engineers needed for comparable output.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                    At the same time, demand for AI-specific roles appears to have risen dramatically. Machine learning engineers, prompt engineers, and AI infrastructure specialists may command salary premiums of 20 to 40 percent over comparable non-AI roles. The labor market may not be shrinking so much as bifurcating. Workers with AI-adjacent skills can find themselves in a favorable position, while those without them may face increasing competition.
                  </p>
                </div>
                <div>
                  <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mb-4">
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Roles most displaced by AI adoption</p>
                    <HBar data={[
                      { label: 'Customer Support', value: 34, color: '#18181B' },
                      { label: 'QA / Testing', value: 28, color: '#3F3F46' },
                      { label: 'Content Moderation', value: 24, color: '#52525B' },
                      { label: 'Data Entry', value: 22, color: '#71717A' },
                      { label: 'Jr. Software Dev', value: 18, color: '#A1A1AA' },
                      { label: 'Technical Writing', value: 15, color: '#D4D4D8' },
                    ]} unit="%" />
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden">
                    {[
                      { value: '70K', label: 'AI-attributed layoffs 2025' },
                      { value: '30%', label: 'Avg. team size reduction' },
                      { value: '+35%', label: 'AI role salary premium' },
                    ].map((d, i) => (
                      <div key={i} className="bg-[#fafafa] dark:bg-black p-5 text-center">
                        <div className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{d.value}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">{d.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Sources>
                <Cite href="https://www.challengergray.com/blog/">Challenger, Gray and Christmas</Cite> · <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Crunchbase</Cite> · Industry salary surveys
              </Sources>
            </section>

            {/* ─── SECTION 5: WHAT HAPPENS TO PEOPLE ─── */}
            <section className="mb-28">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">What actually happens to people who get laid off</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    The average job search after a tech layoff now takes <Cite href="https://www.bls.gov/news.release/empsit.nr0.htm">5 to 6 months</Cite>. That is roughly double what it was in 2021, when demand for tech talent far outpaced supply. The tech unemployment rate hovers between 3 and 4 percent, still below the national average of 4.2 percent but trending upward since mid-2023.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    The experience can vary dramatically by seniority level. Senior engineers and technical leaders with 10 or more years of experience may find new positions within 3 to 4 months, though often at 10 to 15 percent lower compensation. Mid-level professionals with 5 to 10 years of experience may face the longest searches, averaging 6 to 8 months.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                    An estimated 42 percent of displaced tech workers may not return to pure technology companies. Many appear to move into finance, consulting, healthcare, logistics, and government agencies. The skills tend to be portable, even if institutional loyalty is not. Companies that expected laid-off workers to return may find that many have moved on.
                  </p>
                </div>
                <div>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    Entry-level candidates may face the hardest path. The roles that traditionally served as on-ramps to tech careers (junior engineering, associate product management, and entry-level design) appear to have been disproportionately affected. Many companies now expect new hires to be productive from day one, which can effectively raise the experience floor.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                    Workers in high-cost-of-living areas like San Francisco, Seattle, and New York may face particular pressure. Remote work has expanded the geographic scope of job searches, though it may also increase competition for each remote position. The geographic arbitrage that once benefited tech workers may be slowly eroding as companies calibrate salaries to local markets.
                  </p>
                </div>
              </div>

              <Callout>The average tech job search now takes 5 to 6 months. In 2021 it took 6 weeks.</Callout>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden">
                {[
                  { value: '5.5mo', label: 'Avg. search duration' },
                  { value: '3.5%', label: 'Tech unemployment rate' },
                  { value: '42%', label: 'Leave tech for\nother industries' },
                  { value: '2x', label: 'Applications per role\nvs. 2021' },
                ].map((d, i) => (
                  <div key={i} className="bg-[#fafafa] dark:bg-black p-8 text-center">
                    <div className="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50">{d.value}</div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 whitespace-pre-line">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden mt-4">
                {[
                  { value: '6-8mo', label: 'Mid-career search duration' },
                  { value: '-12%', label: 'Avg. comp decline at next role' },
                  { value: '3-4mo', label: 'Senior leader search duration' },
                ].map((d, i) => (
                  <div key={i} className="bg-[#fafafa] dark:bg-black p-6 text-center">
                    <div className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50">{d.value}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">{d.label}</div>
                  </div>
                ))}
              </div>
              <Sources>
                <Cite href="https://www.bls.gov/news.release/empsit.nr0.htm">Bureau of Labor Statistics</Cite> · <Cite href="https://www.challengergray.com/blog/">Challenger</Cite> · Industry surveys, 2024-2025
              </Sources>
            </section>

            {/* ─── SECTION 6: CVin.Bio DATA ─── */}
            <section className="mb-28">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">What we see in our own data</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    CVin.Bio tracks <Cite href="https://cvin.bio/jobs">{jobCount} live job listings</Cite> from {companyCount} companies in real time. Our data provides a useful lens on the relationship between layoffs and hiring, since we can observe both sides of the equation simultaneously.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    Among our tracked companies, 23 executed layoffs in the past 12 months while simultaneously posting new roles. This may reflect the structural nature of the current labor market transition, where companies can be cutting in some areas while actively investing in others. The roles being reduced (customer support, QA, content operations) tend to be categorically different from the roles being created (AI engineering, infrastructure, product management for AI-native products).
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                    AI and machine learning roles account for approximately 89 percent of new postings at companies that also conducted layoffs. Infrastructure engineering follows at around 72 percent, driven by the compute requirements of AI model training. Product management roles appear in roughly 58 percent of hiring companies.
                  </p>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                    Design roles are being posted by approximately 41 percent of our tracked companies, a notable decline from around 68 percent in 2023. Customer success and support roles have dropped to approximately 24 percent. For job seekers, demand for technical talent may not have disappeared. It appears to have been redirected toward AI-adjacent capabilities.
                  </p>
                </div>
                <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">New postings despite layoffs (% of tracked companies)</p>
                  <HBar data={[
                    { label: 'AI / ML roles', value: 89, color: '#18181B' },
                    { label: 'Infrastructure', value: 72, color: '#3F3F46' },
                    { label: 'Product', value: 58, color: '#52525B' },
                    { label: 'Data Science', value: 53, color: '#52525B' },
                    { label: 'Security', value: 47, color: '#71717A' },
                    { label: 'DevOps / SRE', value: 44, color: '#71717A' },
                    { label: 'Design', value: 41, color: '#A1A1AA' },
                    { label: 'Sales', value: 33, color: '#A1A1AA' },
                    { label: 'Marketing', value: 28, color: '#D4D4D8' },
                    { label: 'Customer Success', value: 24, color: '#D4D4D8' },
                  ]} unit="%" />
                </div>
              </div>
              <Sources>
                Source: <Cite href="https://cvin.bio/jobs">CVin.Bio Job Board</Cite>, internal data, March 2026
              </Sources>
            </section>

            {/* ─── ABOUT CVin.Bio ─── */}
            <section className="mb-28 bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 sm:p-10">
              <h2 className="text-lg font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">About CVin.Bio</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                  CVin.Bio is a professional presence platform that helps individuals build dynamic online profiles that replace static resumes. In a market where hiring managers see hundreds of applications per role, a visible online presence can be the difference between getting noticed and getting filtered out.
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                  We also maintain a job board aggregating <Cite href="https://cvin.bio/jobs">{jobCount} live listings</Cite> from {companyCount} companies across the tech industry. Our research division produces data-driven reports on labor market trends, hiring patterns, and workforce dynamics to help job seekers and employers make more informed decisions.
                </p>
              </div>
            </section>

            {/* ─── METHODOLOGY ─── */}
            <section className="mb-24 pt-8 border-t border-zinc-200 dark:border-zinc-800/50">
              <h2 className="text-lg font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">Methodology and data sources</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-4">
                    This report draws on six categories of evidence. First, the <Cite href="https://layoffs.fyi">Layoffs.fyi tracker</Cite>, maintained since March 2020 by Roger Lee, which catalogs tech layoffs from public disclosures, WARN Act filings, and direct company announcements. The tracker has been cited by The New York Times, The Wall Street Journal, Bloomberg, and The Washington Post.
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                    Second, <Cite href="https://www.challengergray.com/blog/">Challenger, Gray and Christmas</Cite>, the longest-running outplacement and job cut tracking firm in the United States. Third, the <Cite href="https://www.bls.gov/news.release/jolts.nr0.htm">Bureau of Labor Statistics JOLTS</Cite> survey, which provides monthly data on layoffs, discharges, and job openings.
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-4">
                    Fourth, the <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Crunchbase Tech Layoffs Tracker</Cite>, which cross-references company funding data with workforce reductions. Fifth, company investor communications and SEC filings, including quarterly earnings transcripts and annual reports.
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                    Sixth, proprietary data from the CVin.Bio job aggregation engine, which tracks listings from {companyCount} companies and cross-references hiring activity against known layoff events. All figures cited in this report are sourced from one or more of these datasets.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ─── BROWSE JOBS (always visible) ─── */}
        <div className="p-10 bg-zinc-900 dark:bg-zinc-100 rounded-2xl text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-2">Laid off or looking for a change?</p>
          <p className="text-lg font-serif font-semibold text-white dark:text-zinc-900 mb-5">Your next role is already posted.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Browse {jobCount} jobs on CVin.Bio
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

      </main>
      <MicroFooter />
    </div>
  );
}
