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
      <text x={totalW - 12} y={top + chartH + 46} textAnchor="end" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">*Projected. Sources: Research Nester, Mordor Intelligence</text>
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
  const players = [
    { name: 'LinkedIn', x: 80, y: 50, r: 32, rev: '$17.1B' },
    { name: 'Indeed', x: 180, y: 65, r: 26, rev: '' },
    { name: 'ZipRecruiter', x: 290, y: 55, r: 18, rev: '$449M' },
    { name: 'Wellfound', x: 60, y: 140, r: 14, rev: '' },
    { name: 'Otta', x: 150, y: 150, r: 12, rev: '' },
    { name: 'Hired', x: 230, y: 145, r: 12, rev: '' },
  ];
  return (
    <svg viewBox="0 0 420 220" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Axis labels */}
      <text x="210" y="210" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">General purpose ← → Domain-specific</text>
      <text x="12" y="110" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit" transform="rotate(-90 12 110)">Scale</text>
      {/* Grid */}
      <line x1="30" y1="190" x2="390" y2="190" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="0.5" />
      <line x1="30" y1="30" x2="30" y2="190" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="0.5" />
      {/* Players */}
      {players.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.r} className="fill-zinc-200 dark:fill-zinc-800" />
          <text x={p.x} y={p.y + 3} textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[8px] font-bold" fontFamily="inherit">{p.name}</text>
          {p.rev && <text x={p.x} y={p.y + 13} textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[7px]" fontFamily="inherit">{p.rev}</text>}
        </g>
      ))}
      {/* CVin.Bio - positioned in the opportunity gap */}
      <circle cx="350" cy="140" r="16" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="350" y="143" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[7px] font-bold" fontFamily="inherit">CVin.Bio</text>
      {/* Opportunity zone */}
      <rect x="300" y="100" width="100" height="80" rx="8" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth="1" strokeDasharray="4 3" fill="none" />
      <text x="350" y="96" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px] font-semibold" fontFamily="inherit">Opportunity gap</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: PLATFORM STACK ─── */
