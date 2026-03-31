import type { Metadata } from 'next';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Discovery',
  description: 'CVin.Bio profiles are built to be discovered by AI agents, AI-powered search engines, and automated hiring tools. Your profile works for you even when you are not looking.',
};

export default function AIDiscoveryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-16 md:py-24">

        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">How it works</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12] mb-4">
          Built for AI agents
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-16 max-w-xl">
          Your profile is structured so AI systems can read it, index it, and match you to jobs. Not just humans. Not just search engines. AI agents.
        </p>

        {/* How */}
        <div className="space-y-16 mb-20">

          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background font-bold text-xs">1</div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Your data is structured from day one</h2>
            </div>
            <p className="text-[15px] text-muted-foreground leading-[1.85] pl-10">
              When you upload a CV, we extract every detail into clean, structured data. Not a PDF blob. Not a wall of text. Structured fields that any machine can parse instantly. Skills, job titles, companies, dates, education, credentials. All categorized.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background font-bold text-xs">2</div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">AI agents can read your profile</h2>
            </div>
            <p className="text-[15px] text-muted-foreground leading-[1.85] pl-10">
              Every CVin.Bio profile is embedded with schema.org markup that AI systems understand natively. When an AI assistant, recruiter bot, or search agent looks for candidates, your profile speaks their language. A PDF does not.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background font-bold text-xs">3</div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">We welcome every major AI crawler</h2>
            </div>
            <p className="text-[15px] text-muted-foreground leading-[1.85] pl-10">
              Most platforms block AI systems from indexing their content. We do the opposite. ChatGPT, Claude, Perplexity, Google AI, and others are explicitly allowed to discover and index CVin.Bio profiles. Your profile works for you 24/7.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background font-bold text-xs">4</div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Agents can query our database directly</h2>
            </div>
            <p className="text-[15px] text-muted-foreground leading-[1.85] pl-10">
              We built an API that lets AI agents search our candidate database using the Model Context Protocol. When someone asks an AI assistant to &ldquo;find React developers in London,&rdquo; your profile can surface in the results. No application needed. No ATS. Just a match.
            </p>
          </section>

        </div>

        {/* What this means */}
        <div className="border-t pt-12 mb-16">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-4">What this means for you</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border bg-muted/30">
              <p className="text-sm font-bold text-foreground mb-1">Passive discovery</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Your profile gets found even when you are not actively searching.</p>
            </div>
            <div className="p-5 rounded-xl border bg-muted/30">
              <p className="text-sm font-bold text-foreground mb-1">No ATS filtering</p>
              <p className="text-xs text-muted-foreground leading-relaxed">AI agents read structured data, not keyword-scanned PDFs.</p>
            </div>
            <div className="p-5 rounded-xl border bg-muted/30">
              <p className="text-sm font-bold text-foreground mb-1">Always current</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Update your profile once. Every agent sees the latest version.</p>
            </div>
          </div>
        </div>

        {/* Transparency */}
        <div className="border-t pt-12 mb-16">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-4">Full transparency</h2>
          <p className="text-[15px] text-muted-foreground leading-[1.85]">
            Whatever you add to your profile is accessible to AI systems. If you do not want something indexed, do not add it. You can delete your account and all data at any time. Read our <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">terms</Link> for details.
          </p>
        </div>

        {/* CTA */}
        <div className="p-10 bg-foreground rounded-2xl text-center mb-20">
          <p className="text-sm text-muted-foreground mb-2">ATS filtered PDFs. AI agents read links.</p>
          <p className="text-lg font-semibold text-background mb-5">Make yours discoverable.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground bg-background hover:bg-muted rounded-lg transition-colors"
          >
            Create your profile
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

        {/* Developer Documentation */}
        <div className="border-t pt-16" id="developers">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-6">For developers and AI agents</p>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-4">Integration guide</h2>
          <p className="text-[15px] text-muted-foreground leading-[1.85] mb-12 max-w-xl">
            Build on top of CVin.Bio. Connect your AI agent, recruiter tool, or hiring platform to our candidate database.
          </p>

          <div className="space-y-12">

            {/* MCP */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">Model Context Protocol (MCP)</h3>
              <p className="text-[15px] text-muted-foreground leading-[1.85] mb-4">
                Our MCP server lets AI assistants search and retrieve candidate profiles directly. Two tools are available.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg border bg-muted/20">
                  <p className="text-sm font-bold text-foreground font-mono mb-1">search_candidates</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Search by skill, location, job title, or keyword. Returns matching profiles with work history and education.</p>
                </div>
                <div className="p-4 rounded-lg border bg-muted/20">
                  <p className="text-sm font-bold text-foreground font-mono mb-1">get_profile</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Fetch a full profile by username. Returns skills, work history, education, credentials, and custom sections.</p>
                </div>
              </div>
              <div className="rounded-lg border bg-zinc-950 text-zinc-300 p-5 overflow-x-auto">
                <p className="text-[11px] text-zinc-500 mb-3 font-mono">Claude Desktop config (~/.claude/claude_desktop_config.json)</p>
                <pre className="text-xs leading-relaxed font-mono">{`{
  "mcpServers": {
    "cvinbio": {
      "command": "npx",
      "args": ["tsx", "mcp-server.ts"],
      "env": {
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_KEY": "your_service_role_key"
      }
    }
  }
}`}</pre>
              </div>
            </section>

            {/* llms.txt */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">llms.txt</h3>
              <p className="text-[15px] text-muted-foreground leading-[1.85] mb-3">
                A machine-readable index of all public profiles, updated hourly. Like <span className="font-mono text-sm">sitemap.xml</span> but designed for LLMs and AI agents.
              </p>
              <div className="rounded-lg border bg-zinc-950 text-zinc-300 p-4">
                <pre className="text-xs font-mono">GET https://cvin.bio/llms.txt</pre>
              </div>
            </section>

            {/* Schema.org */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">Structured data</h3>
              <p className="text-[15px] text-muted-foreground leading-[1.85]">
                Every profile page embeds a full <span className="font-mono text-sm">schema.org/Person</span> JSON-LD block with <span className="font-mono text-sm">hasOccupation</span>, <span className="font-mono text-sm">hasCredential</span>, <span className="font-mono text-sm">alumniOf</span>, <span className="font-mono text-sm">knowsAbout</span>, and <span className="font-mono text-sm">sameAs</span> properties. Standard web scraping of any profile URL returns machine-parseable structured data without authentication.
              </p>
            </section>

            {/* Crawling */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">Crawler access</h3>
              <p className="text-[15px] text-muted-foreground leading-[1.85]">
                GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, GoogleOther, Applebot-Extended, Meta-ExternalAgent, and cohere-ai are explicitly allowed in <span className="font-mono text-sm">robots.txt</span>. No rate limiting on public profile pages.
              </p>
            </section>

          </div>
        </div>

      </main>
      <MicroFooter />
    </div>
  );
}
