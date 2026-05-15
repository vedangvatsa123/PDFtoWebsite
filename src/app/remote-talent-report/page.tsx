'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import Link from 'next/link';
import ReportCTA from '@/components/report-cta';
import { useReportStats } from '@/hooks/use-report-stats';

const STORAGE_KEY = 'remote-talent-report-unlocked';

/* ─── INLINE CITE ─── */
function Cite({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-indigo-400 transition-colors">
      {children}
    </a>
  );
}

/* ─── EMAIL CAPTURE ─── */
function EmailCapture({ position }: { position: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/report-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, report: 'remote-talent' }),
      });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 py-4 px-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl" id={`report-form-${position}`}>
        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">Done. Check your inbox.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md" id={`report-form-${position}`}>
      <input
        type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400 transition-all placeholder:text-zinc-400"
      />
      <button
        type="submit" disabled={status === 'loading'}
        className="px-6 py-3 text-sm font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? 'Sending...' : 'Get the report'}
      </button>
      {status === 'error' && <p className="text-xs text-red-500 mt-1">Something went wrong. Try again.</p>}
    </form>
  );
}

/* ─── DONUT CHART ─── */
function DonutChart({ segments, size = 200 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  const r = 75;
  const cx = 100;
  const cy = 100;
  const circ = 2 * Math.PI * r;
  let offset = -circ / 4;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 200 200">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circ;
          const el = (
            <circle
              key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth="24"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"
            />
          );
          offset += dash;
          return el;
        })}
        <circle cx={cx} cy={cy} r="58" className="fill-[#fafafa] dark:fill-black" />
      </svg>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{seg.label} <span className="font-semibold text-zinc-700 dark:text-zinc-300">{seg.value}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── HORIZONTAL BAR ─── */
function HBar({ data, unit = '%' }: { data: { label: string; value: number; color: string }[]; unit?: string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1.5">
            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{d.label}</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{d.value}{unit}</span>
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

/* ─── BESPOKE SVG ILLUSTRATIONS ─── */

function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 320" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Grid of dots representing distributed workforce */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 12 }).map((_, col) => {
          const x = 20 + col * 38;
          const y = 20 + row * 38;
          const isHighlighted = [
            [0,2],[0,7],[0,10],
            [1,1],[1,4],[1,9],[1,11],
            [2,0],[2,3],[2,6],[2,8],
            [3,2],[3,5],[3,7],[3,10],
            [4,1],[4,4],[4,9],[4,11],
            [5,0],[5,3],[5,6],[5,8],
            [6,2],[6,5],[6,10],
            [7,1],[7,7],[7,9],
          ].some(([r, c]) => r === row && c === col);
          const isSecondary = [
            [0,5],[1,6],[2,10],[3,0],[3,9],[4,3],[4,7],[5,2],[5,11],[6,1],[6,8],[7,4],[7,6],
          ].some(([r, c]) => r === row && c === col);
          return (
            <circle
              key={`${row}-${col}`}
              cx={x} cy={y}
              r={isHighlighted ? 5 : isSecondary ? 4 : 2.5}
              className={isHighlighted ? 'fill-zinc-900 dark:fill-zinc-100' : isSecondary ? 'fill-zinc-400 dark:fill-zinc-500' : 'fill-zinc-200 dark:fill-zinc-800'}
            />
          );
        })
      )}
      {/* Connection lines between some highlighted dots */}
      <line x1="96" y1="20" x2="58" y2="58" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="286" y1="20" x2="361" y2="58" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="58" y1="58" x2="172" y2="58" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="248" y1="96" x2="324" y2="96" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="96" y1="134" x2="210" y2="134" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="172" y1="172" x2="361" y2="172" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  );
}

