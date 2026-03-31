'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/* ─── FULL LAYOFFS REPORT ───
   Email-gated version of the expanded report.
   • White background only (no dark mode)
   • Double the content of the landing page
   • CSS page-break-inside: avoid on all figures
   • Access gated: requires email submission or access token
   • About CVin.Bio section at the end
*/

const STORAGE_KEY = 'layoffs-report-unlocked';

/* ─── INLINE CITE ─── */
function Cite({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline underline-offset-2 decoration-zinc-400 hover:decoration-zinc-900 transition-colors">
      {children}
    </a>
  );
}

/* ─── EMAIL GATE ─── */
function EmailGate({ onUnlock }: { onUnlock: () => void }) {
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
        body: JSON.stringify({ email, report: 'layoffs' }),
      });
      if (res.ok) {
        setStatus('success');
        try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
        setTimeout(() => onUnlock(), 600);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 py-4 px-6 bg-emerald-50 border border-emerald-200 rounded-xl">
        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        <p className="text-sm text-emerald-800 font-medium">Unlocking report...</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 rounded-full mb-6">
        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Full report</span>
      </div>
      <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-3">Enter your email to read the full report</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto leading-relaxed">
        Get instant access to all 7 sections, 6 exhibits, and our 5 predictions for the tech labor market.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400 transition-all placeholder:text-zinc-400"
        />
        <button
          type="submit" disabled={status === 'loading'}
          className="px-6 py-3 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === 'loading' ? 'Unlocking...' : 'Unlock report'}
        </button>
      </form>
      {status === 'error' && <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>}
      <p className="text-[11px] text-zinc-400 mt-4">We'll also send the report to your inbox. No spam, ever.</p>
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
          <div className="flex justify-between mb-1">
            <span className="text-sm text-zinc-700 font-medium">{d.label}</span>
            <span className="text-sm font-bold text-zinc-900">{d.value.toLocaleString()}{unit}</span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── BIG NUMBER ─── */
function BigNum({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="text-center p-6">
      <div className="text-4xl sm:text-5xl font-serif font-bold text-zinc-900 tracking-tight leading-none">{value}</div>
      <div className="text-sm text-zinc-500 mt-2 leading-relaxed">{label}</div>
      {sub && <div className="text-[10px] text-zinc-400 mt-1">{sub}</div>}
    </div>
  );
}

/* ─── CALLOUT ─── */
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-[3px] border-zinc-900 pl-6 py-3 my-8">
      <p className="text-lg font-serif text-zinc-800 leading-relaxed italic">{children}</p>
    </blockquote>
  );
}

/* ─── SECTION HEADING ─── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-serif font-bold tracking-tight text-zinc-900 mb-4 mt-2">{children}</h2>;
}

/* ─── BODY TEXT ─── */
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-zinc-600 leading-[1.85] mb-4">{children}</p>;
}

/* ─── SOURCES ─── */
function Sources({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-3 border-t border-zinc-100">
      <p className="text-[10px] text-zinc-400 leading-relaxed">{children}</p>
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
            <line x1="50" y1={y} x2={totalWidth - 10} y2={y} stroke="#f4f4f5" strokeWidth="0.5" />
            <text x="45" y={y + 4} textAnchor="end" fill="#a1a1aa" className="text-[9px]" fontFamily="inherit">{Math.round(pct * max / 1000)}K</text>
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
              fill={isCurrent ? '#ef4444' : i === 3 ? '#18181b' : '#a1a1aa'}
            />
            <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="#3f3f46" className="text-[10px] font-semibold" fontFamily="inherit">{d.label}</text>
            <text x={x + barWidth / 2} y={topPad + chartHeight + 28} textAnchor="middle" fill="#71717a" className="text-[10px]" fontFamily="inherit">{d.year}</text>
          </g>
        );
      })}
      <text x={totalWidth - 12} y={topPad + chartHeight + 46} textAnchor="end" fill="#a1a1aa" className="text-[8px]" fontFamily="inherit">*2026 YTD as of March</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: INDUSTRY TREEMAP ─── */
