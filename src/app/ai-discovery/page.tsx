import type { Metadata } from 'next';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Discovery',
  description: 'CVin.Bio profiles are built for AI agent discovery. Structured data, schema.org markup, MCP integration, and explicit crawler access make your profile readable by every major AI system.',
};

/* ─── BESPOKE SVG: FLOW DIAGRAM ─── */
function AgentFlowDiagram() {
  return (
    <svg viewBox="0 0 500 280" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* CV Upload */}
      <rect x="10" y="110" width="100" height="60" rx="8" className="fill-zinc-200 dark:fill-zinc-800" />
      <text x="60" y="136" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[11px] font-bold" fontFamily="inherit">PDF / DOCX</text>
      <text x="60" y="152" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">Your CV</text>

      {/* Arrow 1 */}
      <line x1="115" y1="140" x2="155" y2="140" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

      {/* CVin.Bio Engine */}
      <rect x="160" y="100" width="120" height="80" rx="10" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="220" y="132" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[11px] font-bold" fontFamily="inherit">CVin.Bio</text>
      <text x="220" y="148" textAnchor="middle" className="fill-white/60 dark:fill-zinc-900/60 text-[9px]" fontFamily="inherit">Structured JSON</text>
      <text x="220" y="162" textAnchor="middle" className="fill-white/60 dark:fill-zinc-900/60 text-[9px]" fontFamily="inherit">Schema.org</text>

      {/* Arrow 2 - fan out */}
      <line x1="285" y1="125" x2="340" y2="55" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" />
      <line x1="285" y1="140" x2="340" y2="140" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" />
      <line x1="285" y1="155" x2="340" y2="225" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" />

      {/* AI Agents */}
      <rect x="345" y="30" width="140" height="50" rx="8" className="fill-zinc-100 dark:fill-zinc-800/60" stroke="#71717A" strokeWidth="0.5" />
      <text x="415" y="52" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-bold" fontFamily="inherit">AI Assistants</text>
      <text x="415" y="66" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">ChatGPT, Claude, Perplexity</text>

      <rect x="345" y="115" width="140" height="50" rx="8" className="fill-zinc-100 dark:fill-zinc-800/60" stroke="#71717A" strokeWidth="0.5" />
      <text x="415" y="137" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-bold" fontFamily="inherit">Search Engines</text>
      <text x="415" y="151" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">Google AI, Bing Copilot</text>

      <rect x="345" y="200" width="140" height="50" rx="8" className="fill-zinc-100 dark:fill-zinc-800/60" stroke="#71717A" strokeWidth="0.5" />
      <text x="415" y="222" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-bold" fontFamily="inherit">Hiring Tools</text>
      <text x="415" y="236" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">Recruiter bots, ATS agents</text>

      {/* Arrowhead marker */}
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" className="fill-zinc-400 dark:fill-zinc-600" />
        </marker>
      </defs>

      <text x="250" y="272" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]" fontFamily="inherit">Your CV becomes a structured endpoint that AI systems consume natively</text>
    </svg>
  );
}