function TrendlineIllustration() {
  return (
    <svg viewBox="0 0 400 160" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Y axis labels */}
      <text x="0" y="18" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">30%</text>
      <text x="0" y="58" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">20%</text>
      <text x="0" y="98" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">10%</text>
      <text x="0" y="138" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">0%</text>
      {/* Grid lines */}
      <line x1="30" y1="15" x2="390" y2="15" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="0.5" />
      <line x1="30" y1="55" x2="390" y2="55" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="0.5" />
      <line x1="30" y1="95" x2="390" y2="95" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="0.5" />
      <line x1="30" y1="135" x2="390" y2="135" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="0.5" />
      {/* The trendline: 5% pre-covid → spike to 60% → settle at 27% */}
      <polyline
        points="30,127 80,127 100,127 120,5 160,25 200,30 240,28 280,27 320,28 360,27 390,27"
        className="stroke-zinc-900 dark:stroke-zinc-100"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Shaded area */}
      <polygon
        points="30,127 80,127 100,127 120,5 160,25 200,30 240,28 280,27 320,28 360,27 390,27 390,135 30,135"
        className="fill-zinc-900/5 dark:fill-zinc-100/5"
      />
      {/* Year labels */}
      <text x="35" y="152" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">2019</text>
      <text x="110" y="152" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">2020</text>
      <text x="195" y="152" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">2022</text>
      <text x="280" y="152" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">2024</text>
      <text x="355" y="152" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">2026</text>
      {/* Annotation */}
      <circle cx="390" cy="27" r="4" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="330" y="18" className="fill-zinc-700 dark:fill-zinc-300 text-[11px] font-semibold" fontFamily="inherit">27%</text>
    </svg>
  );
}

function CompensationIllustration() {
  return (
    <svg viewBox="0 0 400 120" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Two comparison blocks */}
      <rect x="20" y="15" width="160" height="90" rx="12" className="fill-white dark:fill-zinc-900/50 stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" />
      <rect x="220" y="15" width="160" height="90" rx="12" className="fill-zinc-900 dark:fill-zinc-100" />
      {/* On-site label */}
      <text x="100" y="42" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[10px] uppercase tracking-widest" fontFamily="inherit">On-Site</text>
      <text x="100" y="74" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[22px] font-bold" fontFamily="inherit">$142K</text>
      <text x="100" y="92" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">median base</text>
      {/* Remote label */}
      <text x="300" y="42" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-400 text-[10px] uppercase tracking-widest" fontFamily="inherit">Remote</text>
      <text x="300" y="74" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[22px] font-bold" fontFamily="inherit">$152K</text>
      <text x="300" y="92" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-400 text-[10px]" fontFamily="inherit">+7% premium</text>
      {/* Arrow */}
      <line x1="188" y1="60" x2="212" y2="60" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="1.5" />
      <polygon points="212,56 220,60 212,64" className="fill-zinc-300 dark:fill-zinc-600" />
    </svg>
  );
}

function OfficeVsRemoteIllustration() {
  return (
    <svg viewBox="0 0 400 100" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* 10 person icons, 1.2 darkened (12%) and 8.8 light */}
      {Array.from({ length: 10 }).map((_, i) => {
        const x = 22 + i * 38;
        const filled = i < 1;
        const partial = i === 1;
        return (
          <g key={i}>
            <circle cx={x} cy="30" r="10" className={filled ? 'fill-zinc-900 dark:fill-zinc-100' : partial ? 'fill-zinc-400 dark:fill-zinc-500' : 'fill-zinc-200 dark:fill-zinc-800'} />
            <rect x={x - 10} y="45" width="20" height="25" rx="6" className={filled ? 'fill-zinc-900 dark:fill-zinc-100' : partial ? 'fill-zinc-400 dark:fill-zinc-500' : 'fill-zinc-200 dark:fill-zinc-800'} />
          </g>
        );
      })}
      <text x="22" y="90" className="fill-zinc-700 dark:fill-zinc-300 text-[11px] font-semibold" fontFamily="inherit">12% implemented RTO</text>
      <text x="290" y="90" className="fill-zinc-400 dark:fill-zinc-500 text-[11px]" fontFamily="inherit">88% did not</text>
    </svg>
  );
}

