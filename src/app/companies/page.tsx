import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import Link from 'next/link';
import { Building2, Briefcase } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { normalizeLocation } from '@/lib/normalize-location';
import type { Metadata } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600; // ISR: rebuild every 1 hour (heavy page)

export const metadata: Metadata = {
  title: 'Companies Hiring Now | CVin.Bio',
  description: 'Browse all companies actively hiring on CVin.Bio. Discover open roles at top tech companies including Stripe, Anthropic, Figma, GitLab, and more.',
  alternates: { canonical: 'https://cvin.bio/companies' },
  openGraph: {
    type: 'website',
    url: 'https://cvin.bio/companies',
    title: 'Companies Hiring Now | CVin.Bio',
    description: 'Browse all companies actively hiring on CVin.Bio. Discover open roles at top tech companies.',
    siteName: 'CVin.Bio',
    images: [{ url: 'https://cvin.bio/opengraph-image', width: 1200, height: 630, alt: 'Browse companies hiring on CVin.Bio' }],
  },
  twitter: { card: 'summary_large_image', title: 'Companies Hiring Now | CVin.Bio' },
  robots: { index: true, follow: true },
};

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

// Domain overrides for companies that don't use companyname.com
const DOMAIN_MAP: Record<string, string> = {
  'sanity': 'sanity.io', 'pleo': 'pleo.io', 'sardine': 'sardine.ai',
  'causal': 'causal.app', 'persona': 'withpersona.com', 'render': 'render.com',
  'linear': 'linear.app', 'livekit': 'livekit.io', 'replit': 'replit.com',
  'posthog': 'posthog.com', 'attio': 'attio.com', 'modal': 'modal.com',
  'n8n': 'n8n.io', 'sentry': 'sentry.io', 'cohere': 'cohere.com',
  'cursor': 'cursor.com', 'perplexity': 'perplexity.ai', 'vanta': 'vanta.com',
  'deel': 'deel.com', 'plaid': 'plaid.com', 'braze': 'braze.com',
  'langchain': 'langchain.com', 'semgrep': 'semgrep.dev', 'drata': 'drata.com',
  'infisical': 'infisical.com', 'twenty': 'twenty.com', 'plain': 'plain.com',
  'column': 'column.com', 'writer': 'writer.com', 'oyster': 'oysterhr.com',
  'kraken.com': 'kraken.com', 'squarespace': 'squarespace.com',
  'confluent': 'confluent.io', 'cockroach labs': 'cockroachlabs.com',
  'chime financial, inc': 'chime.com', 'gusto, inc.': 'gusto.com',
  'amplitude ': 'amplitude.com', 'govtech ': 'tech.gov.sg',
  'govtech singapore': 'tech.gov.sg', 'shopback 2': 'shopback.com',
};

function domainFor(name: string): string {
  const key = name.toLowerCase().trim();
  return DOMAIN_MAP[key] || key.replace(/[^a-z0-9]/g, '') + '.com';
}

// Junk/test company names to exclude entirely
const BLOCKLIST = new Set([
  'leverdemo 8', 'getwingapp', 'leverdemo', 'test company', 'demo company',
  'smart working solutions', 'confidential', '10xteam', 'careers - think digitally',
  'careers.azx.io', 'brook hiddink - highticket.io',
]);

