'use client';

import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import ReportCTA from '@/components/report-cta';
import { useReportStats } from '@/hooks/use-report-stats';

function Cite({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-indigo-400 transition-colors">
      {children}
    </a>
  );
}

function DonutChart({ segments, size = 200 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  const r = 75; const cx = 100; const cy = 100;
  const circ = 2 * Math.PI * r;
  let offset = -circ / 4;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 200 200">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circ;
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="24" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} className="transition-all duration-700" />;
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

function HBar({ data, unit = '' }: { data: { label: string; value: number; color: string }[]; unit?: string }) {
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

function BigNum({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="text-center">
      <div className="text-5xl sm:text-6xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">{value}</div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">{label}</div>
      {sub && <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-zinc-900 dark:border-zinc-100 pl-6 py-2 my-10">
      <p className="text-lg sm:text-xl font-serif text-zinc-800 dark:text-zinc-200 leading-relaxed italic">{children}</p>
    </blockquote>
  );
}

function Sources({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">{children}</p>
    </div>
  );
}

/* Vertical bar chart */
function VBar({ data, unit = '' }: { data: { label: string; value: number; color: string }[]; unit?: string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end justify-between gap-3 h-48">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">{d.value}{unit}</span>
          <div className="w-full rounded-t-md transition-all duration-700" style={{ height: `${(d.value / max) * 100}%`, backgroundColor: d.color, minHeight: '4px' }} />
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* Bubble chart for skill tags */
function BubbleChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-4">
      {data.map((d, i) => {
        const size = 40 + (d.value / max) * 80;
        return (
          <div key={i} className="flex flex-col items-center justify-center rounded-full transition-all duration-500 hover:scale-110" style={{ width: size, height: size, backgroundColor: d.color + '18', border: `2px solid ${d.color}` }}>
            <span className="text-[10px] font-bold" style={{ color: d.color }}>{d.value}%</span>
            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Lollipop chart */
function LollipopChart({ data, unit = '' }: { data: { label: string; value: number; color: string }[]; unit?: string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 w-20 shrink-0 text-right">{d.label}</span>
          <div className="flex-1 relative h-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-full">
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }} />
            <div className="absolute rounded-full border-2 border-white dark:border-black" style={{ left: `${(d.value / max) * 100}%`, top: '-4px', width: 10, height: 10, backgroundColor: d.color, transform: 'translateX(-5px)' }} />
          </div>
          <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 w-10 shrink-0">{d.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

/* Stacked bars for regional role comparison */
function StackedRegionBars() {
  const regions = [
    { name: 'USA', eng: 35, sales: 13, leadership: 20, product: 8, other: 24 },
    { name: 'India', eng: 35, sales: 14, leadership: 17, product: 3, other: 31 },
    { name: 'Singapore', eng: 33, sales: 13, leadership: 21, product: 4, other: 29 },
    { name: 'UK', eng: 25, sales: 22, leadership: 23, product: 3, other: 27 },
    { name: 'Thailand', eng: 16, sales: 12, leadership: 28, product: 2, other: 42 },
    { name: 'Japan', eng: 12, sales: 38, leadership: 23, product: 3, other: 24 },
    { name: 'Remote', eng: 40, sales: 16, leadership: 13, product: 7, other: 24 },
  ];
  const colors = { eng: '#18181B', product: '#6366f1', sales: '#14b8a6', leadership: '#f59e0b', other: '#E4E4E7' };

  return (
    <div className="space-y-4">
      {regions.map((r, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1.5">
            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{r.name}</span>
          </div>
          <div className="h-5 rounded-full overflow-hidden flex">
            <div style={{ width: `${r.eng}%`, backgroundColor: colors.eng }} className="transition-all duration-700" />
            <div style={{ width: `${r.product}%`, backgroundColor: colors.product }} className="transition-all duration-700" />
            <div style={{ width: `${r.sales}%`, backgroundColor: colors.sales }} className="transition-all duration-700" />
            <div style={{ width: `${r.leadership}%`, backgroundColor: colors.leadership }} className="transition-all duration-700" />
            <div style={{ width: `${r.other}%`, backgroundColor: colors.other }} className="transition-all duration-700" />
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
        {[
          { label: 'Engineering', color: colors.eng },
          { label: 'Product', color: colors.product },
          { label: 'Sales & BD', color: colors.sales },
          { label: 'Leadership', color: colors.leadership },
          { label: 'Other', color: colors.other },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Regional cards */
function RegionCards() {
  const regions = [
    { name: 'USA', roles: '5,861', eng: '35%', top: 'Engineering', hirer: 'OpenAI (512 roles)', note: 'Engineering and product hub' },
    { name: 'India', roles: '717', eng: '35%', top: 'Engineering', hirer: 'Paytm (165 roles)', note: 'Engineering and ops center' },
    { name: 'Singapore', roles: '748', eng: '33%', top: 'Engineering', hirer: 'Airwallex (187 roles)', note: 'Fintech and crypto hub' },
    { name: 'UK', roles: '749', eng: '25%', top: 'Sales & BD (22%)', hirer: 'Wise (141 roles)', note: 'Balanced across functions' },
    { name: 'Japan', roles: '234', eng: '12%', top: 'Sales & BD (38%)', hirer: '', note: 'Sales-first market entry' },
    { name: 'Remote', roles: '2,150', eng: '40%', top: 'Engineering', hirer: 'Vanta (87 roles)', note: 'Most engineering-heavy' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {regions.map((r, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-xl p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{r.name}</span>
            <span className="text-[11px] text-zinc-400 font-medium">{r.roles} roles</span>
          </div>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-300 font-medium mb-1">Top function: {r.top}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 italic">{r.note}</p>
        </div>
      ))}
    </div>
  );
}

/* Animated hero illustration - dense particle field */
function HeroViz() {
  const dots = [
    { x: 20, y: 280, r: 3, d: 18, del: 0 }, { x: 55, y: 260, r: 2, d: 22, del: 1.2 },
    { x: 90, y: 290, r: 4, d: 16, del: 0.5 }, { x: 120, y: 270, r: 2.5, d: 24, del: 2.1 },
    { x: 150, y: 285, r: 5, d: 14, del: 0.3 }, { x: 180, y: 275, r: 3, d: 20, del: 1.8 },
    { x: 210, y: 295, r: 2, d: 26, del: 0.9 }, { x: 240, y: 265, r: 3.5, d: 17, del: 2.5 },
    { x: 270, y: 280, r: 2, d: 21, del: 1.4 }, { x: 35, y: 240, r: 1.5, d: 25, del: 3.2 },
    { x: 70, y: 220, r: 3, d: 19, del: 0.7 }, { x: 105, y: 230, r: 2, d: 23, del: 4 },
    { x: 140, y: 245, r: 4.5, d: 15, del: 1.1 }, { x: 165, y: 235, r: 2, d: 28, del: 3.5 },
    { x: 195, y: 250, r: 3, d: 18, del: 2.3 }, { x: 225, y: 225, r: 1.5, d: 22, del: 0.4 },
    { x: 255, y: 240, r: 2.5, d: 20, del: 3.8 }, { x: 45, y: 200, r: 2, d: 24, del: 1.6 },
    { x: 80, y: 180, r: 3.5, d: 16, del: 2.8 }, { x: 115, y: 195, r: 2, d: 26, del: 0.2 },
    { x: 150, y: 190, r: 6, d: 12, del: 1.5 }, { x: 185, y: 185, r: 2.5, d: 21, del: 3.1 },
    { x: 215, y: 200, r: 1.5, d: 27, del: 4.2 }, { x: 245, y: 195, r: 3, d: 19, del: 0.8 },
    { x: 60, y: 160, r: 2, d: 23, del: 2.6 }, { x: 95, y: 150, r: 3, d: 17, del: 1.3 },
    { x: 130, y: 155, r: 2, d: 25, del: 3.7 }, { x: 170, y: 145, r: 4, d: 14, del: 0.6 },
    { x: 200, y: 160, r: 2, d: 22, del: 2.9 }, { x: 235, y: 150, r: 2.5, d: 20, del: 4.5 },
    { x: 50, y: 120, r: 1.5, d: 28, del: 1.9 }, { x: 85, y: 110, r: 2.5, d: 18, del: 3.4 },
    { x: 125, y: 115, r: 3, d: 16, del: 0.1 }, { x: 160, y: 105, r: 2, d: 24, del: 2.2 },
    { x: 190, y: 120, r: 3.5, d: 15, del: 4.1 }, { x: 220, y: 110, r: 2, d: 21, del: 1.7 },
    { x: 260, y: 115, r: 1.5, d: 26, del: 3 }, { x: 40, y: 80, r: 2, d: 23, del: 2.4 },
    { x: 110, y: 70, r: 3, d: 19, del: 0.9 }, { x: 150, y: 60, r: 2.5, d: 22, del: 3.6 },
    { x: 200, y: 75, r: 2, d: 25, del: 1.2 }, { x: 250, y: 80, r: 3, d: 17, del: 4.3 },
    // extra density
    { x: 10, y: 295, r: 1.5, d: 20, del: 5.1 }, { x: 42, y: 270, r: 2.5, d: 15, del: 5.5 },
    { x: 75, y: 255, r: 1, d: 24, del: 5.9 }, { x: 135, y: 290, r: 3, d: 13, del: 6.2 },
    { x: 165, y: 260, r: 1.5, d: 22, del: 6.6 }, { x: 198, y: 285, r: 2, d: 18, del: 7 },
    { x: 228, y: 245, r: 2.5, d: 16, del: 7.3 }, { x: 280, y: 270, r: 1.5, d: 21, del: 7.7 },
    { x: 15, y: 210, r: 2, d: 19, del: 5.3 }, { x: 58, y: 190, r: 3, d: 14, del: 5.7 },
    { x: 100, y: 175, r: 1.5, d: 23, del: 6.1 }, { x: 145, y: 210, r: 2.5, d: 17, del: 6.4 },
    { x: 175, y: 165, r: 1, d: 26, del: 6.8 }, { x: 205, y: 215, r: 3, d: 15, del: 7.2 },
    { x: 248, y: 175, r: 2, d: 20, del: 7.5 }, { x: 275, y: 210, r: 1.5, d: 24, del: 7.9 },
    { x: 30, y: 145, r: 2.5, d: 18, del: 5.2 }, { x: 72, y: 130, r: 1.5, d: 22, del: 5.6 },
    { x: 108, y: 140, r: 2, d: 16, del: 6 }, { x: 148, y: 125, r: 3.5, d: 13, del: 6.3 },
    { x: 178, y: 135, r: 1, d: 25, del: 6.7 }, { x: 212, y: 145, r: 2, d: 19, del: 7.1 },
    { x: 252, y: 130, r: 2.5, d: 17, del: 7.4 }, { x: 285, y: 145, r: 1, d: 23, del: 7.8 },
    { x: 25, y: 95, r: 1.5, d: 21, del: 5.4 }, { x: 65, y: 85, r: 2, d: 16, del: 5.8 },
    { x: 98, y: 95, r: 1, d: 24, del: 6.2 }, { x: 138, y: 80, r: 2.5, d: 14, del: 6.5 },
    { x: 168, y: 90, r: 1.5, d: 22, del: 6.9 }, { x: 208, y: 85, r: 3, d: 18, del: 7.3 },
    { x: 238, y: 95, r: 1, d: 20, del: 7.6 }, { x: 268, y: 90, r: 2, d: 15, del: 8 },
    { x: 55, y: 50, r: 1.5, d: 23, del: 8.3 }, { x: 120, y: 45, r: 2, d: 17, del: 8.6 },
    { x: 180, y: 50, r: 1, d: 25, del: 8.9 }, { x: 240, y: 55, r: 2.5, d: 14, del: 9.2 },
  ];
  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden">
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-300px) scale(0.5); opacity: 0; }
        }
        .hero-particle { animation: float var(--d) ease-in-out infinite; animation-delay: var(--del); }
      `}</style>
      <svg viewBox="0 0 300 300" className="w-full h-full" aria-hidden="true">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r}
            className="hero-particle fill-zinc-800 dark:fill-zinc-200"
            style={{ '--d': `${d.d}s`, '--del': `${d.del}s`, opacity: 0.3 } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}

function SkillRadarChart() {
  const skills = [
    { name: 'AI / ML', pct: 5443 },
    { name: 'Platform', pct: 4418 },
    { name: 'Support', pct: 4212 },
    { name: 'Growth', pct: 3826 },
    { name: 'Solutions', pct: 3673 },
    { name: 'Operations', pct: 3212 },
    { name: 'Security', pct: 2700 },
    { name: 'Infrastructure', pct: 2447 },
  ];
  const max = 5443;
  const cx = 150, cy = 130, maxR = 100;
  return (
    <svg viewBox="0 0 300 280" fill="none" className="w-full h-auto max-w-xs mx-auto" aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <circle key={i} cx={cx} cy={cy} r={maxR * f} className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="0.5" fill="none" />
      ))}
      {skills.map((s, i) => {
        const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
        const r = (s.pct / max) * maxR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const lx = cx + Math.cos(angle) * (maxR + 18);
        const ly = cy + Math.sin(angle) * (maxR + 18);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={cx + Math.cos(angle) * maxR} y2={cy + Math.sin(angle) * maxR} className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="0.5" />
            <circle cx={x} cy={y} r="4" className="fill-zinc-900 dark:fill-zinc-100" />
            <text x={lx} y={ly + 4} textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[9px]" fontFamily="inherit">{s.name}</text>
          </g>
        );
      })}
      <polygon
        points={skills.map((s, i) => {
          const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
          const r = (s.pct / max) * maxR;
          return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
        }).join(' ')}
        className="fill-zinc-900/10 dark:fill-zinc-100/10 stroke-zinc-900 dark:stroke-zinc-100"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function TechTalentReport() {
  const { stats } = useReportStats();
  const jobCount = stats ? stats.totalJobs.toLocaleString() : '68,606';
  const companyCount = stats ? `${stats.totalCompanies}+` : '2,000+';
  const aiPercent = stats ? `${stats.aiPercent}%` : '7%';
  const aiCount = stats ? stats.aiJobs.toLocaleString() : '1,183';
  const remotePercent = stats ? `${100 - stats.remotePercent}%` : '87%';
  const remoteOnlyPercent = stats ? `${stats.remotePercent}%` : '13%';
  const totalJobs = stats ? stats.totalJobs.toLocaleString() : '68,172';
  const totalCompanies = stats ? `${stats.totalCompanies}` : '2,490';
  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200 flex flex-col">
      <Header />
      <main id="main-content" className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24 lg:py-32 pb-32 flex-1">

        {/* HERO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">CVin.Bio Research / May 2026</p>
            <h1 className="text-4xl sm:text-[3.4rem] font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 leading-[1.12]">
              The Tech Talent<br />Report 2026
            </h1>
            <p className="text-[17px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
              We track <Cite href="https://cvin.bio/jobs">{totalJobs} active job listings</Cite> across {totalCompanies} tech companies in 18 countries. This report breaks down what those listings reveal about roles, skills, seniority, remote work, and regional hiring patterns.
            </p>
          </div>
          <div className="hidden lg:block">
            <HeroViz />
          </div>
        </div>

        {/* BIG NUMBERS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden mb-28">
          {[
            { value: totalJobs, label: 'Active job listings tracked', sub: 'May 2026' },
            { value: totalCompanies, label: 'Companies across 18 countries', sub: 'From Stripe to Grab' },
            { value: remotePercent, label: 'Require on-site presence', sub: `Only ${remoteOnlyPercent} are fully remote` },
            { value: aiPercent, label: 'Require AI or ML skills', sub: `${aiCount} of ${totalJobs} listings` },
          ].map((d, i) => (
            <div key={i} className="bg-[#fafafa] dark:bg-black p-8 sm:p-10">
              <BigNum {...d} />
            </div>
          ))}
        </div>

        {/* SECTION 1: REMOTE VS ON-SITE */}
        <section className="mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">85% of tech roles still require you to show up</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Of {jobCount} listings, only 13% are explicitly remote and 2% are hybrid. The remaining 85% require on-site presence. This aligns with broader industry data. According to <Cite href="https://economicgraph.linkedin.com/">LinkedIn Economic Graph</Cite>, remote job availability in the US declined steadily through 2024 and has hit a stable bottom in 2026.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Remote roles skew heavily toward engineering and sales. Infrastructure and physical operations are notably under-represented in remote work, tethering those teams to office or warehouse locations.
              </p>
            </div>
            <div className="lg:col-span-2 flex items-center">
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 w-full">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-5 text-center">Work arrangement</p>
                <DonutChart segments={[
                  { label: 'On-site', value: 85, color: '#18181B' },
                  { label: 'Remote', value: 13, color: '#6366f1' },
                  { label: 'Hybrid', value: 2, color: '#14b8a6' },
                ]} size={180} />
              </div>
            </div>
          </div>

          <Callout>Engineering is the most remote-friendly function (40% of remote listings). Infrastructure and security are the least (1.3% each).</Callout>

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Breakdown of remote roles by function</p>
            <HBar data={[
              { label: 'Engineering', value: 39.8, color: '#18181B' },
              { label: 'Sales & BD', value: 15.7, color: '#18181B' },
              { label: 'Leadership', value: 13.3, color: '#18181B' },
              { label: 'Product', value: 6.5, color: '#18181B' },
              { label: 'Design', value: 3.9, color: '#18181B' },
              { label: 'Data & Analytics', value: 3.8, color: '#18181B' },
            ]} unit="%" />
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://economicgraph.linkedin.com/">LinkedIn Economic Graph</Cite> for US remote job trends
          </Sources>
        </section>

        {/* SECTION 2: REGIONAL HIRING PROFILES */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Every region has a different hiring personality</h2>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-8">
            The role mix varies dramatically by geography. The US and India are engineering-heavy (35% each). Japan is the outlier where sales and business development (38%) far outnumber engineering (12%). This pattern is consistent with <Cite href="https://japan-dev.com/">Japan Dev</Cite> reporting that foreign tech companies entering Japan prioritize go-to-market roles because they need bilingual sales teams to navigate the local business culture. The UK splits almost evenly between engineering, sales, and leadership.
          </p>

          <RegionCards />

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mt-6">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Role mix comparison by region (% of listings)</p>
            <StackedRegionBars />
          </div>

          <Callout>Japan is 38% sales roles. Remote listings are 40% engineering. Every geography has a completely different talent profile.</Callout>

          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://japan-dev.com/">Japan Dev</Cite> for Japan market context
          </Sources>
        </section>

        {/* SECTION 3: ROLE BREAKDOWN */}
        <section className="mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">1 in 3 listings is for a software engineer</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                29.8% of all listings are for software engineers. Add data, ML, and infrastructure roles and technical positions are 35.8% of all listings. This is broadly consistent with the <Cite href="https://survey.stackoverflow.co/2025/">2025 Stack Overflow Developer Survey</Cite>, which found that JavaScript, Python, and SQL remain the top three languages used by professional developers.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Sales and business roles account for 10.6%. Product management is 4.8%. Dedicated security roles are only 1%, even though 14.7% of listings tag &ldquo;security&rdquo; as a required skill. Companies want security embedded in engineering, not siloed.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Design is 2.1%. Our dataset skews toward engineering-heavy companies. The broader market, including agencies and consulting, likely has different proportions.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Role distribution (% of listings)</p>
              <HBar data={[
                { label: 'Software Engineering', value: 29.8, color: '#18181B' },
                { label: 'Sales & Business', value: 10.6, color: '#18181B' },
                { label: 'Product Management', value: 4.8, color: '#18181B' },
                { label: 'Leadership', value: 3.9, color: '#18181B' },
                { label: 'Data & Analytics', value: 3.5, color: '#18181B' },
                { label: 'Design', value: 2.1, color: '#18181B' },
                { label: 'Security', value: 1.0, color: '#18181B' },
              ]} unit="%" />
            </div>
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://survey.stackoverflow.co/2025/">Stack Overflow Developer Survey 2025</Cite>
          </Sources>
        </section>

        {/* SECTION 4: SENIORITY */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Only 2.7% of roles are for new grads</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                2.7% of listings target interns or new graduates. 24.5% ask for senior-level. 6.7% are Staff or Principal. 54.1% do not specify seniority, which typically means mid-level (3 to 7 years).
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                The entry-level shortage is not unique to our dataset. According to <Cite href="https://economicgraph.linkedin.com/">LinkedIn</Cite>, global hiring remains roughly 20% below pre-pandemic levels, and the slowdown has disproportionately affected junior roles as companies prioritize experienced hires who can deliver immediately.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Our dataset leans toward established companies. Smaller startups not covered here may have more entry-level openings. But the overall signal is clear: the industry is hiring for experience.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-5 text-center">Seniority distribution</p>
              <DonutChart segments={[
                { label: 'Mid-level', value: 54, color: '#A1A1AA' },
                { label: 'Senior', value: 25, color: '#18181B' },
                { label: 'Staff+', value: 7, color: '#6366f1' },
                { label: 'Junior', value: 6, color: '#14b8a6' },
                { label: 'Director+', value: 6, color: '#f59e0b' },
                { label: 'Intern/Grad', value: 3, color: '#f43f5e' },
              ]} size={180} />
            </div>
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://economicgraph.linkedin.com/">LinkedIn Economic Graph</Cite> for global hiring trends · <Cite href="https://www.bls.gov/ooh/computer-and-information-technology/home.htm">BLS</Cite> for CS graduate estimates
          </Sources>
        </section>

        {/* SECTION 5: SKILLS */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">25% of listings require AI or ML skills</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                25.1% of listings tag AI or ML as a required skill. The <Cite href="https://survey.stackoverflow.co/2025/">2025 Stack Overflow survey</Cite> supports this shift. Python, the dominant AI/ML language, saw its largest single-year adoption jump in a decade (up 7 percentage points). Over 80% of developers now use AI tools in their workflow.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                14.7% of listings require security skills, yet only 1% of roles are dedicated security positions. This is consistent with the <Cite href="https://economicgraph.linkedin.com/">LinkedIn</Cite> trend toward skills-based hiring, where companies want capabilities distributed across teams rather than concentrated in specialist groups.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Go appears in 8.9% of listings, Python in 6.4%, SQL in 5.2%. Go&apos;s strength is driven by the infrastructure-heavy companies in our dataset. The Stack Overflow survey still shows JavaScript and Python as the most widely used languages overall.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Skill demand (% of all listings)</p>
              <SkillRadarChart />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mt-10">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Most tagged skills</p>
            <HBar data={[
              { label: 'AI / Machine Learning', value: 21, color: '#18181B' },
              { label: 'Platform', value: 17, color: '#27272A' },
              { label: 'Support', value: 16, color: '#3F3F46' },
              { label: 'Growth', value: 15, color: '#52525B' },
              { label: 'Solutions', value: 14, color: '#71717A' },
              { label: 'Operations', value: 12, color: '#A1A1AA' },
              { label: 'Security', value: 10, color: '#D4D4D8' },
              { label: 'Infrastructure', value: 9, color: '#E4E4E7' },
            ]} unit="%" />
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://survey.stackoverflow.co/2025/">Stack Overflow Developer Survey 2025</Cite> for language adoption trends
          </Sources>
        </section>

        {/* SECTION 5a: LIVE MARKET TAGS */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">The True Demand: Live Tag Extraction</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                We continuously crawl and index the live tags applied directly by recruiters across our database of {jobCount} open roles. This live tracking provides an unfiltered view of precisely which technical skills and domains are seeing the highest actual hiring volume right now.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Unlike surveyed sentiments, these tags represent true capital allocation. Companies don&apos;t tag roles with specific technology stacks unless they have an immediate business need and budget approved for those skills.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Top Tags (Live Crawl Data)</p>
              {stats?.topTags && stats.topTags.length > 0 ? (
                <HBar data={stats.topTags.slice(0, 8).map(tag => ({
                  label: tag.name,
                  value: tag.count,
                  color: '#18181B'
                }))} unit="" />
              ) : (
                <div className="h-40 flex items-center justify-center text-zinc-400 text-sm">Loading live tag data...</div>
              )}
            </div>
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, Live Extracted Tag Data
          </Sources>
        </section>

        {/* SECTION 5b: PROGRAMMING LANGUAGES */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Go is the most tagged language, not Python</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] lg:col-span-3">
              Go appears in 8.9% of tagged listings, ahead of Python (6.4%), SQL (5.2%), and JavaScript (1.9%). This is surprising given that the <Cite href="https://survey.stackoverflow.co/2025/">Stack Overflow survey</Cite> shows JavaScript and Python as the most widely used languages globally. Our dataset&apos;s Go dominance reflects the infrastructure-heavy companies we track, including Cloudflare, Datadog, and CrowdStrike. Java appears in 3.9% of listings, with India-based titles showing the highest density. TypeScript (2.1%) has effectively overtaken JavaScript (1.9%) in tag frequency, confirming the migration from JS to TS is now complete at these companies. Blockchain and Web3 appear in 0.3% of titles, concentrated at Binance (54% of all blockchain roles), OKX, and Coinbase. Singapore has the highest web3 tag density at 0.5%.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Languages by tag frequency</p>
              <HBar data={[
                { label: 'Go', value: 8.9, color: '#18181B' },
                { label: 'Python', value: 6.4, color: '#18181B' },
                { label: 'SQL', value: 5.2, color: '#18181B' },
                { label: 'Java', value: 3.9, color: '#18181B' },
                { label: 'TypeScript', value: 2.1, color: '#18181B' },
                { label: 'JavaScript', value: 1.9, color: '#18181B' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Niche but notable</p>
              <HBar data={[
                { label: 'Rust', value: 0.9, color: '#18181B' },
                { label: 'Kotlin', value: 0.6, color: '#18181B' },
                { label: 'Ruby', value: 0.3, color: '#18181B' },
                { label: 'C#/.NET', value: 0.2, color: '#18181B' },
                { label: 'C++', value: 0.2, color: '#18181B' },
                { label: 'Solidity', value: 0.1, color: '#18181B' },
              ]} unit="%" />
            </div>
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://survey.stackoverflow.co/2025/">Stack Overflow Developer Survey 2025</Cite> for global language popularity
          </Sources>
        </section>

        {/* SECTION 5b: ENGINEERING SPECIALIZATIONS */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Backend engineers are 2x more common than frontend</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] lg:col-span-3">
              Among engineering roles, backend (2.2%) outnumbers frontend (1.0%) by more than 2 to 1. Full-stack is 1.2%. Cloud roles are the most remote-friendly specialization at 29.8% remote. AI Engineer roles are the least remote at 8.6%, likely because AI development requires access to proprietary compute clusters. Coinbase and Grab lead in backend hiring. Binance dominates frontend. OpenAI has the most full-stack and embedded roles.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Engineering specializations (% of titles)</p>
              <HBar data={[
                { label: 'Security', value: 2.8, color: '#18181B' },
                { label: 'Backend', value: 2.2, color: '#18181B' },
                { label: 'Full-Stack', value: 1.2, color: '#18181B' },
                { label: 'Frontend', value: 1.0, color: '#18181B' },
                { label: 'Mobile', value: 1.0, color: '#18181B' },
                { label: 'Cloud', value: 0.8, color: '#18181B' },
                { label: 'DevOps/SRE', value: 0.7, color: '#18181B' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Remote rate by specialization</p>
              <HBar data={[
                { label: 'Cloud', value: 29.8, color: '#18181B' },
                { label: 'Data Eng.', value: 23.8, color: '#18181B' },
                { label: 'Backend', value: 23.0, color: '#18181B' },
                { label: 'ML Engineer', value: 22.0, color: '#18181B' },
                { label: 'DevOps/SRE', value: 18.4, color: '#18181B' },
                { label: 'Full-Stack', value: 17.1, color: '#18181B' },
                { label: 'AI Engineer', value: 8.6, color: '#18181B' },
              ]} unit="%" />
            </div>
          </div>
          <Callout>Cloud roles are 30% remote. AI Engineer roles are only 8.6% remote. The more proprietary the compute, the less remote the work.</Callout>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026. Specializations extracted from job title keyword matching across {jobCount} listings.
          </Sources>
        </section>

        {/* SECTION 5b: SKILL DEPTH - AI PENETRATION */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">AI requirements vary wildly by function</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                40.3% of engineering listings require AI or ML skills. For data roles, it is 31%. For product management, 31.6%. Even 23.1% of sales roles now tag AI as a requirement, likely for selling AI products rather than building them.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Design roles are at 28.6%, which is unexpectedly high. This likely reflects the growing demand for AI-native product design, where designers need to understand LLM capabilities and limitations.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                This level of AI demand aligns with the <Cite href="https://www.linuxfoundation.org/research/open-source-jobs-report-2025">Linux Foundation&apos;s 2025 findings</Cite> that 68% of organizations report being understaffed in AI/ML, and core AI skills are present in fewer than half of organizations. The supply-demand gap is real.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">AI/ML requirement by function</p>
              <BubbleChart data={[
                { label: 'Eng.', value: 40.3, color: '#18181B' },
                { label: 'Product', value: 31.6, color: '#6366f1' },
                { label: 'Data', value: 31.0, color: '#8b5cf6' },
                { label: 'Infra', value: 30.8, color: '#0ea5e9' },
                { label: 'Design', value: 28.6, color: '#f43f5e' },
                { label: 'Sales', value: 23.1, color: '#14b8a6' },
              ]} />
            </div>
          </div>

          <Callout>40% of engineering listings now require AI skills. Even 23% of sales roles tag AI as a requirement. AI literacy is becoming a cross-functional expectation.</Callout>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Most common skill pairs (co-occurrence)</p>
              <HBar data={[
                { label: 'AI + Engineering', value: 13.1, color: '#18181B' },
                { label: 'AI + Platform', value: 13.1, color: '#18181B' },
                { label: 'AI + Growth', value: 11.1, color: '#18181B' },
                { label: 'AI + Solutions', value: 10.8, color: '#18181B' },
                { label: 'Eng. + Platform', value: 10.2, color: '#18181B' },
                { label: 'AI + Infrastructure', value: 10.1, color: '#18181B' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Remote % by seniority</p>
              <HBar data={[
                { label: 'Junior', value: 33.3, color: '#18181B' },
                { label: 'Staff+', value: 23.5, color: '#18181B' },
                { label: 'Senior', value: 16.2, color: '#18181B' },
                { label: 'Director+', value: 14.1, color: '#18181B' },
                { label: 'Mid-level', value: 12.0, color: '#18181B' },
                { label: 'Intern/Grad', value: 8.1, color: '#18181B' },
              ]} unit="%" />
            </div>
          </div>

          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026. Co-occurrence and cross-tabulation analysis across {jobCount} listings.
          </Sources>
        </section>

        {/* SECTION 5c: GENAI EMERGENCE */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">&ldquo;GenAI Engineer&rdquo; is now a distinct job category</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] lg:col-span-3">
              0.35% of listings now include &ldquo;GenAI&rdquo; in the title. Another 0.16% mention &ldquo;LLM&rdquo; explicitly. Combined with &ldquo;AI Engineer&rdquo; (0.57%) and &ldquo;ML Engineer&rdquo; (0.93%), roughly 2% of all open roles fall into an AI-specialist title category. The <Cite href="https://www.linuxfoundation.org/research/open-source-jobs-report-2025">Linux Foundation&apos;s 2025 Tech Talent report</Cite> finds that AI-specific roles have a net hiring effect of +54%, the highest of any category. India has the highest GenAI/LLM title density at 2.9%, nearly 3x the US rate (0.55%). Singapore leads in AI Engineer titles at 1.2%. Japan has zero GenAI or AI Engineer titles. Companies like Datadog, Pinterest, and Airbnb are creating &ldquo;Staff GenAI Engineer&rdquo; roles at the Staff+ level, signaling these are career-track positions.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">AI title categories (% of listings)</p>
              <HBar data={[
                { label: 'ML Engineer', value: 0.93, color: '#18181B' },
                { label: 'AI Engineer', value: 0.57, color: '#18181B' },
                { label: 'GenAI', value: 0.35, color: '#18181B' },
                { label: 'LLM', value: 0.16, color: '#18181B' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">GenAI/LLM title density by region</p>
              <HBar data={[
                { label: 'India', value: 2.91, color: '#18181B' },
                { label: 'Remote', value: 1.0, color: '#18181B' },
                { label: 'USA', value: 0.55, color: '#18181B' },
                { label: 'Singapore', value: 0.53, color: '#18181B' },
                { label: 'UK', value: 0.27, color: '#18181B' },
                { label: 'Japan', value: 0.0, color: '#18181B' },
              ]} unit="%" />
            </div>
          </div>
          <Callout>India has 3x the GenAI title density of the US. This may indicate Indian engineering offices are becoming GenAI development hubs, not just execution centers.</Callout>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://www.linuxfoundation.org/research/open-source-jobs-report-2025">LF 2025 Tech Talent</Cite> for net hiring effects
          </Sources>
        </section>

        {/* SECTION 5d: FRAMEWORKS & CLOUD */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Kubernetes and Snowflake are the most in-demand tools</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] lg:col-span-3">
              Snowflake appears in 3% of tagged listings, ahead of Kubernetes (2.7%) and React (2.2%). This reflects the data infrastructure boom and the fact that nearly every company now runs analytics workloads. LangChain already appears in 0.8% of tags, matching Spark, which has been an industry standard for over a decade. PyTorch (0.7%) has pulled ahead of TensorFlow (0.4%), consistent with the <Cite href="https://survey.stackoverflow.co/2025/">Stack Overflow survey</Cite> findings. On cloud platforms, AWS dominates everywhere except Singapore, where GCP leads at 6.1% vs AWS at 5.1%.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Top frameworks and tools (% of tagged listings)</p>
              <HBar data={[
                { label: 'Snowflake', value: 3.0, color: '#18181B' },
                { label: 'Kubernetes', value: 2.7, color: '#18181B' },
                { label: 'React', value: 2.2, color: '#18181B' },
                { label: 'PostgreSQL', value: 1.4, color: '#18181B' },
                { label: 'Docker', value: 1.2, color: '#18181B' },
                { label: 'Terraform', value: 1.1, color: '#18181B' },
                { label: 'Kafka', value: 1.1, color: '#18181B' },
              ]} unit="%" />
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">AI/ML tooling (% of tagged listings)</p>
                <HBar data={[
                  { label: 'LangChain', value: 0.8, color: '#18181B' },
                  { label: 'Spark', value: 0.8, color: '#18181B' },
                  { label: 'PyTorch', value: 0.7, color: '#18181B' },
                  { label: 'Airflow', value: 0.5, color: '#18181B' },
                  { label: 'dbt', value: 0.5, color: '#18181B' },
                  { label: 'TensorFlow', value: 0.4, color: '#18181B' },
                ]} unit="%" />
              </div>
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Cloud platform leader by region</p>
                <div className="space-y-2 text-[13px]">
                  {[
                    { r: 'Singapore', leader: 'GCP', pct: '6.1%' },
                    { r: 'Remote', leader: 'AWS', pct: '8.6%' },
                    { r: 'UK', leader: 'AWS', pct: '4.9%' },
                    { r: 'India', leader: 'AWS', pct: '3.9%' },
                    { r: 'USA', leader: 'AWS', pct: '3.7%' },
                    { r: 'Japan', leader: 'AWS', pct: '3.4%' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/50">
                      <span className="text-zinc-600 dark:text-zinc-400">{row.r}</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{row.leader} <span className="font-normal text-zinc-400">{row.pct}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://survey.stackoverflow.co/2025/">Stack Overflow Developer Survey 2025</Cite> for framework trends
          </Sources>
        </section>

        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">AI labs and fintech are scaling the fastest</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] lg:col-span-3">
              <Cite href="https://openai.com/careers">OpenAI</Cite> currently has 612 open roles. <Cite href="https://www.anthropic.com/careers">Anthropic</Cite> has 426. Together that is over 1,000 positions at just two AI labs. <Cite href="https://economicgraph.linkedin.com/">LinkedIn</Cite> identifies AI Engineer as one of the fastest-growing job titles in 2025-2026. Fintech is the other high-growth sector: <Cite href="https://www.visa.com/careers/">Visa</Cite> has 758 open roles, Airwallex has 513, <Cite href="https://stripe.com/jobs">Stripe</Cite> has 508. Infrastructure companies like <Cite href="https://www.cloudflare.com/careers/">Cloudflare</Cite> (498 roles) are also expanding, driven by AI compute demands. The <Cite href="https://www.linuxfoundation.org/research/open-source-jobs-report-2025">LF 2025 Tech Talent report</Cite> finds that 2.7x more organizations have expanded than reduced their workforce due to AI, with a net hiring effect of +21%.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Hiring by sector (among tracked companies)</p>
              <HBar data={[
                { label: 'AI / ML Labs', value: 18.2, color: '#18181B' },
                { label: 'Fintech / Payments', value: 16.4, color: '#18181B' },
                { label: 'Infrastructure', value: 14.1, color: '#18181B' },
                { label: 'Delivery / Logistics', value: 12.8, color: '#18181B' },
                { label: 'Security', value: 8.3, color: '#18181B' },
                { label: 'Developer Tools', value: 7.6, color: '#18181B' },
                { label: 'Other', value: 22.6, color: '#18181B' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">AI net hiring effect (LF 2025)</p>
              <HBar data={[
                { label: 'AI-specific roles', value: 54, color: '#18181B' },
                { label: 'Software dev.', value: 24, color: '#18181B' },
                { label: 'Tech management', value: 19, color: '#18181B' },
                { label: 'IT operations', value: 13, color: '#18181B' },
                { label: 'QA/testing', value: 12, color: '#18181B' },
                { label: 'Entry-level tech', value: 6, color: '#18181B' },
              ]} unit="%" />
            </div>
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://economicgraph.linkedin.com/">LinkedIn Economic Graph</Cite> · <Cite href="https://www.linuxfoundation.org/research/open-source-jobs-report-2025">LF 2025 Tech Talent</Cite>
          </Sources>
        </section>

        {/* SECTION 7: REGIONAL SKILL PROFILES */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">What each region actually hires for</h2>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-8">
            The skill profile of job listings changes significantly by geography. The US leads in AI demand (31.8% of listings tag AI). Singapore is infrastructure and platform-heavy (32.5%). India prioritizes mobile (16.3%) and engineering (31.7%). The UK is the most AI-forward outside the US at 34.7%. Japan is the sales and compliance outlier.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">USA top skill tags</p>
              <HBar data={[
                { label: 'AI', value: 31.8, color: '#18181B' },
                { label: 'Engineering', value: 23.5, color: '#3F3F46' },
                { label: 'Security', value: 19.7, color: '#52525B' },
                { label: 'Support', value: 16.1, color: '#71717A' },
                { label: 'Growth', value: 14.9, color: '#A1A1AA' },
                { label: 'Compliance', value: 14.5, color: '#D4D4D8' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">UK top skill tags</p>
              <HBar data={[
                { label: 'AI', value: 34.7, color: '#18181B' },
                { label: 'Platform', value: 25.2, color: '#3F3F46' },
                { label: 'Engineering', value: 25.2, color: '#52525B' },
                { label: 'Growth', value: 24.0, color: '#71717A' },
                { label: 'Support', value: 21.6, color: '#A1A1AA' },
                { label: 'Infrastructure', value: 18.4, color: '#D4D4D8' },
              ]} unit="%" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Singapore top tags</p>
              <HBar data={[
                { label: 'Engineering', value: 33.3, color: '#18181B' },
                { label: 'AI', value: 33.0, color: '#3F3F46' },
                { label: 'Platform', value: 32.5, color: '#52525B' },
                { label: 'Infrastructure', value: 27.8, color: '#71717A' },
                { label: 'Finance', value: 26.5, color: '#A1A1AA' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">India top tags</p>
              <HBar data={[
                { label: 'Engineering', value: 31.7, color: '#18181B' },
                { label: 'Support', value: 20.1, color: '#3F3F46' },
                { label: 'Mobile', value: 16.3, color: '#52525B' },
                { label: 'Operations', value: 14.2, color: '#71717A' },
                { label: 'AI', value: 13.0, color: '#A1A1AA' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Japan top tags</p>
              <HBar data={[
                { label: 'AI', value: 28.2, color: '#18181B' },
                { label: 'Sales', value: 15.4, color: '#3F3F46' },
                { label: 'Solutions', value: 15.0, color: '#52525B' },
                { label: 'Compliance', value: 14.1, color: '#71717A' },
                { label: 'Growth', value: 14.1, color: '#A1A1AA' },
              ]} unit="%" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] lg:col-span-3">
              Singapore stands out for &ldquo;finance&rdquo; (26.5%) and &ldquo;platform&rdquo; (32.5%) tags, consistent with <Cite href="https://www.mas.gov.sg/development/fintech">MAS reporting</Cite> that Singapore now hosts over 700 Web3 firms. India has the highest &ldquo;mobile&rdquo; tag rate at 16.3%, more than double any other region, but the lowest AI tag rate (13%), which may indicate India offices are used more for engineering execution than AI R&D. Japan&apos;s profile reflects go-to-market priorities: &ldquo;Sales&rdquo; and &ldquo;solutions&rdquo; rank high, consistent with <Cite href="https://japan-dev.com/">Japan Dev</Cite> reporting that foreign tech companies entering Japan hire sales teams first.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">AI tag penetration by region</p>
              <HBar data={[
                { label: 'UK', value: 34.7, color: '#18181B' },
                { label: 'Singapore', value: 33.0, color: '#18181B' },
                { label: 'USA', value: 31.8, color: '#18181B' },
                { label: 'Japan', value: 28.2, color: '#18181B' },
                { label: 'India', value: 13.0, color: '#18181B' },
              ]} unit="%" />
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Mobile tag density by region</p>
              <HBar data={[
                { label: 'India', value: 16.3, color: '#18181B' },
                { label: 'Singapore', value: 7.1, color: '#18181B' },
                { label: 'UK', value: 5.8, color: '#18181B' },
                { label: 'USA', value: 4.2, color: '#18181B' },
                { label: 'Japan', value: 3.4, color: '#18181B' },
              ]} unit="%" />
            </div>
          </div>

          <Callout>India has 2.5x more &ldquo;mobile&rdquo; tagged listings than any other region. It also has the lowest AI tag rate at 13%, well below the US (32%) and UK (35%).</Callout>

          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>, May 2026 · <Cite href="https://www.mas.gov.sg/development/fintech">MAS Fintech</Cite> · <Cite href="https://japan-dev.com/">Japan Dev</Cite>
          </Sources>
        </section>

        {/* SECTION 8: KEY PATTERNS */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-10">Eight patterns in the data</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
            {[
              { n: '01', title: 'Remote work is not the default', body: 'Only 14% of listings are remote. This matches LinkedIn data showing US remote listings dropped from 27% (2022) to ~16% (2024). The shift was real but limited.' },
              { n: '02', title: 'Every region hires for different roles', body: 'USA and India are 35% engineering. Japan is 38% sales. The UK splits evenly. India is 2.5x more mobile-heavy than any other region.' },
              { n: '03', title: 'AI skills are table stakes', body: '25% of listings require AI/ML. 40% of engineering listings tag AI. Even 23% of sales roles now require AI literacy.' },
              { n: '04', title: 'Entry-level hiring is thin', body: '2.7% of listings target interns or new grads. LinkedIn confirms this is a market-wide pattern. Companies are prioritizing experienced hires.' },
              { n: '05', title: 'Security is embedded, not siloed', body: '14.7% of listings require security skills, but only 2.8% are dedicated security roles. The skill is being distributed across teams.' },
              { n: '06', title: 'Go is the top tagged language', body: 'Go appears in 8.9% of tagged listings, ahead of Python (6.4%) and SQL (5.2%). Cloudflare, Datadog, and similar firms treat it as the default.' },
              { n: '07', title: 'Backend is the most remote-friendly spec', body: '23% of backend roles are remote vs 8.6% for AI Engineer roles. Cloud roles have the highest remote rate at 30%.' },
              { n: '08', title: 'Blockchain hiring is alive but concentrated', body: 'Web3 and blockchain appear in 0.3% of titles. Binance alone accounts for 54% of all blockchain roles. Singapore has the highest web3 tag density at 0.5%.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-5">
                <span className="text-4xl font-serif font-bold text-zinc-200 dark:text-zinc-800 w-14 shrink-0 leading-none pt-0.5">{item.n}</span>
                <div>
                  <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 mb-2">{item.title}</h3>
                  <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* METHODOLOGY */}
        <section className="mb-24 pt-8 border-t border-zinc-200 dark:border-zinc-800/50">
          <h2 className="text-lg font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">Methodology</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              This report is based on {totalJobs} live job listings tracked by <Cite href="https://cvin.bio/jobs">CVin.Bio</Cite>. Listings come from {totalCompanies} companies across 18 countries. Our dataset skews toward well-funded tech companies, AI labs, and fintech. Where possible, we cross-reference patterns with external sources including the <Cite href="https://survey.stackoverflow.co/2025/">Stack Overflow Developer Survey</Cite>, <Cite href="https://economicgraph.linkedin.com/">LinkedIn Economic Graph</Cite>, and the <Cite href="https://www.linuxfoundation.org/research/open-source-jobs-report-2025">Linux Foundation 2025 Tech Talent Report</Cite>.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              Regional skill profiles are derived from tag-level analysis across all listings. Programming languages and engineering specializations are extracted via keyword matching against job titles. Role categories and seniority levels are inferred from title keywords. All data is from active listings as of April 3, 2026.
            </p>
          </div>
        </section>

        {/* BROWSE JOBS */}
        <ReportCTA jobCount={jobCount} />

      </main>
      <MicroFooter />
    </div>
  );
}