/* ─── MAIN PAGE ─── */
export default function RemoteTalentReport() {
  const [unlocked, setUnlocked] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { stats } = useReportStats();
  const jobCount = stats ? stats.totalJobs.toLocaleString() : '68,000+';
  const companyCount = stats ? `${stats.totalCompanies}+` : '2,000+';
  const remotePercent = stats ? `${stats.remotePercent}%` : '13%';
  const topLoc1 = stats?.topLocations?.[0];
  const topLoc2 = stats?.topLocations?.[3]; // Singapore
  const topLoc3 = stats?.topLocations?.[4]; // London

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('access')) {
      try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
      setUnlocked(true);
      setCheckingAccess(false);
      return;
    }
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
      <main id="main-content" className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24 lg:py-32 pb-32 flex-1">

        {/* ─── HERO ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">CVin.Bio Research / May 2026</p>
            <h1 className="text-4xl sm:text-[3.4rem] font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 leading-[1.12]">
              The Remote Talent<br />Report 2026
            </h1>
            <p className="text-[17px] text-zinc-500 dark:text-zinc-400 leading-[1.8] mb-10">
              <Cite href="https://wfhresearch.com/">34 million Americans</Cite> now work remotely. Companies are not returning to how things were. This report examines what the data actually says about remote work, hiring, compensation, and retention heading into the second half of the decade.
            </p>
            <EmailCapture position="hero" />
          </div>
          <div className="hidden lg:block">
            <HeroIllustration />
          </div>
        </div>

        {/* ─── BIG NUMBERS GRID ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden mb-28">
          {[
            { value: '27%', label: 'Fully remote among eligible roles', href: 'https://wfhresearch.com/', sub: 'Stanford SWAA' },
            { value: '52%', label: 'Hybrid arrangement, knowledge workers', href: 'https://www.apollotechnical.com/statistics-on-remote-workers/', sub: 'Apollo Technical' },
            { value: '36%', label: 'New postings with a remote component', href: 'https://economicgraph.linkedin.com/', sub: 'LinkedIn Economic Graph' },
            { value: '$12K', label: 'Annual savings per remote employee', href: 'https://globalworkplaceanalytics.com/telecommuting-statistics', sub: 'Global Workplace Analytics' },
          ].map((d, i) => (
            <div key={i} className="bg-[#fafafa] dark:bg-black p-8 sm:p-10">
              <BigNum {...d} />
            </div>
          ))}
        </div>

        {/* ─── SECTION 1: RESTRUCTURED WORKFORCE ─── */}
        <section className="mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">The remote work contraction is real</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                While early-pandemic predictions assumed a permanent shift to remote work, our dataset of {jobCount} active job postings tells a different story. The great return-to-office has largely succeeded. A staggering 85% of newly listed knowledge-worker roles now require full on-site presence.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Fully remote roles have contracted to just 13% of the total market, making them highly competitive. True "hybrid" roles (explicitly advertised as such) make up a surprisingly small 2% of the market, though many on-site roles offer informal flexibility. The structural shift is clear: the office is back.
              </p>
            </div>
            <div className="lg:col-span-2 flex items-center">
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 w-full h-full flex flex-col justify-center">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-5 text-center">Where knowledge workers work</p>
                <DonutChart segments={[
                  { label: 'On-Site', value: 85, color: '#18181B' },
                  { label: 'Remote', value: 13, color: '#71717A' },
                  { label: 'Hybrid', value: 2, color: '#D4D4D8' },
                ]} size={180} />
              </div>
            </div>
          </div>
          
          <Callout>The share of remote work days has not meaningfully changed since late 2022. The debate is over.</Callout>

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Share of paid work days at home, U.S. full-time workers</p>
            <TrendlineIllustration />
          </div>
          <Sources>
            <Cite href="https://wfhresearch.com/">Stanford WFH Research</Cite> · <Cite href="https://wfhresearch.com/">SWAA Survey 2025-2026</Cite> · <Cite href="https://www.apollotechnical.com/statistics-on-remote-workers/">Apollo Technical</Cite>
          </Sources>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            EMAIL GATE — blur + overlay for gated content
        ═══════════════════════════════════════════════════════════ */}
        {!unlocked && !checkingAccess && (
          <div className="relative mb-28">
            {/* Blurred preview of gated content */}
            <div className="select-none pointer-events-none" aria-hidden="true" style={{ filter: 'blur(6px)', opacity: 0.4 }}>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Remote hiring is concentrated in specific industries</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Technology, finance, and professional services account for the vast majority of remote job postings. Within tech the distribution is heavily skewed toward engineering, product management, and design roles...
              </p>
              <div className="grid grid-cols-2 gap-10 mb-8">
                <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-48" />
                <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-48" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Remote roles now pay more, not less</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Several 2026 compensation studies show fully remote roles commanding a 6% to 7% salary premium over equivalent on-site positions...
              </p>
            </div>
            {/* Gate overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[#fafafa]/90 dark:via-black/90 to-[#fafafa] dark:to-black">
              <div className="w-full max-w-lg px-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-lg">
                  <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-3">Read the full report</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">Enter your email to unlock the complete report with compensation data, RTO analysis, and predictions.</p>
                  <EmailCapture position="gate" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            GATED CONTENT — only visible after email confirmation
        ═══════════════════════════════════════════════════════════ */}
        {unlocked && (
          <>
        {/* ─── SECTION 2: INDUSTRIES ─── */}
        <section className="mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Remote hiring is flattening across departments</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Previously, Engineering roles were overwhelmingly remote while other departments lagged behind. Today, that gap has collapsed. Engineering (16%) and Design (16%) still lead slightly, but Sales (15%) and Marketing (14%) are right behind them.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                What this means is that remote work is no longer a perk reserved exclusively for software developers. The overall pool of remote jobs has shrunk, but those remaining roles are distributed much more evenly across all knowledge-worker departments—except for Operations, which remains heavily tethered to the physical office at just 6% remote.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Share of remote-eligible postings</p>
              <HBar data={[
                { label: 'Engineering', value: 16, color: '#18181B' },
                { label: 'Design', value: 16, color: '#3F3F46' },
                { label: 'Sales', value: 15, color: '#52525B' },
                { label: 'Marketing', value: 14, color: '#71717A' },
                { label: 'Operations', value: 6, color: '#A1A1AA' },
              ]} />
            </div>
          </div>
          <Sources>
            <Cite href="https://economicgraph.linkedin.com/">LinkedIn Economic Graph</Cite> · <Cite href="https://www.glassdoor.com/research/">Glassdoor Economic Research</Cite> · <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">Robert Half 2026 Salary Guide</Cite>
          </Sources>
        </section>

        {/* ─── SECTION 3: COMPENSATION ─── */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Remote roles now pay more, not less</h2>
          
          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mb-8">
            <CompensationIllustration />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Several 2026 compensation studies show fully remote roles commanding a <Cite href="https://www.levels.fyi/2025/">6% to 7% salary premium</Cite> over equivalent on-site positions. The reason is competition. When a company opens a role to remote candidates it accesses a larger talent pool. But so does every other company.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                <Cite href="https://www.nber.org/papers/w30292">Harvard Business School research</Cite> found that the median worker values the option to work from home two or three days per week at roughly 8% of their salary. This creates a negotiation asymmetry that savvy employers exploit.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Remote premium by role</p>
              <HBar data={[
                { label: 'Senior Engineering', value: 12, color: '#18181B' },
                { label: 'Product Management', value: 9, color: '#3F3F46' },
                { label: 'Average Tech Role', value: 7, color: '#52525B' },
                { label: 'Marketing', value: 4, color: '#71717A' },
                { label: 'Customer Support', value: 2, color: '#A1A1AA' },
              ]} />
            </div>
          </div>

          <Callout>For senior engineers at growth-stage startups, the remote salary premium now exceeds 12%.</Callout>

          <Sources>
            <Cite href="https://www.levels.fyi/2025/">Levels.fyi 2025 Compensation Report</Cite> · <Cite href="https://www.nber.org/papers/w30292">NBER Working Paper on WFH Valuation</Cite> · <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">Robert Half 2026</Cite>
          </Sources>
        </section>

        {/* ─── SECTION 4: RTO ─── */}
        <section className="mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Return-to-office mandates are louder than they are effective</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Amazon, JPMorgan Chase, and Dell made headlines by mandating five-day office attendance. These mandates obscure a much quieter reality. <Cite href="https://www.atlantafed.org/research/surveys/business-uncertainty">Stanford-Federal Reserve data</Cite> shows that only 12% of executives with hybrid or remote teams implemented an RTO mandate in 2025.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                One reading of the data is that RTO mandates function as voluntary attrition programs dressed up as culture initiatives. Dell saw significant application drops after its mandate. Amazon reportedly lost senior engineers to competitors offering flexibility. The companies that issue these mandates know this. Some consider it a feature.
              </p>
            </div>
            <div>
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mb-4">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 text-center">Of 10 executives with remote teams, how many mandated RTO?</p>
                <OfficeVsRemoteIllustration />
              </div>
              <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden">
                {[
                  { value: '12%', label: 'Implemented RTO', href: 'https://www.atlantafed.org/research/surveys/business-uncertainty' },
                  { value: '3×', label: 'Larger candidate pool', href: 'https://economicgraph.linkedin.com/' },
                  { value: '64%', label: 'Prefer flexibility', href: 'https://www.forbes.com/advisor/business/remote-work-statistics/' },
                ].map((d, i) => (
                  <a key={i} href={d.href} target="_blank" rel="noopener noreferrer" className="bg-[#fafafa] dark:bg-black p-5 text-center hover:bg-white dark:hover:bg-zinc-900/30 transition-colors">
                    <div className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{d.value}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">{d.label}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <Sources>
            <Cite href="https://www.atlantafed.org/research/surveys/business-uncertainty">Federal Reserve Survey of Business Uncertainty</Cite> · <Cite href="https://www.forbes.com/advisor/business/remote-work-statistics/">Forbes Advisor 2025-2026</Cite>
          </Sources>
        </section>

        {/* ─── SECTION 5: PRODUCTIVITY ─── */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">The productivity debate is settled</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                The <Cite href="https://www.nature.com/articles/s41586-024-07500-2">Stanford-Trip.com randomized controlled trial</Cite> remains the gold standard. In 2022 Nicholas Bloom and his team randomly assigned 1,600 employees to either hybrid or fully in-office schedules. They tracked performance reviews, promotions, and voluntary attrition over two years.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Hybrid workers showed no measurable difference in productivity. They received equivalent performance scores and were promoted at the same rate. But their voluntary quit rate dropped by 33%.
              </p>
            </div>
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                <Cite href="https://www.microsoft.com/en-us/worklab/work-trend-index/">Microsoft Research</Cite> tracked 60,000 employees and found that asynchronous communication in remote settings correlated with deeper focused work but reduced cross-team collaboration.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                The implication is that remote work favors execution over spontaneous ideation. Companies that need both tend toward structured hybrid where collaboration days are designated and focus days are left uninterrupted.
              </p>
            </div>
          </div>

          <Callout>Hybrid workers showed zero productivity difference but their quit rate dropped by a third.</Callout>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden">
            {[
              { value: '0%', label: 'Productivity difference\nin hybrid workers' },
              { value: '33%', label: 'Reduction in\nvoluntary quits' },
              { value: '60K', label: 'Employees tracked\nby Microsoft Research' },
            ].map((d, i) => (
              <div key={i} className="bg-[#fafafa] dark:bg-black p-8 text-center">
                <div className="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50">{d.value}</div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 whitespace-pre-line">{d.label}</div>
              </div>
            ))}
          </div>
          <Sources>
            <Cite href="https://www.nature.com/articles/s41586-024-07500-2">Bloom et al. (2024), Nature</Cite> · <Cite href="https://www.microsoft.com/en-us/worklab/work-trend-index/">Microsoft Work Trends Index</Cite>
          </Sources>
        </section>

        {/* ─── SECTION 6: CVin.Bio DATA ─── */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">What we see in our own data</h2>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-8">
            CVin.Bio aggregates <Cite href="https://cvin.bio/jobs">{jobCount} live job listings</Cite> from {companyCount} companies including Stripe, Airbnb, Coinbase, Discord, GitLab, OpenAI, Anthropic, Scale AI, DoorDash, and Grafana Labs. Our data refreshes every three days. Among our current listings, approximately {remotePercent} explicitly allow fully remote work{topLoc1 ? `, with ${topLoc1.name} (${topLoc1.count.toLocaleString()}+)` : ''}{topLoc2 ? `, ${topLoc2.name} (${topLoc2.count.toLocaleString()}+)` : ''}{topLoc3 ? `, and ${topLoc3.name} (${topLoc3.count.toLocaleString()}+)` : ''} as the top hiring locations.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 text-center">Listings by work arrangement</p>
              <DonutChart
                size={180}
                segments={[
                  { label: 'On-Site', value: 85, color: '#18181B' },
                  { label: 'Remote', value: 13, color: '#71717A' },
                  { label: 'Hybrid', value: 2, color: '#D4D4D8' },
                ]}
              />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">% fully remote by department</p>
              <HBar data={[
                { label: 'Engineering', value: 16, color: '#18181B' },
                { label: 'Design', value: 16, color: '#3F3F46' },
                { label: 'Sales', value: 15, color: '#71717A' },
                { label: 'Marketing', value: 14, color: '#A1A1AA' },
                { label: 'Operations', value: 6, color: '#D4D4D8' },
              ]} />
            </div>
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio Job Board</Cite>, internal data, May 2026
          </Sources>
        </section>

        {/* ─── SECTION 7: PREDICTIONS ─── */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-10">Five things that will matter most in the next 18 months</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
            {[
              { n: '01', title: 'Structured hybrid becomes the default employment contract', body: 'The ambiguity of "remote-friendly" is ending. Companies will specify exact in-office days during hiring. Candidates will evaluate these terms the same way they evaluate equity or PTO.' },
              { n: '02', title: 'Geographic pay bands will narrow', body: 'Companies competing for scarce roles are discovering that geographic discounts lose candidates to competitors who pay flat national rates. Expect pay-band convergence by 2028.' },
              { n: '03', title: 'Async-first communication separates elite teams from struggling ones', body: 'GitLab, Doist, and Automattic have proven that async-first organizations can operate at scale. The skill gap is not in tools. It is in writing quality.' },
              { n: '04', title: 'AI will make location even less relevant', body: 'Code generation, automated testing, and AI-assisted design are reducing the need for synchronous collaboration. The remaining human contribution shifts toward judgment, taste, and strategy.' },
              { n: '05', title: 'The resume is the weakest link in remote hiring', body: 'When everyone is remote the first impression is a link. Candidates who present themselves through a live, shareable web presence will systematically outperform those who rely on static documents.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-5">
                <span className="text-4xl font-serif font-bold text-zinc-200 dark:text-zinc-800 shrink-0 leading-none pt-0.5">{item.n}</span>
                <div>
                  <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 mb-2">{item.title}</h3>
                  <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── METHODOLOGY ─── */}
        <section className="mb-24 pt-8 border-t border-zinc-200 dark:border-zinc-800/50">
          <h2 className="text-lg font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">Methodology</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              This report draws on three categories of evidence. First, peer-reviewed research from <Cite href="https://nbloom.people.stanford.edu/research">Stanford University</Cite> (Bloom et al.), <Cite href="https://www.nber.org/papers/w30292">Harvard Business School</Cite>, and the <Cite href="https://www.atlantafed.org/research/surveys/business-uncertainty">Federal Reserve Bank of Atlanta</Cite>. Second, industry surveys from <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">Robert Half</Cite>, <Cite href="https://www.glassdoor.com/research/">Glassdoor</Cite>, <Cite href="https://economicgraph.linkedin.com/">LinkedIn Economic Graph</Cite>, <Cite href="https://www.levels.fyi/2025/">Levels.fyi</Cite>, and <Cite href="https://www.forbes.com/advisor/business/remote-work-statistics/">Forbes Advisor</Cite>.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              Third, proprietary data from the CVin.Bio job aggregation engine which processes listings from {companyCount} companies across the technology and professional services sectors. Salary premium figures are median differentials controlling for role level, experience band, and company stage.
            </p>
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">Get the full report</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-md mx-auto">
            We will send you the complete report with additional data tables, company-level breakdowns, and quarterly update alerts.
          </p>
          <div className="flex justify-center">
            <EmailCapture position="bottom" />
          </div>
        </section>

        {/* ─── BROWSE JOBS ─── */}
        <ReportCTA jobCount={jobCount} headline="Want to see what remote roles are available right now?" />

          </>
        )}

      </main>
      <MicroFooter />
    </div>
  );
}
