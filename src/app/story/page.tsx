import type { Metadata } from 'next';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import Link from 'next/link';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'CVin.Bio is the talent infrastructure for the agentic economy. Job board, candidate sourcing, and AI-native professional profiles.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${siteUrl}/story` },
  openGraph: {
    title: 'CVin.Bio',
    description: 'The talent infrastructure for the agentic economy. Job board, candidate sourcing, and AI-native professional profiles.',
    url: `${siteUrl}/story`,
    siteName: 'CVin.Bio',
    type: 'article',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: 'CVin.Bio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CVin.Bio',
    description: 'The talent infrastructure for the agentic economy.',
    images: [`${siteUrl}/opengraph-image`],
    creator: '@cvinbio',
  },
};

/* ─── INLINE CITE ─── */
function Cite({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 hover:text-zinc-500 dark:hover:text-zinc-400 underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-500 transition-colors">
      {children}
    </a>
  );
}

/* ─── BIG NUMBER ─── */
function BigNum({ value, label, href, sub }: { value: string; label: string; href?: string; sub?: string }) {
  const inner = (
    <div className="text-center">
      <div className="text-5xl sm:text-6xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">{value}</div>
      <div className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed break-words">{label}</div>
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

/* ─── BESPOKE SVG: MARKET GROWTH ─── */
function MarketGrowthChart() {
  const data = [
    { year: '2023', value: 3.2, label: '$3.2B' },
    { year: '2024', value: 4.4, label: '$4.4B' },
    { year: '2025', value: 7.6, label: '$7.6B' },
    { year: '2026', value: 11.8, label: '$11.8B' },
    { year: '2027*', value: 16.5, label: '$16.5B' },
    { year: '2028*', value: 23.1, label: '$23.1B' },
  ];
  const max = 25;
  const barW = 48, gap = 16, chartH = 180, top = 30;
  const totalW = data.length * (barW + gap) - gap + 60;
  return (
    <svg viewBox={`0 0 ${totalW} ${top + chartH + 50}`} fill="none" className="w-full h-auto" aria-hidden="true">
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = top + (1 - pct) * chartH;
        return (<g key={i}><line x1="45" y1={y} x2={totalW - 10} y2={y} className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="0.5" /><text x="40" y={y + 4} textAnchor="end" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">${Math.round(pct * max)}B</text></g>);
      })}
      {data.map((d, i) => {
        const x = 50 + i * (barW + gap);
        const bH = (d.value / max) * chartH;
        const y = top + chartH - bH;
        return (<g key={i}><rect x={x} y={y} width={barW} height={bH} rx={4} className={i >= 4 ? 'fill-zinc-300 dark:fill-zinc-700' : 'fill-zinc-900 dark:fill-zinc-100'} /><text x={x + barW / 2} y={y - 8} textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-semibold" fontFamily="inherit">{d.label}</text><text x={x + barW / 2} y={top + chartH + 28} textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[10px]" fontFamily="inherit">{d.year}</text></g>);
      })}
      <text x={totalW - 12} y={top + chartH + 46} textAnchor="end" className="fill-zinc-400 dark:fill-zinc-500 text-[7px]" fontFamily="inherit">*Projected. Sources: Research Nester, Mordor Intelligence</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: TAM/SAM/SOM ─── */
function MarketSizeDiagram() {
  return (
    <svg viewBox="0 0 400 280" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* TAM outer */}
      <circle cx="200" cy="150" r="125" className="fill-zinc-100 dark:fill-zinc-800/40" />
      <text x="200" y="50" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[11px] font-bold" fontFamily="inherit">TAM</text>
      <text x="200" y="66" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">$640B global recruitment</text>
      {/* SAM middle */}
      <circle cx="200" cy="165" r="80" className="fill-zinc-300 dark:fill-zinc-700/60" />
      <text x="200" y="112" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-300 text-[11px] font-bold" fontFamily="inherit">SAM</text>
      <text x="200" y="128" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[9px]" fontFamily="inherit">$17B online recruitment tech</text>
      {/* SOM inner */}
      <circle cx="200" cy="185" r="40" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="200" y="180" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[11px] font-bold" fontFamily="inherit">SOM</text>
      <text x="200" y="196" textAnchor="middle" className="fill-white/70 dark:fill-zinc-900/60 text-[9px]" fontFamily="inherit">AI-native niche</text>
      {/* Sources */}
      <text x="200" y="276" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">Staffing Industry Analysts, Tracxn, EIN Presswire</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: HIRING COST COMPARISON ─── */
function CostComparison() {
  return (
    <svg viewBox="0 0 420 140" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Recruiter agency */}
      <rect x="15" y="15" width="180" height="110" rx="12" className="fill-white dark:fill-zinc-900/50 stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" />
      <text x="105" y="42" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[10px] uppercase tracking-widest" fontFamily="inherit">Recruiter Agency</text>
      <text x="105" y="78" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[24px] font-bold" fontFamily="inherit">$40-60K</text>
      <text x="105" y="100" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[10px]" fontFamily="inherit">20-30% of $200K salary</text>
      <text x="105" y="115" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">89+ days avg. time-to-fill</text>
      {/* Arrow */}
      <line x1="202" y1="70" x2="218" y2="70" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="1.5" />
      <polygon points="218,66 226,70 218,74" className="fill-zinc-300 dark:fill-zinc-600" />
      {/* CVin.Bio */}
      <rect x="230" y="15" width="180" height="110" rx="12" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="320" y="42" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-400 text-[10px] uppercase tracking-widest" fontFamily="inherit">CVin.Bio</text>
      <text x="320" y="78" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[24px] font-bold" fontFamily="inherit">Fraction</text>
      <text x="320" y="100" textAnchor="middle" className="fill-white/70 dark:fill-zinc-900/60 text-[10px]" fontFamily="inherit">Structured discovery</text>
      <text x="320" y="115" textAnchor="middle" className="fill-white/70 dark:fill-zinc-900/60 text-[9px]" fontFamily="inherit">Instant skill-matched results</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: COMPETITIVE LANDSCAPE ─── */
function CompetitiveLandscape() {
  const incumbents = [
    { name: 'LinkedIn', x: 65, y: 45, r: 30, rev: '$17.1B', color: 'fill-zinc-200 dark:fill-zinc-800' },
    { name: 'Indeed', x: 155, y: 58, r: 24, rev: '', color: 'fill-zinc-200 dark:fill-zinc-800' },
    { name: 'ZipRecruiter', x: 260, y: 48, r: 16, rev: '$449M', color: 'fill-zinc-200 dark:fill-zinc-800' },
    { name: 'Wellfound', x: 55, y: 120, r: 12, rev: '', color: 'fill-zinc-200 dark:fill-zinc-800' },
    { name: 'Otta', x: 125, y: 128, r: 10, rev: '', color: 'fill-zinc-200 dark:fill-zinc-800' },
    { name: 'Hired', x: 190, y: 125, r: 10, rev: '', color: 'fill-zinc-200 dark:fill-zinc-800' },
  ];
  const aiPlayers = [
    { name: 'Juicebox AI', x: 310, y: 75, r: 20, rev: '$850M val', color: 'fill-amber-200 dark:fill-amber-900/60' },
    { name: 'Eightfold AI', x: 350, y: 42, r: 18, rev: '', color: 'fill-amber-100 dark:fill-amber-900/40' },
    { name: 'SeekOut', x: 405, y: 68, r: 14, rev: '', color: 'fill-amber-100 dark:fill-amber-900/40' },
    { name: 'Moonhub', x: 270, y: 120, r: 12, rev: '', color: 'fill-amber-100 dark:fill-amber-900/40' },
    { name: 'hireEZ', x: 345, y: 115, r: 12, rev: '', color: 'fill-amber-100 dark:fill-amber-900/40' },
  ];
  return (
    <svg viewBox="0 0 520 280" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Axis labels */}
      <text x="260" y="270" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">General purpose ← → Domain-specific / AI-native</text>
      <text x="12" y="140" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit" transform="rotate(-90 12 140)">Scale</text>
      {/* Grid */}
      <line x1="30" y1="250" x2="500" y2="250" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="0.5" />
      <line x1="30" y1="25" x2="30" y2="250" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="0.5" />
      {/* Vertical divider */}
      <line x1="235" y1="25" x2="235" y2="250" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="0.5" strokeDasharray="4 3" />
      <text x="130" y="245" textAnchor="middle" className="fill-zinc-300 dark:fill-zinc-700 text-[8px] font-semibold" fontFamily="inherit">Job boards / marketplaces</text>
      <text x="370" y="245" textAnchor="middle" className="fill-amber-400/70 dark:fill-amber-600/50 text-[8px] font-semibold" fontFamily="inherit">AI sourcing tools</text>
      {/* Incumbents */}
      {incumbents.map((p, i) => (
        <g key={`inc-${i}`}>
          <circle cx={p.x} cy={p.y} r={p.r} className={p.color} />
          <text x={p.x} y={p.y + 3} textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[8px] font-bold" fontFamily="inherit">{p.name}</text>
          {p.rev && <text x={p.x} y={p.y + 13} textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[7px]" fontFamily="inherit">{p.rev}</text>}
        </g>
      ))}
      {/* AI players */}
      {aiPlayers.map((p, i) => (
        <g key={`ai-${i}`}>
          <circle cx={p.x} cy={p.y} r={p.r} className={p.color} />
          <text x={p.x} y={p.y + 3} textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[7px] font-bold" fontFamily="inherit">{p.name}</text>
          {p.rev && <text x={p.x} y={p.y + 13} textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[6px]" fontFamily="inherit">{p.rev}</text>}
        </g>
      ))}
      {/* CVin.Bio - positioned in the unique gap: structured + agent-queryable */}
      <rect x="380" y="155" width="120" height="80" rx="8" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth="1" strokeDasharray="4 3" fill="none" />
      <text x="440" y="152" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px] font-semibold" fontFamily="inherit">Agent-queryable infrastructure</text>
      <circle cx="440" cy="195" r="18" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="440" y="193" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[7px] font-bold" fontFamily="inherit">CVin.Bio</text>
      <text x="440" y="203" textAnchor="middle" className="fill-white/60 dark:fill-zinc-900/50 text-[6px]" fontFamily="inherit">MCP + structured</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: PLATFORM STACK ─── */
function PlatformStack() {
  return (
    <svg viewBox="0 0 520 200" fill="none" className="w-full h-auto" aria-hidden="true">
      <rect x="30" y="145" width="460" height="48" rx="8" className="fill-zinc-200 dark:fill-zinc-800" />
      <text x="260" y="166" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[11px] font-bold" fontFamily="inherit">Multi-source job aggregation</text>
      <text x="260" y="182" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">17,000+ listings from 170+ companies</text>
      <rect x="60" y="90" width="400" height="48" rx="8" className="fill-zinc-400 dark:fill-zinc-600" />
      <text x="260" y="111" textAnchor="middle" className="fill-white dark:fill-zinc-200 text-[11px] font-bold" fontFamily="inherit">Structured candidate profiles</text>
      <text x="260" y="127" textAnchor="middle" className="fill-white/70 dark:fill-zinc-300/60 text-[9px]" fontFamily="inherit">Schema.org, JSON-LD, skill extraction</text>
      <rect x="90" y="35" width="340" height="48" rx="8" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="260" y="56" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[11px] font-bold" fontFamily="inherit">AI-native reverse discovery</text>
      <text x="260" y="72" textAnchor="middle" className="fill-white/60 dark:fill-zinc-900/50 text-[9px]" fontFamily="inherit">MCP server, llms.txt, 100+ AI crawlers</text>
      <line x1="260" y1="83" x2="260" y2="90" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="260" y1="138" x2="260" y2="145" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  );
}


export default function StoryPage() {
  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200 flex flex-col">
      <Header />
      <main id="main-content" className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24 lg:py-32 pb-32 flex-1">

        {/* ─── HERO ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">CVin.Bio / April 2026</p>
            <h1 className="text-4xl sm:text-[3.4rem] font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 leading-[1.12]">
              Talent infrastructure<br />for the agentic era
            </h1>
            <p className="text-[17px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
              CVin.Bio turns any CV into a live website. Every profile is structured so that both humans and AI systems can read it. Candidates get a free professional URL and skill-matched jobs from 170+ companies. Employers get a searchable talent database filtered by verified skills, not keywords. <Cite href="https://www.gartner.com/en/newsroom/press-releases/2024-10-21-gartner-identifies-the-top-10-strategic-technology-trends-for-2025">Gartner projects</Cite> 40% of enterprise apps will embed AI agents by EOY 2026. The hiring infrastructure needs to be ready for that.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-5 text-center">Autonomous AI agent market growth</p>
              <MarketGrowthChart />
            </div>
          </div>
        </div>

        {/* ─── BIG NUMBERS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden mb-28">
          {[
            { value: '$11.8B', label: 'Autonomous agent market, 2026 projected', href: 'https://www.researchnester.com/reports/autonomous-ai-agents-market/6660', sub: 'Research Nester' },
            { value: '143%', label: 'YoY growth in AI engineer postings', href: 'https://www.kore1.com/', sub: 'Kore1' },
            { value: '89+', label: 'Avg days to fill a specialist tech role', href: 'https://www.roberthalf.com/us/en/insights/salary-guide', sub: 'Robert Half' },
            { value: '$200K+', label: 'Median total comp, senior eng.', href: 'https://www.levels.fyi/2025/', sub: 'Levels.fyi' },
          ].map((d, i) => (
            <div key={i} className="bg-[#fafafa] dark:bg-black p-8 sm:p-10">
              <BigNum {...d} />
            </div>
          ))}
        </div>

        {/* ═══════ SECTION 1: THE OPPORTUNITY ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">The opportunity</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">The labor market is restructuring around AI agents and nobody is serving the new demand</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                U.S. job postings for AI engineers grew by <Cite href="https://www.kore1.com/">143% year over year in 2025</Cite>. The AI agent development segment is projected to grow at a <Cite href="https://www.azumo.com/">52.4% CAGR through 2030</Cite>. By December 2025, <Cite href="https://www.high5test.com/">4.2% of all U.S. job postings</Cite> required AI skills as a core requirement.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Entry-level engineering roles contract while companies redirect budgets toward agent orchestration, RAG pipelines, and autonomous workflows. These specialists command <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">20-56% salary premiums</Cite>. No recruitment platform exists for this intersection.
              </p>
            </div>
            <div>
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mb-4">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Roles most in demand, AI-era companies</p>
                <HBar data={[
                  { label: 'AI / ML Engineering', value: 89, color: '#18181B' },
                  { label: 'Infrastructure / Platform', value: 72, color: '#3F3F46' },
                  { label: 'Product Management', value: 58, color: '#52525B' },
                  { label: 'Data Science', value: 53, color: '#71717A' },
                  { label: 'Security', value: 47, color: '#71717A' },
                  { label: 'Design', value: 41, color: '#A1A1AA' },
                  { label: 'Customer Success', value: 24, color: '#D4D4D8' },
                ]} unit="%" />
              </div>
              <div className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden">
                {[
                  { value: '40%', label: 'Enterprise apps with\nAI agents by EOY 2026' },
                  { value: '23%', label: 'Orgs actively scaling\nagentic AI systems' },
                ].map((d, i) => (
                  <div key={i} className="bg-[#fafafa] dark:bg-black p-5 text-center">
                    <div className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{d.value}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 whitespace-pre-line">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Callout>Companies are not hiring fewer engineers. They are hiring different engineers. The infrastructure to find and evaluate them does not exist.</Callout>

          <Sources>
            <Cite href="https://www.gartner.com/en/newsroom/press-releases/2024-10-21-gartner-identifies-the-top-10-strategic-technology-trends-for-2025">Gartner</Cite> · <Cite href="https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai">McKinsey State of AI</Cite> · <Cite href="https://www.researchnester.com/reports/autonomous-ai-agents-market/6660">Research Nester</Cite> · <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">Robert Half</Cite> · <Cite href="https://cvin.bio/jobs">CVin.Bio internal data</Cite>
          </Sources>
        </section>

        {/* ═══════ SECTION 2: THE PROBLEM ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">The problem</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">Hiring talent costs too much, takes too long, and produces poor signal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Average U.S. cost per hire is <Cite href="https://www.shrm.org/topics-tools/news/talent-acquisition">$4,800</Cite>. For specialized roles, recruiters charge <Cite href="https://www.techneeds.com/">15-30% of first-year salary</Cite>, pushing a single senior hire to $40-60K in fees. Specialized tech roles take <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">89+ days to fill</Cite>.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                The core issue is signal. A search for &quot;engineer&quot; on LinkedIn returns interns and principal architects alike. Existing platforms match on keywords, not capability depth. The problem is worst in AI and emerging tech, but it applies to every specialized role.
              </p>
            </div>
            <div>
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 text-center">Cost of one senior engineering hire via recruiter</p>
                <CostComparison />
              </div>
            </div>
          </div>

          <Callout>For a single $200K engineering hire, the recruiter fee alone can exceed $50,000. And it still takes three months.</Callout>

          <Sources>
            <Cite href="https://www.shrm.org/topics-tools/news/talent-acquisition">SHRM</Cite> · <Cite href="https://www.techneeds.com/">TechNeeds</Cite> · <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">Robert Half 2026</Cite> · <Cite href="https://www.levels.fyi/2025/">Levels.fyi</Cite>
          </Sources>
        </section>

        {/* ═══════ SECTION 3: MARKET SIZE ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Market size</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">Large market with no dominant vertical player</h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Global recruitment exceeds <Cite href="https://www.staffingindustry.com/">$640 billion</Cite>. LinkedIn generates <Cite href="https://www.businessofapps.com/data/linkedin-statistics/">$17.1B annually</Cite>. ZipRecruiter brings in <Cite href="https://investors.ziprecruiter.com">$449M</Cite>. The AI recruitment segment alone is valued at <Cite href="https://www.einpresswire.com/">$700M+</Cite>, growing 7% yearly.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                All incumbents are horizontal. Meanwhile, a new wave of AI sourcing startups (Juicebox AI at $850M valuation, Eightfold AI at $2.1B, SeekOut with $189M raised, Moonhub, hireEZ) have collectively raised over $900M, validating that investors see the gap. But every one of those tools automates what recruiters do. None build the structured talent layer that AI agents can query directly.
              </p>
            </div>
            <div className="lg:col-span-2 flex items-center">
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 w-full">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 text-center">Market layers</p>
                <MarketSizeDiagram />
              </div>
            </div>
          </div>
          <Sources>
            <Cite href="https://www.staffingindustry.com/">Staffing Industry Analysts</Cite> · <Cite href="https://www.businessofapps.com/data/linkedin-statistics/">Business of Apps</Cite> · <Cite href="https://investors.ziprecruiter.com">ZipRecruiter Investor Relations</Cite> · <Cite href="https://www.einpresswire.com/">EIN Presswire</Cite>
          </Sources>
        </section>

        {/* ═══════ SECTION 4: OUR SOLUTION ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Our solution</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">Four integrated layers, each feeding the others</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-10">
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              The free CV-to-website tool brings candidates in. Job matching keeps them engaged. Every profile adds to a structured talent database that employers can query by skill, role, and experience.
            </p>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 text-center">Platform architecture</p>
              <PlatformStack />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { n: '1', title: 'Candidate acquisition', points: ['Free CV-to-website tool with no sign-up friction', '17,000+ skill-matched jobs from 170+ companies', 'Candidates upload once, get matched to relevant roles automatically'] },
              { n: '2', title: 'Structured talent database', points: ['Every upload extracts and normalizes skills, work history, and credentials', 'Matching quality improves as the database grows', 'Employers search by verified skill and experience, not keyword guessing'] },
              { n: '3', title: 'Employer query layer', points: ['Companies search talent by actual capability, not self-reported keywords', 'Integrated into existing hiring workflows via API', 'Priced at a fraction of recruiter fees'] },
              { n: '4', title: 'Agent Hiring Module (planned)', points: ['Embeddable API for companies to query the talent database programmatically', 'AI hiring agents search, filter, and retrieve candidates on demand', 'Usage-based pricing per query and per seat'] },
            ].map((card) => (
              <div key={card.n} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">{card.n}</div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{card.title}</h3>
                </div>
                <ul className="space-y-2">
                  {card.points.map((pt, i) => (
                    <li key={i} className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.7] flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-[7px] shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ SECTION 5: COMPETITION ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Competition</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">Well-funded competitors automate recruiters. We replace the need for them.</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-12">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                The recruiting-tech space has three layers. Horizontal job boards serve everyone and match on keywords. A new wave of AI sourcing tools automates what recruiters do manually: searching databases, sending outreach, filtering résumés. Both leave the same gap open: no structured, agent-queryable talent infrastructure.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                CVin.Bio does not compete with recruiters or sourcing tools. It builds the protocol layer they will all eventually need to query.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 text-center">Where we sit</p>
              <CompetitiveLandscape />
            </div>
          </div>

          {/* ── TIER 1: Horizontal Incumbents ── */}
          <div className="mb-10">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-semibold mb-4">Tier 1 · Horizontal job platforms</p>
            <div className="space-y-2">
              {[
                { bold: 'LinkedIn', rest: '($17.1B rev). Dominant network but matches on keywords, not verified capability. Recruiter Lite starts at $170/mo with limited InMails.' },
                { bold: 'Indeed', rest: '. Volume-first model. Spray-and-pray applications. No structured skill layer.' },
                { bold: 'ZipRecruiter', rest: '($449M rev). SMB-focused job distribution. No talent profiling.' },
                { bold: 'Wellfound, Otta, Hired', rest: '. Generalist tech job boards. No machine-readable profiles, no agent endpoints, no MCP infrastructure.' },
              ].map((item, i) => (
                <p key={i} className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.7] flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-[7px] shrink-0" />
                  <span><span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.bold}</span> {item.rest}</span>
                </p>
              ))}
            </div>
          </div>

          {/* ── TIER 2: AI Sourcing Tools ── */}
          <div className="mb-10">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-semibold mb-4">Tier 2 · AI sourcing tools</p>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-[1.8] mb-5">
              These platforms automate the recruiter&apos;s workflow: search, filter, outreach. They are powerful but serve the same model. A human recruiter still sits in the loop, and candidate data remains unstructured.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Juicebox AI (PeopleGPT)', funding: '$116M raised · $850M valuation', desc: 'Natural-language search across 800M+ profiles. AI agents source and send outreach. Series B led by DST Global with Sequoia, Coatue.', gap: 'Automates the recruiter. Does not make candidates discoverable to AI systems.' },
                { name: 'Eightfold AI', funding: '$424M raised · $2.1B valuation', desc: 'Enterprise talent intelligence: external hiring, internal mobility, skills taxonomies.', gap: 'Enterprise-only. No candidate-facing product. Candidates have no agency or profile.' },
                { name: 'SeekOut', funding: '$189M raised', desc: 'Advanced aggregated search with semantic matching, diversity filters, and talent analytics.', gap: 'Recruiter SaaS. Dashboard for humans. No agent-queryable API, no structured profiles.' },
                { name: 'Moonhub', funding: '$44M raised', desc: 'AI recruiter with human-in-the-loop expert model. Sources, screens, and delivers shortlists.', gap: 'Managed service. Candidates are passive data. No profile infrastructure.' },
                { name: 'hireEZ', funding: '$45M raised', desc: 'Outbound sourcing with Boolean and AI-assisted search, CRM, and campaign automation.', gap: 'Recruiter tooling. No candidate-side product. No structured talent protocol.' },
                { name: 'Gem', funding: '$148M raised', desc: 'Recruiting CRM with pipeline analytics, sourcing automation, and ATS integrations.', gap: 'Workflow orchestration for recruiting teams. No talent discovery layer.' },
              ].map((comp) => (
                <div key={comp.name} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
                  <h4 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50 mb-1">{comp.name}</h4>
                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mb-2">{comp.funding}</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-[1.65] mb-3">{comp.desc}</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-[1.6] italic border-t border-zinc-100 dark:border-zinc-800/50 pt-2">{comp.gap}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── TIER 3: CVin.Bio ── */}
          <div className="p-6 sm:p-8 rounded-2xl border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 mb-6">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-semibold mb-3">Our category · Talent infrastructure</p>
            <h4 className="text-lg font-serif font-bold text-white dark:text-zinc-900 mb-3">CVin.Bio</h4>
            <p className="text-[14px] text-zinc-300 dark:text-zinc-600 leading-[1.8] mb-4">
              Not a sourcing tool. Not a job board. A structured talent protocol where every profile is machine-readable, every skill is verified against work history, and AI agents can query candidates directly via MCP. The platform creates the data layer that every recruiter, ATS, and AI agent will eventually need to read from.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { check: 'Structured profiles (Schema.org, JSON-LD)' },
                { check: 'Agent-queryable MCP server' },
                { check: 'Candidate-facing product (free)' },
                { check: 'Skill-matched job discovery' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-zinc-300 dark:text-zinc-600 leading-[1.6]">
                  <span className="text-green-400 dark:text-green-600 mt-0.5 shrink-0">✓</span>
                  {item.check}
                </div>
              ))}
            </div>
          </div>

          <Callout>Every AI sourcing tool automates the recruiter. None of them make the candidate queryable. That is the layer we build.</Callout>

          <Sources>
            <Cite href="https://juicebox.ai">Juicebox AI</Cite> · <Cite href="https://eightfold.ai">Eightfold AI</Cite> · <Cite href="https://seekout.com">SeekOut</Cite> · <Cite href="https://moonhub.ai">Moonhub</Cite> · <Cite href="https://hireez.com">hireEZ</Cite> · <Cite href="https://www.gem.com">Gem</Cite> · <Cite href="https://www.businessofapps.com/data/linkedin-statistics/">Business of Apps</Cite> · <Cite href="https://tracxn.com">Tracxn</Cite>
          </Sources>
        </section>

        {/* ═══════ SECTION 6: BUSINESS MODEL ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Business model</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">Three revenue streams aligned with the hiring funnel</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="space-y-8">
              {[
                { n: '01', title: 'Featured placement fees', body: 'Companies pay to boost roles and receive priority placement to skill-matched candidates. High-intent audience, low waste.' },
                { n: '02', title: 'Candidate sourcing subscriptions', body: 'Per-seat pricing to query the candidate database via MCP or web. Structured skill filtering replaces LinkedIn Recruiter ($8,999/year).' },
                { n: '03', title: 'Placement success fees', body: 'Performance-based fee on successful hires. The company pays only when the hire happens, at a fraction of the 20-30% recruiters charge.' },
                { n: '04', title: 'Agent Hiring Module (SaaS)', body: 'Monthly subscription for the embeddable hiring agent SDK. Per-query and per-seat pricing. Their AI sources talent autonomously.' },
              ].map((item) => (
                <div key={item.n} className="flex gap-5">
                  <span className="text-4xl font-serif font-bold text-zinc-200 dark:text-zinc-800 shrink-0 leading-none pt-0.5">{item.n}</span>
                  <div>
                    <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 mb-2">{item.title}</h3>
                    <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mb-4">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Revenue per unit economics</p>
                <HBar data={[
                  { label: 'Recruiter agency (20-30%)', value: 50000, color: '#D4D4D8' },
                  { label: 'LinkedIn Recruiter seat/yr', value: 8999, color: '#A1A1AA' },
                  { label: 'Avg cost per hire (SHRM)', value: 4800, color: '#71717A' },
                  { label: 'Featured listing (planned)', value: 500, color: '#3F3F46' },
                ]} unit="" />
              </div>
              <div className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden">
                {[
                  { value: '$640B', label: 'Total recruitment\nmarket' },
                  { value: '$17B', label: 'Online recruitment\ntech alone' },
                ].map((d, i) => (
                  <div key={i} className="bg-[#fafafa] dark:bg-black p-5 text-center">
                    <div className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{d.value}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 whitespace-pre-line">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ SECTION 7: WHY NOW ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Why now</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">Four reasons the timing is now</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
            {[
              { n: '01', title: 'Agent frameworks are going to production', body: 'LangChain, CrewAI, AutoGen, Semantic Kernel all graduated to enterprise in 2025. Every adopter needs engineers who understand tool calling, memory architectures, and agent behavior.' },
              { n: '02', title: 'AI reads every resume first', body: 'Recruiter bots and ATS agents now encounter profiles before humans do. Profiles that are not machine-readable get filtered out. We provide the format these systems consume.' },
              { n: '03', title: 'MCP enables a new category', body: 'Anthropic\'s Model Context Protocol standardized how AI assistants query external tools. We are among the first to expose a live MCP server for talent search.' },
              { n: '04', title: 'The recruiter model is fragile', body: 'Recruiters charge 20-30% of salary and rely on LinkedIn boolean searches. For a $200K hire, that is $40-60K. Structured discovery replaces this entirely.' },
            ].map((item) => (
              <div key={item.n} className="flex gap-5">
                <span className="text-4xl font-serif font-bold text-zinc-200 dark:text-zinc-800 shrink-0 leading-none pt-0.5">{item.n}</span>
                <div>
                  <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 mb-2">{item.title}</h3>
                  <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <Callout>The next LinkedIn will not be built for humans scrolling feeds. It will be built for AI agents querying structured endpoints.</Callout>
        </section>

        {/* ═══════ SECTION 8: TRACTION ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Traction</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">What we have shipped</h2>
          <p className="text-[14px] text-zinc-400 dark:text-zinc-500 mb-8">Formally launched April 1, 2026. Entire platform self-built end to end.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden mb-8">
            {[
              { metric: '17,000+', desc: 'Live job listings aggregated' },
              { metric: '170+', desc: 'Companies tracked' },
              { metric: '100+', desc: 'AI user agents with crawler access' },
              { metric: '3', desc: 'Research reports with email capture' },
              { metric: '4', desc: 'AI discovery layers deployed' },
              { metric: '3-day', desc: 'Job listing refresh cycle' },
            ].map((item, i) => (
              <div key={i} className="bg-[#fafafa] dark:bg-black p-6 sm:p-8 text-center">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{item.metric}</div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              Job board aggregates listings from OpenAI, Anthropic, Stripe, Airbnb, Coinbase, Cloudflare, Databricks, Snowflake, and 160+ others. Profile engine parses CVs into structured, schema-annotated pages. MCP server is operational.
            </p>
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              Three published research reports (<Cite href="https://cvin.bio/tech-talent-report">Tech Talent 2026</Cite>, <Cite href="https://cvin.bio/layoffs-report">Layoffs 2026</Cite>, <Cite href="https://cvin.bio/remote-talent-report">Remote Talent 2026</Cite>) gated behind email capture. Active distribution on LinkedIn and X.
            </p>
          </div>
        </section>

        {/* ═══════ SECTION 9: VISION ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Vision</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">The infrastructure layer for agent-mediated hiring</h2>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-10 max-w-3xl">
            The recruiter workflow (search, scroll, email) was designed for humans. When AI assistants can query a structured talent endpoint, filter by verified skills, and initiate outreach autonomously, that workflow becomes an API call. We are building the protocol layer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden">
            {[
              { phase: 'Now', items: ['Job aggregation from 170+ companies', 'Structured profile generation from CVs', 'MCP server and AI discovery infrastructure', 'Research-driven content distribution'] },
              { phase: 'Next', items: ['Agent Hiring Module for enterprise integration', 'Employer sourcing dashboard and subscriptions', 'Verified skill assessments', 'Companies\' AI agents source talent via our API'] },
              { phase: 'Long-term', items: ['Open talent protocol for any AI system', 'Agent-to-agent hiring: company agents publish requirements, candidate agents respond', 'The identity layer for AI-mediated professional commerce'] },
            ].map((phase, i) => (
              <div key={i} className="bg-[#fafafa] dark:bg-black p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">{i + 1}</div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{phase.phase}</h3>
                </div>
                <ul className="space-y-2.5">
                  {phase.items.map((item, j) => (
                    <li key={j} className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.7] flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Callout>We are not building a job board that happens to have an API. We are building the API layer for agent-mediated hiring that happens to have a job board.</Callout>
        </section>

        {/* ═══════ TEAM / FOUNDER ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Founder</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">Built by someone who has done this before</h2>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 mb-12">
            {/* Left: Photo + bio card */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://veda.ng/images/icon.png" alt="Vedang Vatsa" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-zinc-200 dark:border-zinc-700" />
                <h3 className="text-lg font-serif font-bold text-zinc-900 dark:text-zinc-50">Vedang Vatsa</h3>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 mb-4">Founder &amp; CEO, CVin.Bio</p>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <a href="https://www.linkedin.com/in/vedangvatsa" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <a href="https://veda.ng/profile" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    Profile
                  </a>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-3">Previous venture</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <a href="https://hashtagweb3.com" target="_blank" rel="noopener noreferrer">
                    <img src="https://hashtagweb3.com/logo/HashtagWeb3.png" alt="HashtagWeb3" className="h-7 mx-auto opacity-70 hover:opacity-100 transition-opacity dark:invert" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Highlights */}
            <div className="lg:col-span-3">
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Previously built <Cite href="https://hashtagweb3.com">HashtagWeb3.com</Cite>: 120K+ community, 55M post views, supported by Microsoft for Startups. Former consultant at KPMG. Fellow of the Royal Society of Arts. 25 research publications in IEEE, SSRN, and others.
              </p>
              <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-xl overflow-hidden mb-6">
                {[
                  { value: '120K+', label: 'Community built' },
                  { value: '55M', label: 'Views, year one' },
                  { value: '25', label: 'Publications' },
                ].map((d, i) => (
                  <div key={i} className="bg-[#fafafa] dark:bg-black p-5 text-center">
                    <div className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{d.value}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.7] flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-[7px] shrink-0" />
                  <span><Cite href="https://veda.ng/media">Speaker</Cite> at Code Arica Conference, IIT Delhi &amp; Kanpur, TUM Munich, ETH Enugu, Premier AI and Web3 Gala, The Responsible AI Forum, ISB Hyderabad</span>
                </p>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.7] flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-[7px] shrink-0" />
                  Favikon Top 50 Fintech &amp; Crypto Creators. Thinkers360 Top 50 Metaverse Thought Leaders
                </p>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.7] flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-[7px] shrink-0" />
                  <span><Cite href="https://x.com/LokSabhaSectt/status/1996239975906676795">Invited to the Parliament of India</Cite> to discuss Virtual Digital Assets</span>
                </p>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.7] flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-[7px] shrink-0" />
                  <span>Recommendation by <Cite href="https://www.youtube.com/watch?v=94aOD3yc2LM">Jack Allison</Cite> (Screenwriter, Oscars 2017). Medal by former Director of Indian PM&apos;s office</span>
                </p>
              </div>
            </div>
          </div>

          {/* Media coverage strip */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-8">
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] text-center mb-6">As seen in</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-50">
              {[
                { src: 'https://veda.ng/images/press/Yahoo_Finance_logo.png', alt: 'Yahoo Finance', h: 'h-5' },
                { src: 'https://veda.ng/images/press/Business_Insider_2023_logo.svg.png', alt: 'Business Insider', h: 'h-4' },
                { src: 'https://veda.ng/images/press/et-logo4px.png', alt: 'Economic Times', h: 'h-5' },
                { src: 'https://veda.ng/images/press/IEEE_Computer.png', alt: 'IEEE', h: 'h-5' },
                { src: 'https://veda.ng/images/press/business-standard-logo-2.png', alt: 'Business Standard', h: 'h-4' },
                { src: 'https://veda.ng/images/press/bt_business_today_vedang_vatsa.png', alt: 'Business Today', h: 'h-4' },
                { src: 'https://veda.ng/images/press/68296-business-media-company-inc42-startup-marketing.png', alt: 'Inc42', h: 'h-5' },
                { src: 'https://veda.ng/images/press/Decrypt_logo.svg', alt: 'Decrypt', h: 'h-4' },
              ].map((logo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={logo.alt} src={logo.src} alt={logo.alt} className={`${logo.h} w-auto object-contain dark:invert`} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ USE OF FUNDS / THE ASK ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">The ask</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">Pre-seed round to reach first revenue</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Product is live. Aggregation engine running. MCP infrastructure operational. Raising a pre-seed to go from working product to first revenue.
              </p>
              <div className="space-y-6">
                {[
                  { n: '01', title: 'Engineering', body: 'Build the Agent Hiring Module SDK and employer-facing dashboard. Expand the aggregation pipeline coverage. Implement verified skill assessment infrastructure.' },
                  { n: '02', title: 'Go-to-market', body: 'Direct outreach to companies building AI agents and autonomous systems. Content-led distribution through data-driven research reports. Community and email list growth.' },
                  { n: '03', title: 'Operations', body: 'Infrastructure and hosting at scale. Legal and compliance framework for employer contracts and candidate data governance.' },
                ].map((item) => (
                  <div key={item.n} className="flex gap-5">
                    <span className="text-4xl font-serif font-bold text-zinc-200 dark:text-zinc-800 shrink-0 leading-none pt-0.5">{item.n}</span>
                    <div>
                      <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 mb-1">{item.title}</h3>
                      <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mb-4">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Planned milestones</p>
                <div className="space-y-5">
                  {[
                    { q: 'Phase 1', items: 'Employer dashboard beta, first paid featured listings, expanded job pipeline' },
                    { q: 'Phase 2', items: 'Agent Hiring Module alpha with design partners building agentic products' },
                    { q: 'Phase 3', items: 'Sourcing subscription launch, placement success fee model operational' },
                    { q: 'Phase 4', items: 'Agent-to-agent protocol design, enterprise pilot partnerships' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 shrink-0 w-20">{item.q}</span>
                      <span className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.7]">{item.items}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Callout>The platform is already live. This raise is not to build a prototype. It is to scale a working product into a revenue-generating business.</Callout>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <div className="p-10 bg-zinc-900 dark:bg-zinc-100 rounded-2xl text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-2">Interested in what we are building?</p>
          <p className="text-lg font-serif font-semibold text-white dark:text-zinc-900 mb-5">Let&apos;s talk.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Get in touch
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

      </main>
      <MicroFooter />
    </div>
  );
}