// Normalize variant company names to canonical form
const NAME_MAP: Record<string, string> = {
  // Cross-source duplicates (same company, different name)
  'doordash usa': 'DoorDash', 'doordash': 'DoorDash',
  'shopback 2': 'ShopBack', 'shopback': 'ShopBack',
  'brillio 2': 'Brillio', 'brillio': 'Brillio',
  'lyrahealth': 'Lyra Health', 'lyra health': 'Lyra Health',
  'ciandt': 'CI&T', 'ci&t': 'CI&T',
  'hadrian-automation': 'Hadrian', 'hadrian': 'Hadrian',
  'relativity space': 'Relativity', 'relativity': 'Relativity',
  'scale ai': 'Scale AI', 'scale': 'Scale AI',
  'unity technologies': 'Unity', 'unity': 'Unity',
  'base-power': 'Base Power', 'heidihealth.com.au': 'Heidi Health',
  'roadsurfer.com': 'Roadsurfer', 'the-exploration-company': 'The Exploration Company',
  'finni-health': 'Finni Health', 'apex-technology-inc': 'Apex Technology',
  'northwoodspace': 'Northwood Space', 'horizon3ai': 'Horizon3.ai',
  'marianaminerals': 'Mariana Minerals', 'vertical-aerospace': 'Vertical Aerospace',

  // GovTech / suffixed
  'govtech singapore': 'GovTech', 'govtech ': 'GovTech',
  'amplitude ': 'Amplitude',
  'kraken.com': 'Kraken', 'kraken': 'Kraken',
  'chime financial, inc': 'Chime', 'gusto, inc.': 'Gusto',

  // Official capitalizations for lowercase DB entries
  'openai': 'OpenAI', 'airwallex': 'Airwallex', 'snowflake': 'Snowflake',
  'deel': 'Deel', 'notion': 'Notion', 'vanta': 'Vanta', 'ramp': 'Ramp',
  'cohere': 'Cohere', 'langchain': 'LangChain', 'plaid': 'Plaid',
  'perplexity': 'Perplexity', 'replit': 'Replit', 'clickup': 'ClickUp',
  'cursor': 'Cursor', 'socure': 'Socure', 'sentry': 'Sentry',
  'persona': 'Persona', 'sanity': 'Sanity', 'pleo': 'Pleo',
  'sardine': 'Sardine', 'modal': 'Modal', 'drata': 'Drata',
  'attio': 'Attio', 'twenty': 'Twenty', 'linear': 'Linear',
  'infisical': 'Infisical', 'writer': 'Writer', 'confluent': 'Confluent',
  'semgrep': 'Semgrep', 'livekit': 'LiveKit', 'anyscale': 'Anyscale',
  'plain': 'Plain', 'column': 'Column', 'unit': 'Unit',
  'supabase': 'Supabase', 'render': 'Render', 'trivago': 'trivago',
  'oyster': 'Oyster', 'character': 'Character.AI', 'n8n': 'n8n',
  'posthog': 'PostHog', 'stream': 'Stream', 'railway': 'Railway',
  'mindvalley': 'Mindvalley', 'resend': 'Resend', 'neon': 'Neon',
  'statsig': 'Statsig', 'stytch': 'Stytch', 'runway': 'Runway',
  'clerk': 'Clerk', 'axiom': 'Axiom', 'inngest': 'Inngest',
  'causal': 'Causal', 'doppler': 'Doppler', 'hightouch': 'Hightouch',
  'huggingface': 'Hugging Face', 'consensys': 'ConsenSys',
  'gopuff': 'Gopuff', 'spotify': 'Spotify', 'deliveroo': 'Deliveroo',
  'okta': 'Okta', 'klaviyo': 'Klaviyo', 'robinhood': 'Robinhood',
  'jfrog': 'JFrog', 'handshake': 'Handshake', 'palantir': 'Palantir',
  'lyft': 'Lyft', 'coinbase': 'Coinbase', 'hostinger': 'Hostinger',
  'instacart': 'Instacart', 'remote': 'Remote', 'dropbox': 'Dropbox',
  'duolingo': 'Duolingo', 'cribl': 'Cribl', 'databricks': 'Databricks',
  'harvey': 'Harvey', 'everai': 'EverAI', 'applied': 'Applied',
  'illumio': 'Illumio', 'instructure': 'Instructure', 'deepl': 'DeepL',
  'siteminder': 'SiteMinder', 'gamma': 'Gamma', 'lovable': 'Lovable',
  'floqast': 'FloQast', 'elfbeauty': 'e.l.f. Beauty',
  'swordhealth': 'Sword Health', 'rothys': 'Rothy\'s',
};