function PlatformStack() {
  return (
    <svg viewBox="0 0 520 200" fill="none" className="w-full h-auto" aria-hidden="true">
      <rect x="30" y="145" width="460" height="48" rx="8" className="fill-zinc-200 dark:fill-zinc-800" />
      <text x="260" y="166" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[11px] font-bold" fontFamily="inherit">Multi-source job aggregation</text>
      <text x="260" y="182" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">6,000+ listings from 60+ companies</text>
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
      <main className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24 lg:py-32 pb-32 flex-1">

        {/* ─── HERO ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">CVin.Bio / April 2026</p>
            <h1 className="text-4xl sm:text-[3.4rem] font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 leading-[1.12]">
              Talent infrastructure<br />for the agentic era
            </h1>
            <p className="text-[17px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
              <Cite href="https://www.gartner.com/en/newsroom/press-releases/2024-10-21-gartner-identifies-the-top-10-strategic-technology-trends-for-2025">Gartner projects</Cite> that 40% of enterprise applications will embed AI agents by the end of 2026, up from under 5% in 2025. <Cite href="https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai">McKinsey reports</Cite> that 62% of organizations are already experimenting with autonomous systems. Every one of these companies needs to hire engineers who can build them. The recruitment infrastructure for this talent pool does not exist yet. We are building it.
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
            { value: '$11.8B', label: 'Autonomous agent market, projected 2026', href: 'https://www.researchnester.com/reports/autonomous-ai-agents-market/6660', sub: 'Research Nester' },
            { value: '143%', label: 'YoY growth in AI engineer job postings, 2025', href: 'https://www.kore1.com/', sub: 'Kore1' },
            { value: '89+', label: 'Days to fill an AI/ML engineering role', href: 'https://www.roberthalf.com/us/en/insights/salary-guide', sub: 'Robert Half' },
            { value: '$200K+', label: 'Median total comp, senior AI engineer', href: 'https://www.levels.fyi/2025/', sub: 'Levels.fyi' },
          ].map((d, i) => (
            <div key={i} className="bg-[#fafafa] dark:bg-black p-8 sm:p-10">
              <BigNum {...d} />
            </div>
          ))}
        </div>

        {/* ═══════ SECTION 1: THE OPPORTUNITY ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">The opportunity</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">The labor market is restructuring around AI agents and nobody is serving the new demand</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                U.S. job postings for AI engineers grew by <Cite href="https://www.kore1.com/">143% year over year in 2025</Cite>. The software engineering segment focused on AI agent development is projected to grow at a <Cite href="https://www.azumo.com/">52.4% compound annual growth rate through 2030</Cite>. By December 2025, <Cite href="https://www.high5test.com/">4.2% of all U.S. job postings</Cite> specifically mentioned AI skills as a core requirement, not a nice-to-have.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Simultaneously, entry-level software engineering roles are contracting. Companies are eliminating routine programming positions and redirecting headcount budgets toward engineers who can architect agent orchestration systems, build RAG pipelines, and deploy autonomous workflows. Workers with these skills command <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">salary premiums of 20% to 56%</Cite> over comparable non-AI roles.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                The result is a bifurcated market. Intense competition for a small pool of specialized engineers. A surplus of generalists whose skills are increasingly automated. And no recruitment platform built specifically for the intersection.
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
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Hiring AI talent costs too much, takes too long, and produces poor signal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                The average cost per hire in the United States is <Cite href="https://www.shrm.org/topics-tools/news/talent-acquisition">$4,800</Cite>. For specialized AI engineering roles, where recruiters charge <Cite href="https://www.techneeds.com/">15% to 30% of first-year salary</Cite>, that number often exceeds $40,000 to $60,000 per placement. A single senior AI engineer hire at $200K base salary through a third-party recruiter costs the company $40K to $60K in fees alone.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                The time cost is equally severe. AI/ML engineering roles take <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">89+ days to fill</Cite> on average. During that vacancy, product development stalls, competitors ship, and the opportunity cost compounds.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                The fundamental issue is signal. A keyword search for &quot;AI engineer&quot; on LinkedIn or Indeed returns everything from prompt engineering interns to principal architects who have designed multi-agent orchestration systems. The hiring manager wastes weeks screening the wrong candidates. Existing platforms match on words. They cannot evaluate depth.
              </p>
            </div>
            <div>
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 text-center">Cost of one AI engineering hire via recruiter</p>
                <CostComparison />
              </div>
            </div>
          </div>

          <Callout>For a single $200K AI engineering hire, the recruiter fee alone can exceed $50,000. And it still takes three months.</Callout>

          <Sources>
            <Cite href="https://www.shrm.org/topics-tools/news/talent-acquisition">SHRM</Cite> · <Cite href="https://www.techneeds.com/">TechNeeds</Cite> · <Cite href="https://www.roberthalf.com/us/en/insights/salary-guide">Robert Half 2026</Cite> · <Cite href="https://www.levels.fyi/2025/">Levels.fyi</Cite>
          </Sources>
        </section>

        {/* ═══════ SECTION 3: MARKET SIZE ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Market size</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Large market with no dominant vertical player</h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                The global recruitment and staffing market exceeds <Cite href="https://www.staffingindustry.com/">$640 billion</Cite>. LinkedIn alone generates <Cite href="https://www.businessofapps.com/data/linkedin-statistics/">$17.1 billion in annual revenue</Cite>. ZipRecruiter generated <Cite href="https://investors.ziprecruiter.com">$449 million in 2025</Cite>. The narrower AI recruitment technology segment is valued at approximately <Cite href="https://www.einpresswire.com/">$700 million</Cite>, growing at 7% annually.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                But every one of these platforms is horizontal. They serve every industry, every role, every seniority level. None of them are built for the specific problem of sourcing, evaluating, and placing engineers who build autonomous systems. The closest competitors in the startup space, Wellfound, Otta, Hired, are generalist tech hiring platforms. They offer no structured skill verification, no machine-readable profile standards, and no agent-queryable infrastructure.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                The opportunity is to build the vertical talent layer specifically for the agentic economy, capturing both supply (candidate profiles) and demand (job listings from companies building AI products) in a single platform.
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
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Three integrated layers, each feeding the others</h2>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-8 max-w-2xl">
            CVin.Bio is a vertically integrated talent platform. We control the entire pipeline from job aggregation through candidate matching to AI-native discovery.
          </p>

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mb-8">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 text-center">Platform architecture</p>
            <PlatformStack />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">1</div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Job aggregation engine</h3>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
                We pull from multiple enterprise ATS platforms and job aggregators in real time. Over 6,000 live listings from 60+ companies including Stripe, Anthropic, Airbnb, Coinbase, Cloudflare, Discord, and Reddit. Every listing is deduplicated, normalized, and tagged with structured skill metadata.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">2</div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">AI-native candidate profiles</h3>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
                Candidates upload a resume and receive a structured web profile with <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">schema.org/Person</span> markup and JSON-LD metadata. Skills are extracted automatically and matched against live listings. Every profile is machine-readable by default.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">3</div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Reverse discovery</h3>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
                We expose an <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">llms.txt</span> profile index, an MCP server with <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">search_candidates</span> and <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">get_profile</span> tools, and explicit crawler access for 100+ AI user agents. Employers and their AI tools can query our talent pool programmatically.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">4</div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Agent Hiring Module (planned)</h3>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
                An embeddable SDK and API that lets companies deploy AI hiring agents inside their own workflows. The agent queries our MCP talent endpoint, filters by verified skills, and surfaces ranked candidates. Companies integrate once and their AI assistants can source talent autonomously, 24/7.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════ SECTION 5: COMPETITIVE LANDSCAPE ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Competitive landscape</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Horizontal incumbents leave the vertical wide open</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                LinkedIn, Indeed, and ZipRecruiter are horizontal platforms. They serve every industry and role type. They compete on volume and breadth. Their business model depends on being everything to everyone.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Startup-focused platforms like Wellfound, Otta, and Hired are narrower but still generalist within tech. None offer structured skill verification. None provide machine-readable profiles. None have infrastructure for AI agent-to-platform queries.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                CVin.Bio occupies the gap between general-purpose job boards and vertical talent platforms. We are domain-specific (AI/agentic), technology-native (MCP, schema.org, llms.txt), and structured by default. No other platform combines job aggregation, profile generation, and AI-native discovery in a single vertically integrated product.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 text-center">Where we sit</p>
              <CompetitiveLandscape />
            </div>
          </div>
        </section>

        {/* ═══════ SECTION 6: BUSINESS MODEL ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Business model</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Three revenue streams aligned with the hiring funnel</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="space-y-8">
              {[
                { n: '01', title: 'Featured placement fees', body: 'Companies pay to boost specific roles across the network and receive priority placement to skill-matched candidates. High-intent audience, low waste. Similar to LinkedIn Recruiter Lite pricing but with significantly higher signal per impression.' },
                { n: '02', title: 'Candidate sourcing subscriptions', body: 'Employers subscribe to query the candidate database via MCP or the web interface. Per-seat pricing. They filter by verified, structured skills rather than keyword matching. This replaces or supplements the LinkedIn Recruiter seat ($8,999/year).' },
                { n: '03', title: 'Placement success fees', body: 'Performance-based fee on successful hires sourced through CVin.Bio. Aligned incentives. The company only pays when the hire happens. At a fraction of the 20-30% that recruiters charge.' },
                { n: '04', title: 'Agent Hiring Module (SaaS)', body: 'Enterprise companies pay a monthly subscription for our embeddable hiring agent SDK. Their internal AI assistants use our MCP endpoint to autonomously source, rank, and shortlist candidates. Per-query and per-seat pricing tiers.' },
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
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-10">Four converging forces creating a timing window</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
            {[
              { n: '01', title: 'Agent frameworks are going to production', body: 'LangChain, CrewAI, AutoGen, and Semantic Kernel graduated from experiments to enterprise deployments in 2025. Every company adopting these frameworks needs engineers who understand tool calling, memory architectures, and deterministic agent behavior. This demand did not exist two years ago.' },
              { n: '02', title: 'AI is now the first reader of every resume', body: 'Recruiter bots, ATS pre-screening agents, and AI search assistants increasingly encounter candidate profiles before any human does. Profiles that are not machine-readable are filtered out. We provide the format and infrastructure that these systems actually consume.' },
              { n: '03', title: 'The MCP protocol enables a new category', body: 'Anthropic\'s Model Context Protocol created a standardized way for AI assistants to query external tools. We are one of the first platforms to expose a live MCP server for talent search. This means any MCP-enabled AI assistant can programmatically query our candidate database.' },
              { n: '04', title: 'The recruiter model is economically fragile', body: 'Third-party recruiters charge 20-30% of first-year salary and still rely on LinkedIn boolean searches. For a $200K hire, that is $40K to $60K per placement. Structured, programmatic candidate discovery at a fraction of the cost replaces this model entirely.' },
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
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">What we have shipped</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                CVin.Bio is live. The job board aggregates 6,000+ listings from 60+ companies. The profile engine parses uploaded CVs into structured, schema-annotated pages. The MCP server is operational and queryable by any compatible AI assistant. The <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">llms.txt</span> index is regenerated hourly.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                We have published two original research reports. The <Cite href="https://cvin.bio/layoffs-report">Tech Layoffs Report 2026</Cite> and the <Cite href="https://cvin.bio/remote-talent-report">Remote Talent Report 2026</Cite>, both data-driven and gated behind email capture to build distribution. We maintain active content distribution across LinkedIn and X with automated, data-backed posting.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                The entire platform is self-built. We control the aggregation pipeline, matching logic, profile schema, and discovery infrastructure end to end. No white-label feeds. No third-party recruitment SaaS.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">What is live today</p>
              <div className="space-y-5">
                {[
                  { metric: '6,000+', desc: 'Live job listings aggregated in real time' },
                  { metric: '60+', desc: 'Companies tracked (Stripe, Anthropic, Airbnb, Coinbase, etc.)' },
                  { metric: '100+', desc: 'AI user agents with explicit crawler access' },
                  { metric: '2', desc: 'Published research reports with email capture' },
                  { metric: '4', desc: 'AI discovery layers (Schema.org, MCP, llms.txt, robots.txt)' },
                  { metric: '3-day', desc: 'Job listing refresh cycle' },
                ].map((item, i) => (
                  <div key={i} className="flex items-baseline gap-4">
                    <span className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-50 shrink-0 w-16 text-right">{item.metric}</span>
                    <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ SECTION 9: VISION ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Vision</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">The infrastructure layer for agent-mediated hiring</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Today, when a company wants to hire an AI engineer, a human recruiter opens LinkedIn, types keywords, scrolls through hundreds of profiles, and manually emails candidates. This workflow was designed for humans and it will be replaced by agents. When a company&apos;s AI assistant can query a structured talent endpoint, filter by verified capabilities, and initiate outreach autonomously, the recruiter workflow becomes an API call.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                CVin.Bio is building the infrastructure that makes this possible. Our MCP server, structured profiles, and machine-readable job data are the primitives that AI hiring agents need. We are not building another job board. We are building the talent protocol that agents consume.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                The endgame is an agent-to-agent hiring protocol where a company&apos;s agent publishes a structured capability requirement, candidate agents respond with verified credentials, and the platform brokers the match. The companies that control this protocol layer will own the most valuable real estate in the labor market.
              </p>
            </div>
            <div>
              <div className="space-y-4">
                {[
                  { phase: 'Now', items: ['Job aggregation from 60+ companies', 'Structured profile generation from CVs', 'MCP server and AI discovery infrastructure', 'Research-driven content distribution'] },
                  { phase: 'Next phase', items: ['Agent Hiring Module for enterprise integration', 'Employer sourcing dashboard and subscriptions', 'Verified skill assessments'] },
                  { phase: 'Long-term', items: ['Agent-to-agent hiring protocol', 'White-label agent hiring infrastructure', 'Professional identity layer for all AI-mediated commerce'] },
                ].map((phase, i) => (
                  <div key={i} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">{i + 1}</div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{phase.phase}</h3>
                    </div>
                    <ul className="space-y-1.5">
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
            </div>
          </div>

          <Callout>We are not building a job board that happens to have an API. We are building the API layer for agent-mediated hiring that happens to have a job board.</Callout>
        </section>

        {/* ═══════ TEAM / FOUNDER ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">Founder</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Built by someone who has done this before</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                CVin.Bio is founded by <Cite href="https://veda.ng/profile">Vedang Vatsa</Cite>, a computer engineer and MBA who previously built <Cite href="https://hashtagweb3.com">HashtagWeb3.com</Cite>, one of the largest Web3 job boards and community platforms. HashtagWeb3 grew to a community of 120,000+ members across Telegram, Discord, and LinkedIn, generated 55 million post views in its first year, and was featured as a top 3 Web3 product of the week. It was supported by Microsoft for Startups.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                Before that, Vedang served as a consultant at KPMG where he managed programs for India&apos;s Ministry of Electronics and IT, conducted commercial due diligence on companies valued at $2B+, and led technical due diligence on products with 220 million+ downloads. He is a Fellow of the Royal Society of Arts, a Young Researcher Awardee, and has 22 peer-reviewed publications in IEEE, SSRN, and other journals, including recent work on <Cite href="https://dx.doi.org/10.2139/ssrn.5660270">AI agent transaction economics</Cite>.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                The same playbook that built HashtagWeb3 from zero to 120K community members is now being applied to CVin.Bio. The difference is that this time, the infrastructure is designed for AI agents from day one, not retrofitted.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">Track record</p>
              <div className="space-y-5">
                {[
                  { metric: '120K+', desc: 'Community members at HashtagWeb3' },
                  { metric: '55M', desc: 'Post views in first year at HashtagWeb3' },
                  { metric: '80M', desc: 'Yearly LinkedIn post views on AI/Web3 research' },
                  { metric: '22', desc: 'Peer-reviewed publications (IEEE, SSRN)' },
                  { metric: 'FRSA', desc: 'Fellow of the Royal Society of Arts' },
                  { metric: 'KPMG', desc: 'Former consultant, Ministry of IT programs' },
                ].map((item, i) => (
                  <div key={i} className="flex items-baseline gap-4">
                    <span className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-50 shrink-0 w-16 text-right">{item.metric}</span>
                    <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ USE OF FUNDS / THE ASK ═══════ */}
        <section className="mb-28">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">The ask</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Pre-seed round to reach first revenue</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                The product is live. The aggregation engine is running. The MCP infrastructure is operational. We are raising a pre-seed round to go from working product to first revenue. The capital will fund the engineering depth to build the Agent Hiring Module, the sales capacity to convert companies building agentic products into paying customers, and the operational foundation to scale.
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
                    { q: 'Phase 2', items: 'Agent Hiring Module alpha with design partners from the agentic ecosystem' },
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