/* ─── BESPOKE SVG: PDF vs LINK COMPARISON ─── */
function FormatComparison() {
  const rows = [
    { label: 'Machine readability', pdf: 15, link: 95 },
    { label: 'Schema.org metadata', pdf: 0, link: 100 },
    { label: 'AI agent accessibility', pdf: 10, link: 95 },
    { label: 'Real-time updates', pdf: 0, link: 100 },
    { label: 'Analytics / tracking', pdf: 0, link: 90 },
    { label: 'ATS bypass rate', pdf: 0, link: 100 },
  ];
  const barH = 18;
  const gap = 32;
  const chartH = rows.length * (barH + gap) + 20;

  return (
    <svg viewBox={`0 0 460 ${chartH}`} fill="none" className="w-full h-auto" aria-hidden="true">
      {rows.map((r, i) => {
        const y = 15 + i * (barH + gap);
        return (
          <g key={i}>
            <text x="0" y={y - 6} className="fill-zinc-600 dark:fill-zinc-400 text-[10px]" fontFamily="inherit">{r.label}</text>
            {/* PDF bar */}
            <rect x="0" y={y} width={Math.max(r.pdf * 3.2, 2)} height={barH / 2 - 1} rx="2" className="fill-zinc-300 dark:fill-zinc-700" />
            <text x={Math.max(r.pdf * 3.2, 2) + 6} y={y + 7} className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">PDF {r.pdf}%</text>
            {/* Link bar */}
            <rect x="0" y={y + barH / 2 + 1} width={r.link * 3.2} height={barH / 2 - 1} rx="2" className="fill-zinc-900 dark:fill-zinc-100" />
            <text x={r.link * 3.2 + 6} y={y + barH - 1} className="fill-zinc-700 dark:fill-zinc-300 text-[8px] font-bold" fontFamily="inherit">Link {r.link}%</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── BESPOKE SVG: TECH STACK ARCHITECTURE ─── */
function TechStackDiagram() {
  return (
    <svg viewBox="0 0 460 200" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Center: Profile */}
      <rect x="175" y="70" width="110" height="60" rx="10" className="fill-zinc-900 dark:fill-zinc-100" />
      <text x="230" y="96" textAnchor="middle" className="fill-white dark:fill-zinc-900 text-[12px] font-bold" fontFamily="inherit">Your Profile</text>
      <text x="230" y="112" textAnchor="middle" className="fill-white/60 dark:fill-zinc-900/50 text-[9px]" fontFamily="inherit">cvin.bio/you</text>

      {/* Top: Schema.org */}
      <rect x="165" y="2" width="130" height="40" rx="6" className="fill-zinc-100 dark:fill-zinc-800/60" stroke="#71717A" strokeWidth="0.5" />
      <text x="230" y="18" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[9px] font-bold" fontFamily="inherit">schema.org/Person</text>
      <text x="230" y="32" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">JSON-LD embedded in every page</text>
      <line x1="230" y1="42" x2="230" y2="70" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="4 3" />

      {/* Left: llms.txt */}
      <rect x="8" y="75" width="120" height="50" rx="6" className="fill-zinc-100 dark:fill-zinc-800/60" stroke="#71717A" strokeWidth="0.5" />
      <text x="68" y="96" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[9px] font-bold" fontFamily="inherit">llms.txt</text>
      <text x="68" y="110" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">Profile index for LLMs</text>
      <line x1="128" y1="100" x2="175" y2="100" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="4 3" />

      {/* Right: MCP */}
      <rect x="332" y="75" width="120" height="50" rx="6" className="fill-zinc-100 dark:fill-zinc-800/60" stroke="#71717A" strokeWidth="0.5" />
      <text x="392" y="96" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[9px] font-bold" fontFamily="inherit">MCP Server</text>
      <text x="392" y="110" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">Agent query interface</text>
      <line x1="285" y1="100" x2="332" y2="100" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="4 3" />

      {/* Bottom: robots.txt */}
      <rect x="165" y="158" width="130" height="40" rx="6" className="fill-zinc-100 dark:fill-zinc-800/60" stroke="#71717A" strokeWidth="0.5" />
      <text x="230" y="175" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[9px] font-bold" fontFamily="inherit">robots.txt</text>
      <text x="230" y="189" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8px]" fontFamily="inherit">9 AI crawlers explicitly allowed</text>
      <line x1="230" y1="130" x2="230" y2="158" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  );
}

/* ─── BIG NUMBER ─── */
function BigNum({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl font-serif font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">{value}</div>
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">{label}</div>
    </div>
  );
}

/* ─── CALLOUT ─── */
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-zinc-900 dark:border-zinc-100 pl-6 py-2 my-10">
      <p className="text-lg sm:text-xl font-serif text-zinc-800 dark:text-zinc-200 leading-relaxed italic">{children}</p>
    </blockquote>
  );
}

export default function AIDiscoveryPage() {
  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200 flex flex-col">
      <Header />
      <main className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24 lg:py-32 pb-32 flex-1">

        {/* ─── HERO ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">CVin.Bio / AI Infrastructure</p>
            <h1 className="text-4xl sm:text-[3.4rem] font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 leading-[1.12]">
              Built for<br />AI agents
            </h1>
            <p className="text-[17px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
              Every CVin.Bio profile is engineered to be discovered, read, and matched by AI systems. Not just indexed by search engines. Natively consumable by AI assistants, recruiter bots, and automated hiring tools.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 text-center">How AI agents find you</p>
              <AgentFlowDiagram />
            </div>
          </div>
        </div>

        {/* ─── BIG NUMBERS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl overflow-hidden mb-28">
          {[
            { value: '4', label: 'Discovery layers\n(Schema, MCP, llms.txt, crawlers)' },
            { value: '100+', label: 'Crawlers\nexplicitly allowed' },
            { value: '24/7', label: 'Your profile\nworks passively' },
            { value: '0', label: 'Login walls\nfor AI agents' },
          ].map((d, i) => (
            <div key={i} className="bg-[#fafafa] dark:bg-black p-8 sm:p-10">
              <BigNum {...d} />
            </div>
          ))}
        </div>

        {/* ─── SECTION 1: THE PROBLEM ─── */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">PDFs are invisible to AI</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                A PDF is a print format trapped in a digital world. When an AI agent encounters a PDF, it has to run OCR, guess at formatting, parse tables, and hope the layout engine cooperated. Most agents skip them entirely.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                A CVin.Bio profile is a structured webpage with machine-readable metadata baked into the HTML. An AI agent reads it the same way it reads any web page, except every data point is explicitly labeled and categorized.
              </p>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85]">
                Skills, job titles, companies, dates, degrees, credentials. All structured as JSON-LD. No parsing required. No guessing. No lossy extraction.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">PDF vs Live link readability</p>
              <FormatComparison />
            </div>
          </div>

          <Callout>ATS read PDFs. AI agents read links. If your CV is still a file, the next wave of hiring tools cannot see you.</Callout>
        </section>

        {/* ─── SECTION 2: FOUR LAYERS ─── */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Four layers of AI discoverability</h2>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-8 max-w-2xl">
            We do not rely on a single mechanism. Every CVin.Bio profile is discoverable through four independent systems, each designed for a different type of AI consumer.
          </p>

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 mb-8">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 text-center">Architecture</p>
            <TechStackDiagram />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">1</div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Schema.org / JSON-LD</h3>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
                Every profile embeds a complete <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Person</span> schema with <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">hasOccupation</span>, <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">hasCredential</span>, <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">alumniOf</span>, <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">knowsAbout</span>, and <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">sameAs</span>. Work history includes employer, title, dates, and location. Education includes degree type and institution. This is the universal standard that Google, Bing, and AI assistants already understand.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">2</div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">llms.txt</h3>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
                A dynamically generated index at <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">/llms.txt</span> lists every public profile with name, skills, and summary. Updated hourly. Functions like <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">sitemap.xml</span> but optimized for LLM consumption. Any AI system can fetch this single file and discover the entire candidate database.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">3</div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Model Context Protocol</h3>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
                Our MCP server exposes two tools for AI agents. <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">search_candidates</span> searches the database by skill, location, or job title. <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">get_profile</span> fetches a full structured profile by username. Any MCP-compatible AI assistant can query CVin.Bio directly.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">4</div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Explicit crawler access</h3>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-[1.8]">
                Most platforms block AI crawlers. We do the opposite. Over 100 crawlers are explicitly allowed in <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">robots.txt</span> across AI, search, social, SEO, academic, and content categories. No rate limiting. No authentication required for public profiles. Full <span className="font-mono text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">max-snippet:-1</span> meta directives allow unlimited content indexing.
              </p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: WHAT THIS MEANS ─── */}
        <section className="mb-28">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">What this means for you</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20 text-center">
              <div className="text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-3">Passive</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">Your profile gets discovered by AI agents even when you are not actively job searching. No applications needed.</p>
            </div>
            <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20 text-center">
              <div className="text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-3">Instant</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">AI agents parse your profile in milliseconds. No OCR. No regex. No keyword guessing. Structured data goes straight to the match engine.</p>
            </div>
            <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/20 text-center">
              <div className="text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-3">Current</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">Update your profile once. Every AI agent sees the latest version immediately. No re-uploading. No version control nightmares.</p>
            </div>
          </div>

          <Callout>Your profile is not a static file sitting in a folder. It is a live endpoint that AI systems query in real time.</Callout>
        </section>

        {/* ─── SECTION 4: TRANSPARENCY ─── */}
        <section className="mb-28 bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-8 sm:p-10">
          <h2 className="text-lg font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">Full transparency</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              Whatever you add to your profile is accessible to AI systems. This is by design. The entire point of CVin.Bio is to make you discoverable. If you do not want something indexed by an AI agent, do not add it to your profile.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-[1.85]">
              You can delete your account and all associated data at any time. Private account data (email address, authentication credentials) is never exposed to external systems. Read our <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">full terms</Link> for details.
            </p>
          </div>
        </section>

        {/* ─── DEVELOPER INTEGRATION ─── */}
        <section className="mb-28" id="developers">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">For developers and AI agents</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5">Integration endpoints</h2>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-[1.85] mb-5">
                If you are building a hiring tool, recruiter platform, or AI agent that needs access to professional candidate data, CVin.Bio provides three public integration points. No API key required for read-only access to public profiles.
              </p>

              <div className="space-y-6">
                <div className="rounded-lg border bg-zinc-950 text-zinc-300 p-5 overflow-x-auto">
                  <p className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">Profile index for LLMs</p>
                  <pre className="text-sm font-mono">GET https://cvin.bio/llms.txt</pre>
                  <p className="text-[11px] text-zinc-500 mt-2">Returns all public profiles with name, skills, and summary. Plain text. Updated hourly. Cache: 1h with stale-while-revalidate.</p>
                </div>

                <div className="rounded-lg border bg-zinc-950 text-zinc-300 p-5 overflow-x-auto">
                  <p className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">Structured profile data (JSON-LD)</p>
                  <pre className="text-sm font-mono">GET https://cvin.bio/&#123;username&#125;</pre>
                  <p className="text-[11px] text-zinc-500 mt-3 mb-3">Every profile page contains a JSON-LD script tag. Extract the schema.org/Person object from the HTML.</p>
                  <pre className="text-xs font-mono leading-relaxed text-zinc-400">{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jane Smith",
  "url": "https://cvin.bio/jane",
  "jobTitle": "Senior Engineer",
  "worksFor": {
    "@type": "Organization",
    "name": "Stripe"
  },
  "knowsAbout": ["React", "TypeScript", "Node.js"],
  "hasOccupation": [...],
  "hasCredential": [...],
  "alumniOf": [...],
  "sameAs": [...]
}
</script>`}</pre>
                </div>

                <div className="rounded-lg border bg-zinc-950 text-zinc-300 p-5 overflow-x-auto">
                  <p className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">MCP tools (Model Context Protocol)</p>
                  <pre className="text-sm font-mono text-emerald-400">search_candidates(query, limit)</pre>
                  <p className="text-[11px] text-zinc-500 mt-1 mb-3">Search by skill, location, job title, or keyword. Returns up to 20 matching profiles with full work history and education.</p>
                  <pre className="text-sm font-mono text-emerald-400">get_profile(username)</pre>
                  <p className="text-[11px] text-zinc-500 mt-1 mb-3">Fetch a complete profile by slug. Returns structured data including custom sections and credentials.</p>
                  <p className="text-[11px] text-zinc-500 border-t border-zinc-800 pt-3">Available via stdio transport. Contact <span className="text-zinc-300">hi@cvin.bio</span> for MCP server access and configuration.</p>
                </div>

                <div className="rounded-lg border bg-zinc-950 text-zinc-300 p-5 overflow-x-auto">
                  <p className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">XML Sitemap</p>
                  <pre className="text-sm font-mono">GET https://cvin.bio/sitemap.xml</pre>
                  <p className="text-[11px] text-zinc-500 mt-2">All profile URLs with lastmod timestamps. Includes static pages, blog posts, and dynamic user profiles. Updated on every build.</p>
                </div>

                <div className="rounded-lg border bg-zinc-950 text-zinc-300 p-5 overflow-x-auto">
                  <p className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">Robots.txt</p>
                  <pre className="text-sm font-mono">GET https://cvin.bio/robots.txt</pre>
                  <p className="text-[11px] text-zinc-500 mt-2">100+ user agents explicitly allowed. Public profiles, blog, and reports are fully crawlable. Editor, API, and admin routes are disallowed.</p>
                </div>

                <div className="rounded-lg border bg-zinc-950 text-zinc-300 p-5 overflow-x-auto">
                  <p className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">Response headers</p>
                  <pre className="text-xs font-mono leading-relaxed text-zinc-400">{`Content-Type: text/html; charset=utf-8
X-Robots-Tag: index, follow,
  max-snippet:-1,
  max-image-preview:large,
  max-video-preview:-1
Cache-Control: public, s-maxage=3600`}</pre>
                  <p className="text-[11px] text-zinc-500 mt-2">No content restrictions. AI systems can use unlimited text snippets and full-size image previews.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 rounded-2xl p-6 sticky top-8">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">100+ crawlers allowed</p>
                {[
                  { category: 'AI Agents', agents: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'cohere-ai', 'AI2Bot', 'Diffbot', 'YouBot', 'Bytespider', 'CCBot', 'Neevabot', 'iaskspider', 'PanguBot', 'Timpibot'] },
                  { category: 'Search Engines', agents: ['Googlebot', 'GoogleOther', 'Google-Extended', 'Bingbot', 'DuckDuckBot', 'YandexBot', 'Baiduspider', 'Slurp', 'Sogou', 'PetalBot', 'Qwantify', 'NaverBot', 'SeznamBot', 'Mojeek'] },
                  { category: 'Social & Preview', agents: ['facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'Slackbot', 'WhatsApp', 'TelegramBot', 'Discordbot', 'Pinterestbot', 'redditbot', 'Embedly'] },
                  { category: 'Apple & Amazon', agents: ['Applebot', 'Applebot-Extended', 'Amazonbot'] },
                  { category: 'SEO & Analytics', agents: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'DataForSeoBot', 'rogerbot'] },
                  { category: 'Archive & Research', agents: ['archive.org_bot', 'HuggingFaceBot', 'ScholarBot', 'ia_archiver'] },
                  { category: 'Feed & Content', agents: ['Feedly', 'Feedspot', 'NewsBlur'] },
                ].map((group) => (
                  <div key={group.category} className="mb-4">
                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{group.category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.agents.map((agent) => (
                        <span key={agent} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3">Full access to public profile pages. No rate limiting. No authentication.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <div className="p-10 bg-zinc-900 dark:bg-zinc-100 rounded-2xl text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-2">ATS filtered PDFs. AI agents read links.</p>
          <p className="text-lg font-serif font-semibold text-white dark:text-zinc-900 mb-5">Make yours discoverable.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Create your profile
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

      </main>
      <MicroFooter />
    </div>
  );
}