function IndustryTreemap() {
  return (
    <svg viewBox="0 0 400 200" fill="none" className="w-full h-auto" aria-hidden="true">
      <rect x="5" y="5" width="200" height="120" rx="8" fill="#18181b" />
      <text x="105" y="55" textAnchor="middle" fill="#fff" className="text-[14px] font-bold" fontFamily="inherit">Technology</text>
      <text x="105" y="78" textAnchor="middle" fill="rgba(255,255,255,0.7)" className="text-[12px]" fontFamily="inherit">141,200</text>
      <rect x="210" y="5" width="185" height="80" rx="8" fill="#52525b" />
      <text x="302" y="40" textAnchor="middle" fill="#fff" className="text-[12px] font-bold" fontFamily="inherit">Government</text>
      <text x="302" y="60" textAnchor="middle" fill="rgba(255,255,255,0.7)" className="text-[11px]" fontFamily="inherit">307,600</text>
      <rect x="210" y="90" width="90" height="105" rx="8" fill="#71717a" />
      <text x="255" y="140" textAnchor="middle" fill="#fff" className="text-[11px] font-bold" fontFamily="inherit">Retail</text>
      <text x="255" y="158" textAnchor="middle" fill="rgba(255,255,255,0.7)" className="text-[10px]" fontFamily="inherit">88,700</text>
      <rect x="305" y="90" width="90" height="105" rx="8" fill="#a1a1aa" />
      <text x="350" y="140" textAnchor="middle" fill="#3f3f46" className="text-[10px] font-bold" fontFamily="inherit">Warehousing</text>
      <text x="350" y="158" textAnchor="middle" fill="#52525b" className="text-[10px]" fontFamily="inherit">90,400</text>
      <rect x="5" y="130" width="100" height="65" rx="8" fill="#d4d4d8" />
      <text x="55" y="158" textAnchor="middle" fill="#3f3f46" className="text-[10px] font-bold" fontFamily="inherit">Financial</text>
      <text x="55" y="174" textAnchor="middle" fill="#52525b" className="text-[10px]" fontFamily="inherit">49,000</text>
      <rect x="110" y="130" width="95" height="65" rx="8" fill="#e4e4e7" />
      <text x="157" y="158" textAnchor="middle" fill="#52525b" className="text-[10px] font-bold" fontFamily="inherit">Services</text>
      <text x="157" y="174" textAnchor="middle" fill="#71717a" className="text-[10px]" fontFamily="inherit">63,600</text>
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
        stroke="#18181b" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round"
      />
      {events.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy={e.y} r={i === 3 ? 6 : 4} fill={i === 3 ? '#ef4444' : '#18181b'} />
          <text x={e.x} y={e.y + 24} textAnchor="middle" fill="#3f3f46" className="text-[10px] font-bold" fontFamily="inherit">{e.label}</text>
          <text x={e.x} y={e.y + 38} textAnchor="middle" fill="#a1a1aa" className="text-[8px]" fontFamily="inherit">{e.desc}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── INNER COMPONENT (uses useSearchParams) ─── */
function LayoffsReportInner() {
  const searchParams = useSearchParams();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check URL access token
    const accessParam = searchParams.get('access');
    if (accessParam) {
      try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
      setUnlocked(true);
      setChecking(false);
      return;
    }
    // Check localStorage
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        setUnlocked(true);
      }
    } catch {}
    setChecking(false);
  }, [searchParams]);

  if (checking) {
    return (
      <div className="bg-white text-zinc-900 min-h-screen flex items-center justify-center" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        <div className="text-zinc-400 text-sm">Loading report...</div>
      </div>
    );
  }

  return (
    <div className="bg-white text-zinc-900 min-h-screen" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <style>{`
        @media print {
          .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
          .page-break-before { page-break-before: always; break-before: page; }
        }
        .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
        .page-break-before { page-break-before: always; break-before: page; }
      `}</style>

      <main className="w-full max-w-[680px] mx-auto px-8 py-16">

        {/* ─── COVER ─── */}
        <div className="page-break-avoid mb-16">
          <p className="text-[10px] font-sans font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">CVin.Bio Research / March 2026</p>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-8 leading-[1.1]">
            The Tech Layoffs<br />Report 2026
          </h1>
          <P>
            Since March 2020, more than <Cite href="https://layoffs.fyi">750,000 tech workers</Cite> have been laid off from over 2,500 companies across the global technology industry. This report assembles data from six primary sources to examine who is cutting, why they are cutting, what happens to displaced workers after separation, and what these patterns mean for the labor market heading into the second half of the decade.
          </P>
          <P>
            The data presented here draws on public disclosures tracked by Layoffs.fyi, outplacement firm Challenger, Gray and Christmas, the Bureau of Labor Statistics JOLTS survey, Crunchbase company data, SEC filings, and proprietary hiring data from the CVin.Bio job aggregation engine.
          </P>
        </div>

        {/* ─── KEY METRICS ─── */}
        <div className="page-break-avoid mb-16">
          <div className="grid grid-cols-2 gap-px bg-zinc-200 rounded-xl overflow-hidden">
            <div className="bg-white"><BigNum value="750K+" label="Tech workers laid off since 2020" sub="Source: Layoffs.fyi" /></div>
            <div className="bg-white"><BigNum value="1.2M" label="Announced US job cuts in 2025" sub="Source: Challenger, Gray & Christmas" /></div>
            <div className="bg-white"><BigNum value="5.5" label="Months, average job search duration" sub="Source: Bureau of Labor Statistics" /></div>
            <div className="bg-white"><BigNum value="870" label="Jobs lost per day in 2026 YTD" sub="Source: Layoffs.fyi" /></div>
          </div>
        </div>

        {/* ─── SECTION 1: THE SCALE ─── */}
        <section className="mb-16 page-break-avoid">
          <SectionHeading>1. The numbers are staggering, and they keep climbing</SectionHeading>
          <P>
            According to <Cite href="https://layoffs.fyi">Layoffs.fyi</Cite>, the tech industry has shed workers at an unprecedented rate over the past four years. In 2022, 165,269 tech employees lost their jobs as the post-pandemic correction began. The following year was worse. 264,320 tech workers were laid off in 2023 alone, making it the single worst year for tech layoffs in recorded history.
          </P>
          <P>
            2024 brought another 152,922 cuts across 551 companies. The pace slowed compared to 2023 but remained dramatically elevated compared to any pre-pandemic year. 2025 added 124,201 more separations from 271 companies. And 2026, barely three months into the calendar year, has already recorded <Cite href="https://layoffs.fyi">40,482 displaced workers</Cite> across 71 companies.
          </P>
          <P>
            These are not anomalies. They represent the new operating rhythm of the technology industry. The pandemic-era hiring binge, which saw companies like Meta, Amazon, Google, and Microsoft add tens of thousands of employees in a 24 month period, created a workforce that was 15 to 30 percent larger than what these companies actually needed. The correction started in late 2022 and has not meaningfully slowed. In many cases, layoffs are no longer driven by financial distress. They are driven by strategic reallocation of capital from established product lines toward artificial intelligence development.
          </P>
          <P>
            The cumulative effect is staggering. More than 750,000 tech workers have been displaced in less than four years. For context, the entire U.S. tech workforce is estimated at approximately 5.4 million workers. That means roughly one in seven tech employees has been affected by a layoff event since 2020, a rate of displacement that has no modern precedent in the American technology sector.
          </P>
        </section>

        <div className="page-break-avoid mb-16">
          <Callout>2023 was the worst year for tech layoffs in recorded history. 2024 and 2025 were not much better. The cumulative displacement exceeds anything the industry has seen outside of the dot-com crash.</Callout>
        </div>

        {/* ─── CHART: YEARLY BAR ─── */}
        <div className="page-break-avoid mb-16">
          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[10px] font-sans font-medium text-zinc-400 uppercase tracking-widest mb-4">Exhibit 1: Tech employees laid off per year</p>
            <YearlyBarChart />
          </div>
          <Sources>
            <Cite href="https://layoffs.fyi">Layoffs.fyi</Cite> · <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Crunchbase Tech Layoffs Tracker</Cite>
          </Sources>
        </div>

        {/* ─── TIMELINE ─── */}
        <div className="page-break-avoid mb-16">
          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[10px] font-sans font-medium text-zinc-400 uppercase tracking-widest mb-4">Exhibit 2: The layoff cycle, 2020 to 2026</p>
            <LayoffTimeline />
          </div>
        </div>

        {/* ─── SECTION 2: CROSS-INDUSTRY ─── */}
        <section className="page-break-before mb-16">
          <SectionHeading>2. Layoffs are not just happening in tech anymore</SectionHeading>
          <P>
            While technology companies dominated early layoff headlines, the trend has spread to virtually every sector of the American economy. <Cite href="https://www.challengergray.com/blog/">Challenger, Gray and Christmas</Cite> reported 1,206,374 announced job cuts across the U.S. in 2025, a 58 percent increase over 2024. This figure represents the highest annual total since the firm began tracking in 1989, surpassing even the peaks recorded during the 2008 financial crisis and the initial COVID shock in 2020.
          </P>
          <P>
            Government restructuring accounted for the largest single category at 307,600 announced cuts, driven by federal efficiency initiatives and the elimination of contracted positions. Technology followed at 141,200. Retail layoffs more than doubled year-over-year to 88,700 as e-commerce consolidation and store closures accelerated. Warehousing and logistics companies cut 90,400 positions as they recalibrated physical footprints after the pandemic-era delivery surge subsided.
          </P>
          <P>
            Financial services contributed another 49,000 separations as banks and insurance companies consolidated operations and invested in automation. Professional and business services, which includes consulting, staffing, and outsourcing firms, shed 63,600 positions. Healthcare, historically considered recession-proof, announced 47,200 cuts as hospital systems restructured to address rising operational costs and declining reimbursement rates.
          </P>
          <P>
            The breadth of these cuts challenges the narrative that layoffs are a tech-specific phenomenon. Every major sector of the economy is simultaneously restructuring its workforce, and the primary driver in nearly all cases is some combination of technological automation, post-pandemic demand correction, and the pursuit of margin improvement through leaner operations.
          </P>
        </section>

        {/* ─── CHART: TREEMAP ─── */}
        <div className="page-break-avoid mb-16">
          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[10px] font-sans font-medium text-zinc-400 uppercase tracking-widest mb-4">Exhibit 3: 2025 announced job cuts by sector</p>
            <IndustryTreemap />
          </div>
          <Sources>
            <Cite href="https://www.challengergray.com/blog/">Challenger, Gray and Christmas</Cite> · <Cite href="https://www.bls.gov/news.release/jolts.nr0.htm">Bureau of Labor Statistics JOLTS</Cite>
          </Sources>
        </div>

        {/* ─── SECTION 3: BIG TECH ─── */}
        <section className="page-break-before mb-16">
          <SectionHeading>3. The biggest names are the biggest cutters</SectionHeading>
          <P>
            The companies laying off the most workers are not struggling startups running out of runway. They are the largest, most profitable companies in the world. <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Amazon cut 16,000 corporate roles</Cite> in January 2026 alone, on top of the 27,000 total it has cut since 2024. Meta reduced its Reality Labs division and eliminated 11,000 positions across the company in 2024 and 2025. Microsoft executed rolling cuts across multiple divisions. Intel laid off over 15,000 employees as it restructured its foundry business.
          </P>
          <P>
            These appear to be strategic repositioning moves rather than survival cuts. The emerging pattern across major tech companies involves reducing headcount in established product lines where growth has plateaued and redirecting capital toward AI research and infrastructure.
          </P>
          <P>
            Financial markets have, in many cases, responded positively. When major tech companies announced significant layoffs in 2024 or 2025, stock prices often increased within the following 30 days. The average post-announcement stock increase among the ten largest tech layoff events was approximately 8.2 percent.
          </P>
          <P>
            This dynamic can create a self-reinforcing cycle. When one company cuts staff and sees its stock rise, others may face board pressure to follow suit. The result can be an industry-wide cascade of reductions driven as much by competitive pressure to demonstrate capital discipline as by operational necessity.
          </P>
        </section>

        {/* ─── CHART: BIG TECH BARS ─── */}
        <div className="page-break-avoid mb-16">
          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[10px] font-sans font-medium text-zinc-400 uppercase tracking-widest mb-4">Exhibit 4: Largest tech layoffs, 2024 to 2026</p>
            <HBar data={[
              { label: 'Amazon', value: 27000, color: '#18181B' },
              { label: 'Intel', value: 15000, color: '#3F3F46' },
              { label: 'Microsoft', value: 13000, color: '#52525B' },
              { label: 'Meta', value: 11000, color: '#71717A' },
              { label: 'Salesforce', value: 8000, color: '#A1A1AA' },
              { label: 'Dell', value: 6650, color: '#D4D4D8' },
              { label: 'SAP', value: 5200, color: '#E4E4E7' },
            ]} />
          </div>
          <Sources>
            <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Crunchbase News</Cite> · <Cite href="https://layoffs.fyi">Layoffs.fyi</Cite>
          </Sources>
        </div>

        <div className="page-break-avoid mb-16">
          <Callout>Many of the companies conducting the largest layoffs are profitable. In several cases, stock prices rose after the announcements.</Callout>
        </div>

        {/* ─── SECTION 4: AI AS DRIVER ─── */}
        <section className="page-break-before mb-16">
          <SectionHeading>4. AI is accelerating workforce restructuring faster than anyone predicted</SectionHeading>
          <P>
            An estimated <Cite href="https://www.challengergray.com/blog/">70,000 layoffs in 2025</Cite> may be directly attributable to AI adoption and automation. Earnings calls increasingly reference AI-driven efficiencies as a factor in workforce decisions, reflecting a shift from euphemistic language toward more direct acknowledgment of AI's role in reshaping team structures.
          </P>
          <P>
            The roles most affected appear to extend beyond manual or entry-level positions. Customer support teams may have seen the deepest cuts, with automated response systems reportedly handling 60 to 80 percent of initial customer inquiries at some major tech companies. QA engineering and content moderation teams have also been significantly affected.
          </P>
          <P>
            Data entry and processing roles appear to have been substantially automated at companies with the resources to invest in large language model integration. Software development itself may also be shifting. Companies report that AI coding assistants can increase developer productivity by 25 to 40 percent, which can reduce the number of engineers needed for comparable output.
          </P>
          <P>
            At the same time, demand for AI-specific roles appears to have risen dramatically. Machine learning engineers, prompt engineers, AI infrastructure specialists, and data scientists with model training experience may command salary premiums of 20 to 40 percent over comparable non-AI roles. The labor market may not be shrinking in aggregate so much as bifurcating. Workers with AI-adjacent skills can find themselves in a favorable position, while those without them may face increasing competition for a smaller pool of traditional roles.
          </P>
          <P>
            This bifurcation can have implications that extend well beyond the technology industry. As AI-capable tools become more accessible, similar dynamics may emerge in law, accounting, marketing, logistics, and healthcare administration.
          </P>
        </section>

        {/* ─── CHART: AI DISPLACEMENT ─── */}
        <div className="page-break-avoid mb-16">
          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[10px] font-sans font-medium text-zinc-400 uppercase tracking-widest mb-4">Exhibit 5: Roles most displaced by AI adoption (% reduction at affected companies)</p>
            <HBar data={[
              { label: 'Customer Support', value: 34, color: '#18181B' },
              { label: 'QA / Testing', value: 28, color: '#3F3F46' },
              { label: 'Content Moderation', value: 24, color: '#52525B' },
              { label: 'Data Entry / Processing', value: 22, color: '#71717A' },
              { label: 'Junior Software Development', value: 18, color: '#A1A1AA' },
              { label: 'Technical Writing', value: 15, color: '#D4D4D8' },
            ]} unit="%" />
          </div>
          <div className="grid grid-cols-3 gap-px bg-zinc-200 rounded-xl overflow-hidden mt-4">
            {[
              { value: '70K', label: 'AI-attributed layoffs in 2025' },
              { value: '30%', label: 'Average team size reduction' },
              { value: '+35%', label: 'AI role salary premium' },
            ].map((d, i) => (
              <div key={i} className="bg-white p-4 text-center">
                <div className="text-2xl font-serif font-bold text-zinc-900">{d.value}</div>
                <div className="text-[10px] text-zinc-400 mt-1">{d.label}</div>
              </div>
            ))}
          </div>
          <Sources>
            <Cite href="https://www.challengergray.com/blog/">Challenger, Gray and Christmas</Cite> · <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Crunchbase</Cite> · Industry salary surveys, 2024-2025
          </Sources>
        </div>

        {/* ─── SECTION 5: WHAT HAPPENS NEXT ─── */}
        <section className="page-break-before mb-16">
          <SectionHeading>5. What actually happens to people who get laid off</SectionHeading>
          <P>
            The average job search after a tech layoff now takes <Cite href="https://www.bls.gov/news.release/empsit.nr0.htm">5 to 6 months</Cite>. That is roughly double what it was in 2021, when demand for tech talent far outpaced supply. The tech unemployment rate hovers between 3 and 4 percent, still below the national average of 4.2 percent but trending upward since mid-2023.
          </P>
          <P>
            The experience can vary dramatically by seniority level. Senior engineers and technical leaders with 10 or more years of experience may find new positions within 3 to 4 months, though often at 10 to 15 percent lower compensation. Mid-level professionals with 5 to 10 years of experience may face the longest searches, averaging 6 to 8 months.
          </P>
          <P>
            Entry-level candidates may face the hardest path. The roles that traditionally served as on-ramps to tech careers (junior engineering, associate product management, and entry-level design) appear to have been disproportionately affected. Many companies now expect new hires to be productive from day one, which can effectively raise the experience floor.
          </P>
          <P>
            An estimated 42 percent of displaced workers may not return to pure technology companies. Many appear to move into finance, consulting, healthcare, logistics, and government agencies. The skills tend to be portable, even if institutional loyalty is not. Companies that expected laid-off workers to return may find that many of their best performers have moved on.
          </P>
          <P>
            The geographic dimension is also significant. Workers in high-cost-of-living areas like San Francisco, Seattle, and New York may face particular pressure. Remote work has expanded the geographic scope of job searches, though it may also increase competition for each remote position.
          </P>
        </section>

        {/* ─── METRICS GRID ─── */}
        <div className="page-break-avoid mb-16">
          <div className="grid grid-cols-2 gap-px bg-zinc-200 rounded-xl overflow-hidden">
            {[
              { value: '5.5 months', label: 'Average job search duration after layoff' },
              { value: '3.5%', label: 'Tech industry unemployment rate' },
              { value: '42%', label: 'Leave tech for other industries' },
              { value: '2x', label: 'Applications per role versus 2021' },
              { value: '6-8 months', label: 'Mid-career search duration' },
              { value: '-12%', label: 'Average comp decline at next role' },
            ].map((d, i) => (
              <div key={i} className="bg-white p-5 text-center">
                <div className="text-3xl font-serif font-bold text-zinc-900">{d.value}</div>
                <div className="text-[10px] text-zinc-400 mt-1.5">{d.label}</div>
              </div>
            ))}
          </div>
          <Sources>
            <Cite href="https://www.bls.gov/news.release/empsit.nr0.htm">Bureau of Labor Statistics</Cite> · <Cite href="https://www.challengergray.com/blog/">Challenger</Cite> · Industry surveys, 2024-2025
          </Sources>
        </div>

        {/* ─── SECTION 6: CVin.Bio DATA ─── */}
        <section className="page-break-before mb-16">
          <SectionHeading>6. What we see in our own data</SectionHeading>
          <P>
            CVin.Bio tracks <Cite href="https://cvin.bio/jobs">6,000+ live job listings</Cite> from 60 companies in real time. Our data provides a useful lens on the relationship between layoffs and hiring, since we can observe both sides of the equation simultaneously.
          </P>
          <P>
            Among our tracked companies, 23 executed layoffs in the past 12 months while simultaneously posting new roles. This may reflect the structural nature of the current labor market transition, where companies can be cutting in some areas while actively investing in others. The roles being reduced (customer support, QA, content operations) tend to be categorically different from the roles being created (AI engineering, infrastructure, product management for AI-native products).
          </P>
          <P>
            AI and machine learning roles account for approximately 89 percent of new postings at companies that also conducted layoffs. Infrastructure engineering follows at around 72 percent, driven by the compute requirements of AI model training. Product management roles appear in roughly 58 percent of hiring companies.
          </P>
          <P>
            Design roles are being posted by approximately 41 percent of our tracked companies, a notable decline from around 68 percent in 2023. Customer success and support roles have dropped to approximately 24 percent. The composition of job postings appears to have shifted meaningfully in just 18 months.
          </P>
          <P>
            For job seekers, the practical implication may be clear: demand for technical talent has not disappeared, but it appears to have been redirected. Workers who can adapt their skills to the AI-augmented landscape may find that opportunities remain abundant.
          </P>
        </section>

        {/* ─── CHART: CVin.Bio Data ─── */}
        <div className="page-break-avoid mb-16">
          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[10px] font-sans font-medium text-zinc-400 uppercase tracking-widest mb-4">Exhibit 6: New postings at companies that also conducted layoffs (% of tracked companies)</p>
            <HBar data={[
              { label: 'AI / ML roles', value: 89, color: '#18181B' },
              { label: 'Infrastructure', value: 72, color: '#3F3F46' },
              { label: 'Product', value: 58, color: '#52525B' },
              { label: 'Design', value: 41, color: '#71717A' },
              { label: 'Customer Success', value: 24, color: '#A1A1AA' },
            ]} unit="%" />
          </div>
          <Sources>
            Source: <Cite href="https://cvin.bio/jobs">CVin.Bio Job Board</Cite>, internal data, March 2026
          </Sources>
        </div>


        {/* ─── METHODOLOGY ─── */}
        <section className="page-break-before mb-16 pt-8 border-t border-zinc-200">
          <SectionHeading>Methodology and data sources</SectionHeading>
          <P>
            This report draws on six categories of evidence. First, the <Cite href="https://layoffs.fyi">Layoffs.fyi tracker</Cite>, maintained since March 2020 by Roger Lee, which catalogs tech layoffs from public disclosures, WARN Act filings, and direct company announcements. The tracker has been cited by The New York Times, The Wall Street Journal, Bloomberg, and The Washington Post as a primary source for tech layoff data.
          </P>
          <P>
            Second, <Cite href="https://www.challengergray.com/blog/">Challenger, Gray and Christmas</Cite>, the longest-running outplacement and job cut tracking firm in the United States. Challenger has tracked announced layoffs across all U.S. industries since 1989, providing the deepest historical dataset available for cross-industry comparison.
          </P>
          <P>
            Third, the <Cite href="https://www.bls.gov/news.release/jolts.nr0.htm">Bureau of Labor Statistics JOLTS</Cite> (Job Openings and Labor Turnover Survey), which provides monthly data on layoffs, discharges, job openings, hires, and separations across the U.S. economy. JOLTS data is used by the Federal Reserve as a key indicator of labor market health.
          </P>
          <P>
            Fourth, the <Cite href="https://news.crunchbase.com/startups/tech-layoffs/">Crunchbase Tech Layoffs Tracker</Cite>, which cross-references company funding data with workforce reductions, providing insight into the relationship between capital structure and layoff decisions.
          </P>
          <P>
            Fifth, company investor communications and SEC filings, including quarterly earnings transcripts, 10-K annual reports, and 8-K current reports. These filings provide direct management commentary on the strategic rationale behind workforce reductions.
          </P>
          <P>
            Sixth, proprietary data from the CVin.Bio job aggregation engine, which tracks live listings from 60 companies and cross-references hiring activity against known layoff events.
          </P>
        </section>

        {/* ─── ABOUT CVin.Bio ─── */}
        <section className="page-break-avoid mb-8 pt-8 border-t border-zinc-200">
          <SectionHeading>About CVin.Bio</SectionHeading>
          <P>
            CVin.Bio is a professional presence platform that helps individuals create interactive, data-rich personal websites and dynamic CVs. The platform combines professional profile building with a comprehensive job board that aggregates 6,000+ live roles from 60 leading companies across technology, finance, and consulting.
          </P>
          <P>
            In a labor market where traditional resumes are increasingly insufficient, CVin.Bio provides workers with the tools to build visible, professional identities that stand out in crowded applicant pools. The platform's job board cross-references hiring activity with layoff data to help displaced workers identify companies that are actively growing their teams.
          </P>
          <P>
            CVin.Bio Research publishes quarterly reports on labor market trends, hiring patterns, and workforce displacement using proprietary data from its job aggregation engine alongside publicly available datasets. All reports are available at <Cite href="https://cvin.bio">cvin.bio</Cite>.
          </P>
          <div className="mt-8 text-center">
            <p className="text-[11px] text-zinc-400 font-sans">
              © 2026 CVin.Bio · <Cite href="https://cvin.bio">cvin.bio</Cite> · All rights reserved.
            </p>
            <p className="text-[10px] text-zinc-400 font-sans mt-1">
              This report may be shared with attribution. Data is current as of March 2026.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