export default async function CompaniesPage() {
  // Fetch all jobs to compute per-company stats — paginate aggressively
  let allJobs: any[] = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  const isBuild = process.env.IS_NEXT_BUILD === '1';
  const MAX_PAGES = isBuild ? 2 : 40; // Cap at 40K rows — sufficient for all unique companies
  while (page < MAX_PAGES) {
    const { data, error } = await supabase
      .from('jobs')
      .select('company, company_logo, location, published_at, created_at')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    allJobs.push(...data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  // Aggregate per company (case-insensitive to merge Gopuff/GoPuff etc.)
  const companyMap: Record<string, { name: string; nameCounts: Record<string, number>; logo: string | null; count: number; locations: Set<string>; latest: string | null }> = {};
  allJobs.forEach(job => {
    if (!job.company || job.company.includes('...') || BLOCKLIST.has(job.company.toLowerCase().trim())) return;
    // Normalize variant names
    const normalized = NAME_MAP[job.company.toLowerCase().trim()] || job.company;
    const key = normalized.toLowerCase().trim();
    if (!companyMap[key]) {
      companyMap[key] = { name: normalized, nameCounts: {}, logo: job.company_logo, count: 0, locations: new Set(), latest: null };
    }
    companyMap[key].nameCounts[normalized] = (companyMap[key].nameCounts[normalized] || 0) + 1;
    companyMap[key].count++;
    if (job.location) {
      const loc = normalizeLocation(job.location);
      if (loc && loc !== 'Remote' && loc !== 'Hybrid') companyMap[key].locations.add(loc);
    }
    const d = job.published_at || job.created_at;
    if (d && (!companyMap[key].latest || d > companyMap[key].latest!)) {
      companyMap[key].latest = d;
    }
  });
  // Use the most common casing as display name
  Object.values(companyMap).forEach(c => {
    c.name = Object.entries(c.nameCounts).sort((a, b) => b[1] - a[1])[0][0];
  });

  const companies = Object.values(companyMap)
    .sort((a, b) => b.count - a.count);

  const totalJobs = companies.reduce((s, c) => s + c.count, 0);

  // Top companies for logo strip (hardcoded domains for reliability)
  const logoStrip = [
    { name: 'Stripe', domain: 'stripe.com' },
    { name: 'Anthropic', domain: 'anthropic.com' },
    { name: 'Cloudflare', domain: 'cloudflare.com' },
    { name: 'Figma', domain: 'figma.com' },
    { name: 'GitLab', domain: 'gitlab.com' },
    { name: 'Coinbase', domain: 'coinbase.com' },
    { name: 'Discord', domain: 'discord.com' },
    { name: 'Reddit', domain: 'reddit.com' },
    { name: 'Airbnb', domain: 'airbnb.com' },
    { name: 'Spotify', domain: 'spotify.com' },
    { name: 'Netflix', domain: 'netflix.com' },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-primary/10 transition-colors duration-200 flex flex-col">
      <Header />
      <main id="main-content" className="w-full max-w-5xl mx-auto px-6 py-12 md:py-20 lg:py-24 pb-32 flex-1">
        {/* Hero */}
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3 transition-colors">
            Companies
          </h1>
          {/* Logo strip */}
          <div className="flex items-center gap-3 mt-3">
            {logoStrip.map((c, i) => (
              <Link key={c.name} href={`/${toSlug(c.name)}`} title={c.name} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`}
                  alt={`${c.name} logo`}
                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-md opacity-80 hover:opacity-100 transition-all shrink-0"
                  loading="lazy"
                />
              </Link>
            ))}
            <span className="text-xs text-zinc-400 shrink-0">+{companies.length - logoStrip.length} more</span>
          </div>
          <Link href="/jobs" className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline">
            <Briefcase className="h-4 w-4 text-primary" />
            Browse all {totalJobs.toLocaleString()} open roles →
          </Link>
        </div>

        {/* Company count */}
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-4 uppercase tracking-wider">
          {companies.length} {companies.length === 1 ? 'company' : 'companies'} found
        </p>

        {/* Company Cards — 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {companies.map(company => {
            const slug = toSlug(company.name);
            const topLocs = [...company.locations].slice(0, 3);
            const logo = company.logo;
            return (
              <Link
                key={company.name}
                href={`/${slug}`}
                className="group flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-white/5 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domainFor(company.name)}&sz=32`}
                  alt={`${company.name} logo`}
                  className="h-5 w-5 rounded shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors truncate">
                    {company.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 min-w-0">
                    <span className="font-medium shrink-0">{company.count} {company.count === 1 ? 'role' : 'roles'}</span>
                    {topLocs.length > 0 && (
                      <>
                        <span className="shrink-0 text-zinc-300 dark:text-zinc-600">·</span>
                        <span className="truncate">{topLocs.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <MicroFooter />
    </div>
  );
}
