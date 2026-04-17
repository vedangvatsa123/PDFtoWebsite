// Remote Jobs Sync Script — fetches from 9 sources, deduplicates, upserts to Supabase
// Run via: node .github/scripts/jobs-sync.mjs
// Env: SUPABASE_URL, SUPABASE_KEY (service role)

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

// ─── Tech keywords for tag extraction (regex-matched against descriptions) ───
const TECH_KEYWORDS = [
  'javascript','typescript','python','java','ruby','go','golang','rust','c\\+\\+','c#',
  'swift','kotlin','php','scala','elixir','haskell','perl','lua','dart','r\\b',
  'react','next\\.js','nextjs','vue','angular','svelte','nuxt','remix','gatsby',
  'node\\.js','nodejs','express','fastify','nest\\.?js','deno','bun',
  'django','flask','fastapi','rails','spring','laravel','asp\\.net',
  'aws','azure','gcp','google cloud','firebase','supabase','vercel','netlify',
  'docker','kubernetes','k8s','terraform','ansible','jenkins','ci/cd','github actions',
  'postgresql','postgres','mysql','mongodb','redis','elasticsearch','dynamodb','cassandra',
  'graphql','rest api','grpc','websocket',
  'machine learning','deep learning','nlp','computer vision','tensorflow','pytorch',
  'llm','langchain','openai','gpt','claude','gemini','ai','ml',
  'figma','sketch','adobe xd',
  'tailwind','css','sass','html',
  'git','linux','nginx','apache',
  'solidity','web3','blockchain','ethereum','smart contract',
  'ios','android','react native','flutter','mobile',
  'data engineering','data science','etl','airflow','spark','kafka','hadoop',
  'security','penetration testing','devsecops','soc','compliance',
  'agile','scrum','kanban','jira','confluence',
  'sql','nosql','sqlite','oracle','snowflake','bigquery','dbt',
  'tableau','power bi','looker','metabase',
  'microservices','serverless','event-driven','saas',
  'product management','ux','ui','design system',
  // Role-based keywords
  'sales','marketing','finance','accounting','legal','hr','human resources',
  'operations','support','customer success','business development','partnerships',
  'analyst','recruiter','recruiting','talent','people ops','enablement',
  'content','copywriter','writer','editor','communications','pr',
  'revenue','growth','strategy','consulting','solutions',
  'devrel','developer relations','evangelist','community',
  'program manager','project manager','chief','vp','director',
  'engineer','engineering','architect','infrastructure','platform','sre','reliability',
  'qa','quality assurance','test','testing','automation',
  'intern','internship',
  'frontend','backend','full.?stack','fullstack',
].map(kw => new RegExp(`\\b${kw}\\b`, 'i'));

const KEYWORD_LABELS = [
  'JavaScript','TypeScript','Python','Java','Ruby','Go','Golang','Rust','C++','C#',
  'Swift','Kotlin','PHP','Scala','Elixir','Haskell','Perl','Lua','Dart','R',
  'React','Next.js','Next.js','Vue','Angular','Svelte','Nuxt','Remix','Gatsby',
  'Node.js','Node.js','Express','Fastify','NestJS','Deno','Bun',
  'Django','Flask','FastAPI','Rails','Spring','Laravel','ASP.NET',
  'AWS','Azure','GCP','Google Cloud','Firebase','Supabase','Vercel','Netlify',
  'Docker','Kubernetes','Kubernetes','Terraform','Ansible','Jenkins','CI/CD','GitHub Actions',
  'PostgreSQL','PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','DynamoDB','Cassandra',
  'GraphQL','REST API','gRPC','WebSocket',
  'Machine Learning','Deep Learning','NLP','Computer Vision','TensorFlow','PyTorch',
  'LLM','LangChain','OpenAI','GPT','Claude','Gemini','AI','ML',
  'Figma','Sketch','Adobe XD',
  'Tailwind','CSS','Sass','HTML',
  'Git','Linux','Nginx','Apache',
  'Solidity','Web3','Blockchain','Ethereum','Smart Contract',
  'iOS','Android','React Native','Flutter','Mobile',
  'Data Engineering','Data Science','ETL','Airflow','Spark','Kafka','Hadoop',
  'Security','Penetration Testing','DevSecOps','SOC','Compliance',
  'Agile','Scrum','Kanban','Jira','Confluence',
  'SQL','NoSQL','SQLite','Oracle','Snowflake','BigQuery','dbt',
  'Tableau','Power BI','Looker','Metabase',
  'Microservices','Serverless','Event-Driven','SaaS',
  'Product Management','UX','UI','Design System',
  // Role-based labels
  'Sales','Marketing','Finance','Accounting','Legal','HR','HR',
  'Operations','Support','Customer Success','Business Development','Partnerships',
  'Analyst','Recruiter','Recruiting','Talent','People Ops','Enablement',
  'Content','Copywriter','Writer','Editor','Communications','PR',
  'Revenue','Growth','Strategy','Consulting','Solutions',
  'DevRel','Developer Relations','Evangelist','Community',
  'Program Manager','Project Manager','Executive','VP','Director',
  'Engineering','Engineering','Architect','Infrastructure','Platform','SRE','Reliability',
  'QA','QA','Testing','Testing','Automation',
  'Intern','Internship',
  'Frontend','Backend','Full Stack','Full Stack',
];

// ─── Greenhouse company slugs to fetch ───
const GREENHOUSE_SLUGS = [
  'stripe','coinbase','kraken','binance','figma','airbnb','dropbox','slack','discord','reddit','epicgames','mozilla','consensys','chainlink','netlify','vercel','hashicorp','datadog','okta','twilio',
  // Tier 1 — Major tech
  'gitlab','stripe','figma','datadog','cloudflare','elastic','twilio',
  'mongodb','cockroachlabs','launchdarkly','coinbase','brex','mercury',
  'airtable','webflow','calendly','gusto','lattice',
  'instacart','discord','reddit','pinterest','anthropic',
  // Tier 2 — Scale-ups & unicorns
  'squarespace','hubspot','netlify','pagerduty',
  'mixpanel','amplitude',
  'twitch','lyft','airbnb','robinhood','chime','sofi',
  'remote','justworks',
  // Tier 3 — AI/ML companies
  'deepmind','scaleai','stabilityai',
  // Tier 4 — Dev tools & infra
  'postman','circleci','grafanalabs','tailscale','planetscale',
  // Tier 5 — Fintech & crypto
  'gemini','alchemy','consensys','chainlink','uniswap','ethereumfoundation','moonpay','aptoslabs','optimism','arbitrum','dydx','solanafoundation','avalabs',
  'monzo','nubank',
  // Tier 6 — E-commerce & SaaS
  'faire','klaviyo','attentive','braze','iterable',
  'asana','dropbox',
  // Tier 7 — APAC
  'xendit','bybit','okx','phonepe','agoda','flexport','trivago','mercari',
  // Tier 8 — Unicorns
  'databricks','adyen','toast','intercom','jfrog','block','marqeta','sendbird',
  // Tier 9 — SG/MY
  'govtech','motional',
  // Tier 10 — E-commerce/Marketplace
  'doordashusa',
  'ghost','buffer','doist','zapier','hotjar','automattic','basecamp','duckduckgo','invision','toptal','1password',
  // Remote-first additions
  'atlassian','cribl',
  'superblocks','warp','mmhmm','greenhouse','temporal',
];

// ─── Ashby company slugs ───
const ASHBY_SLUGS = [
  'notion','ramp','linear','vercel','supabase','railway','render',
  'clerk','resend','neon',
  'causal','stytch','axiom','inngest',
  'twenty','attio','plain',
  'langchain','anyscale','modal',
  // APAC
  'airwallex','mindvalley',
  // AI/ML
  'openai','perplexity','cohere','cursor','replit',
  // Cloud/Infra
  'snowflake','confluent','sentry',
  // Fintech/HR
  'plaid','deel','lemonade',
  // Productivity
  'clickup','n8n',
  'kraken.com','paradigm','a16zcrypto',
  // Security/Compliance
  'vanta','drata','semgrep',
  // AI
  'writer','character','runway','gamma',
  // Fintech/Identity
  'socure','persona','sardine','pleo','column','unit',
  // Infrastructure
  'sanity','livekit','oyster','infisical','stream','statsig','doppler','hightouch','posthog',
  'zapier','benchling','fullstory','airbyte','prefect',
  'coinhako',
  // Remote-first additions
  'helpscout','contra',
  // Remote-first — Batch 2 (verified via ATS probing)
  'sourcegraph','toggl','flocksafety','mural','snyk','miro','gong',
  'dbt-labs','gitbook','fly','retool','pulumi','upstash','turso',
  'tinybird','hasura','appsmith','coda','mux',
  'fleetdm','teleport','betterstack','chronosphere',
  'deno','bun','cal','prisma','raycast','todoist',
  'height','pitch','papaya-global','invisionapp',
  'liveblocks','mullvad','lightstep','around',
  // Remote-first — Batch 3 (verified active job boards)
  'synthesia','deepl','deepgram','pinecone','chromatic','coder','weaviate','wistia',
  // Crypto & Migrated from Greenhouse
  'opensea','phantom','magic','taxbit','nansen',
];

// ─── Workable company slugs ───
const WORKABLE_SLUGS = [
  'huggingface','writesonic','oysterhr','midjourney',
];

// ─── Lever company slugs ───
const LEVER_SLUGS = [
  'shopify','notion','replit','linear','superhuman','webflow','framer','loom','zapier',
  // APAC
  'ninjavan','lalamove','patsnap','immutable','cred','nium','binance','mistral','paytm','gopuff','shopback-2',
  // Remote-first additions
  'spotify',
  // Remote-first — Batch 3 (verified active)
  'stackblitz','labelbox',
];

// ─── Helpers ───
function dedupHash(company, title) {
  const normalized = `${company.toLowerCase().trim()}|${title.toLowerCase().trim()}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function extractTags(text) {
  if (!text) return [];
  const found = new Set();
  for (let i = 0; i < TECH_KEYWORDS.length; i++) {
    if (TECH_KEYWORDS[i].test(text)) found.add(KEYWORD_LABELS[i]);
  }
  return [...found];
}

function normalizeJobType(raw) {
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/[_-]/g, ' ').trim();
  if (t.includes('full') && t.includes('time')) return 'full_time';
  if (t.includes('part') && t.includes('time')) return 'part_time';
  if (t.includes('contract')) return 'contract';
  if (t.includes('freelance')) return 'freelance';
  if (t.includes('intern')) return 'internship';
  return raw;
}

async function fetchExistingHashes() {
  // Fetch all existing dedup_hashes from DB to skip duplicates client-side
  const allHashes = new Set();
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?select=dedup_hash&offset=${offset}&limit=${pageSize}`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) break;
    const rows = await res.json();
    if (rows.length === 0) break;
    for (const r of rows) allHashes.add(r.dedup_hash);
    offset += pageSize;
  }
  return allHashes;
}

async function supabaseUpsert(jobs) {
  // Deduplicate by dedup_hash in-memory
  const seen = new Map();
  for (const job of jobs) {
    if (!seen.has(job.dedup_hash)) {
      seen.set(job.dedup_hash, job);
    }
  }
  const unique = [...seen.values()];
  console.log(`   After in-memory dedup: ${unique.length} unique jobs`);

  // Pre-fetch existing hashes to skip duplicates client-side
  console.log(`   📥 Fetching existing hashes from DB...`);
  const existingHashes = await fetchExistingHashes();
  console.log(`   📥 Found ${existingHashes.size} existing jobs in DB`);

  const newJobs = unique.filter(j => !existingHashes.has(j.dedup_hash));
  const skippedCount = unique.length - newJobs.length;
  console.log(`   🆕 ${newJobs.length} new jobs to insert (${skippedCount} already exist)`);

  if (newJobs.length === 0) {
    return { inserted: 0, skipped: skippedCount };
  }

  // Batch insert only new jobs — 200 per batch, 50 concurrent
  const batchSize = 200;
  const concurrency = 50;
  let inserted = 0;
  const batches = [];

  for (let i = 0; i < newJobs.length; i += batchSize) {
    batches.push(newJobs.slice(i, i + batchSize));
  }
  console.log(`   📤 Inserting ${batches.length} batches of ~${batchSize} (${concurrency} parallel)...`);

  async function insertBatch(batch) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates,return=representation',
        },
        body: JSON.stringify(batch),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const result = await res.json();
        return result.length;
      } else {
        const err = await res.text();
        console.error(`  ❌ Batch error: ${err.substring(0, 200)}`);
        return 0;
      }
    } catch (e) {
      console.error(`  ❌ Batch failed: ${e.message}`);
      return 0;
    }
  }

  // Fire all batches with concurrency limit
  for (let g = 0; g < batches.length; g += concurrency) {
    const group = batches.slice(g, g + concurrency);
    const results = await Promise.all(group.map(b => insertBatch(b)));
    for (const r of results) inserted += r;
    console.log(`   ✅ Group ${Math.floor(g / concurrency) + 1}/${Math.ceil(batches.length / concurrency)} done (${inserted} inserted so far)`);
  }

  return { inserted, skipped: skippedCount + (newJobs.length - inserted) };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Source: RemoteOK ───
async function fetchRemoteOK() {
  console.log('\n── RemoteOK ──');
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Mozilla/5.0 (CVin.Bio job aggregator)' }
    });
    const data = await res.json();
    // First element is metadata, rest are jobs
    const raw = Array.isArray(data) ? data.slice(1) : [];
    const jobs = raw.map(j => ({
      source: 'remoteok',
      external_id: `remoteok_${j.id}`,
      dedup_hash: dedupHash(j.company || '', j.position || ''),
      title: (j.position || '').trim(),
      company: j.company || 'Unknown',
      company_logo: j.company_logo || j.logo || null,
      location: j.location || 'Remote',
      job_type: normalizeJobType(j.type) || 'full_time',
      salary: j.salary_min && j.salary_max ? `$${j.salary_min}-$${j.salary_max}` : (j.salary || null),
      description: (j.description || '').substring(0, 5000),
      tags: j.tags?.length ? j.tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)) : extractTags(`${j.position || ''} ${j.description || ''}`),
      apply_url: j.apply_url || j.url || `https://remoteok.com/remote-jobs/${j.slug || j.id}`,
      category: j.tags?.[0] || null,
      published_at: j.date || null,
    })).filter(j => j.title && j.company);
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ RemoteOK error: ${e.message}`);
    return [];
  }
}

// ─── Source: BambooHR (per-company) ───
const BAMBOOHR_SLUGS = [
  'zendesk',
];

async function fetchBambooHR() {
  console.log('\n── BambooHR ──');
  const jobs = [];

  for (const slug of BAMBOOHR_SLUGS) {
    try {
      const res = await fetch(`https://${slug}.bamboohr.com/careers/list`, {
        headers: { 'Accept': 'application/json' },
        redirect: 'manual',
      });
      if (res.status !== 200) { console.log(`  ⚠ ${slug}: ${res.status}`); continue; }
      const data = await res.json();
      const openings = data.result || (Array.isArray(data) ? data : []);
      const companyJobs = openings.map(j => {
        const loc = j.location || {};
        const location = [loc.city, loc.state, loc.country].filter(Boolean).join(', ') || 'Unknown';
        return {
          source: 'bamboohr',
          external_id: `bhr_${slug}_${j.id}`,
          dedup_hash: dedupHash(slug, j.jobOpeningName || ''),
          title: (j.jobOpeningName || '').trim(),
          company: slug.charAt(0).toUpperCase() + slug.slice(1),
          company_logo: null,
          location: j.isRemote === '1' ? `Remote - ${location}` : location,
          job_type: j.employmentStatusLabel ? normalizeJobType(j.employmentStatusLabel) : null,
          salary: null,
          description: null,
          tags: extractTags(j.jobOpeningName || ''),
          apply_url: `https://${slug}.bamboohr.com/careers/${j.id}`,
          category: j.departmentLabel || null,
          published_at: null,
        };
      }).filter(j => j.title);
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      jobs.push(...companyJobs);
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
    }
    await sleep(300);
  }

  console.log(`  Total: ${jobs.length} jobs from BambooHR`);
  return jobs;
}

// ─── Source: Remotive ───
async function fetchRemotive() {
  console.log('\n── Remotive ──');
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=500');
    const data = await res.json();
    const jobs = (data.jobs || []).map(j => {
      const tags = j.tags?.length ? j.tags : extractTags(`${j.title} ${j.description || ''}`);
      return {
        source: 'remotive',
        external_id: `remotive_${j.id}`,
        dedup_hash: dedupHash(j.company_name, j.title),
        title: j.title,
        company: j.company_name,
        company_logo: j.company_logo || null,
        location: j.candidate_required_location || 'Remote',
        job_type: normalizeJobType(j.job_type),
        salary: j.salary || null,
        description: j.description?.substring(0, 5000) || null,
        tags: Array.isArray(tags) ? tags : extractTags(`${j.title} ${j.description || ''}`),
        apply_url: j.url,
        category: j.category || null,
        published_at: j.publication_date || null,
      };
    });
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ Remotive error: ${e.message}`);
    return [];
  }
}


// ─── Source: Arbeitnow (Paginated) ───
async function fetchArbeitnow() {
  console.log('\n── Arbeitnow ──');
  let allJobs = [];
  try {
    for (let page = 1; page <= 5; page++) {
      console.log(`  Fetching page ${page}...`);
      const res = await fetch(`https://arbeitnow.com/api/job-board-api?page=${page}`);
      const data = await res.json();
      const jobs = (data.data || []).map(j => ({
        source: 'arbeitnow',
        external_id: `arbeitnow_${j.slug}`,
        dedup_hash: dedupHash(j.company_name, j.title),
        title: j.title,
        company: j.company_name,
        company_logo: null,
        location: j.remote ? 'Remote' : (j.location || 'Unknown'),
        job_type: (j.job_types || []).join(', ') || 'full_time',
        salary: null,
        description: j.description.substring(0, 5000),
        tags: j.tags && j.tags.length ? j.tags : extractTags(`${j.title} ${j.description || ''}`),
        apply_url: j.url,
        category: null,
        published_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
      })).filter(j => j.location && j.location.toLowerCase().includes('remote'));
      allJobs = [...allJobs, ...jobs];
      if (data.data?.length < 10) break; // End of pages
    }
    console.log(`  Found ${allJobs.length} total jobs from Arbeitnow`);
    return allJobs;
  } catch (e) {
    console.error(`  ❌ Arbeitnow error: ${e.message}`);
    return allJobs;
  }
}

// ─── Source: WeWorkRemotely ───
async function fetchWeWorkRemotely() {
  console.log('\n── WeWorkRemotely ──');
  try {
    const res = await fetch('https://weworkremotely.com/remote-jobs.rss');
    const xml = await res.text();
    const jobs = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[0];
      const getTag = (tag) => {
        const tMatch = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return tMatch ? tMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
      };
      
      const titleFull = getTag('title');
      let company = 'Unknown', title = titleFull;
      if (titleFull.includes(': ')) {
        const parts = titleFull.split(': ');
        company = parts[0];
        title = parts.slice(1).join(': ');
      }
      
      jobs.push({
        source: 'weworkremotely',
        external_id: `wwr_${getTag('guid')}`,
        dedup_hash: dedupHash(company, title),
        title,
        company,
        company_logo: null,
        location: getTag('category') || 'Remote',
        job_type: 'full_time',
        salary: null,
        description: getTag('description').substring(0, 5000),
        tags: extractTags(`${title} ${getTag('description')}`),
        apply_url: getTag('link'),
        category: null,
        published_at: new Date(getTag('pubDate')).toISOString(),
      });
    }
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch(e) {
    console.error(`  ❌ WWR error: ${e.message}`);
    return [];
  }
}

// ─── Source: Himalayas ───
async function fetchHimalayas() {
  console.log('\n── Himalayas ──');
  try {
    const res = await fetch('https://himalayas.app/jobs/api?limit=500');
    const data = await res.json();
    const jobs = (data.jobs || []).map(j => ({
      source: 'himalayas',
      external_id: `himalayas_${j.id}`,
      dedup_hash: dedupHash(j.companyName || j.company_name || '', j.title),
      title: j.title,
      company: j.companyName || j.company_name || 'Unknown',
      company_logo: j.companyLogo || j.company_logo || null,
      location: j.location || 'Remote',
      job_type: normalizeJobType(j.type || j.jobType),
      salary: j.salary || null,
      description: (j.description || j.excerpt || '').substring(0, 5000),
      tags: j.tags?.length ? j.tags : extractTags(`${j.title} ${j.description || ''}`),
      apply_url: j.applicationUrl || j.url || `https://himalayas.app/jobs/${j.id}`,
      category: j.categories?.[0] || j.category || null,
      published_at: j.publishedAt || j.published_at || null,
    }));
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ Himalayas error: ${e.message}`);
    return [];
  }
}

// ─── Source: Jobicy ───
async function fetchJobicy() {
  console.log('\n── Jobicy ──');
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=200');
    const data = await res.json();
    const jobs = (data.jobs || []).map(j => ({
      source: 'jobicy',
      external_id: `jobicy_${j.id}`,
      dedup_hash: dedupHash(j.companyName || '', j.jobTitle),
      title: j.jobTitle,
      company: j.companyName || 'Unknown',
      company_logo: j.companyLogo || null,
      location: j.jobGeo || 'Remote',
      job_type: normalizeJobType(j.jobType),
      salary: j.annualSalaryMin && j.annualSalaryMax
        ? `$${j.annualSalaryMin}-$${j.annualSalaryMax}`
        : null,
      description: (j.jobDescription || '').substring(0, 5000),
      tags: j.jobIndustry ? [j.jobIndustry] : extractTags(`${j.jobTitle} ${j.jobDescription || ''}`),
      apply_url: j.url,
      category: j.jobIndustry?.[0] || null,
      published_at: j.pubDate || null,
    }));
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ Jobicy error: ${e.message}`);
    return [];
  }
}

// ─── Source: Greenhouse (per-company) ───
async function fetchGreenhouse() {
  console.log('\n── Greenhouse ──');
  const jobs = [];

  for (const slug of GREENHOUSE_SLUGS) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
      if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); continue; }
      const data = await res.json();
      const companyJobs = (data.jobs || [])
        .map(j => ({
          source: 'greenhouse',
          external_id: `gh_${slug}_${j.id}`,
          dedup_hash: dedupHash(j.company_name || slug, j.title),
          title: j.title.trim(),
          company: j.company_name || slug,
          company_logo: null,
          location: j.location?.name || 'Remote',
          job_type: null, // Greenhouse doesn't provide this
          salary: null,
          description: null, // Would need 2nd call
          tags: extractTags(j.title),
          apply_url: j.absolute_url,
          category: null,
          published_at: j.first_published || j.updated_at || null,
        }));
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      jobs.push(...companyJobs);
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
    }
    await sleep(500); // Rate limit protection
  }

  console.log(`  Total: ${jobs.length} jobs from Greenhouse`);
  return jobs;
}

// ─── Source: Ashby (per-company) ───
async function fetchAshby() {
  console.log('\n── Ashby ──');
  const jobs = [];

  for (const slug of ASHBY_SLUGS) {
    try {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
      if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); continue; }
      const data = await res.json();
      const companyJobs = (data.jobs || [])
        .map(j => ({
          source: 'ashby',
          external_id: `ashby_${slug}_${j.id}`,
          dedup_hash: dedupHash(data.organizationName || slug, j.title),
          title: j.title,
          company: data.organizationName || slug,
          company_logo: null,
          location: j.location || j.locationName || 'Remote',
          job_type: j.employmentType ? normalizeJobType(j.employmentType) : null,
          salary: null,
          description: (j.descriptionPlain || j.description || '').substring(0, 5000),
          tags: extractTags(`${j.title} ${j.descriptionPlain || j.description || ''}`),
          apply_url: j.jobUrl || `https://jobs.ashbyhq.com/${slug}/${j.id}`,
          category: j.department || j.team || null,
          published_at: j.publishedAt || null,
        }));
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      jobs.push(...companyJobs);
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
    }
    await sleep(500);
  }

  console.log(`  Total: ${jobs.length} jobs from Ashby`);
  return jobs;
}

// ─── Source: Workable (per-company) ───
async function fetchWorkable() {
  console.log('\n── Workable ──');
  const allJobs = [];

  const tasks = WORKABLE_SLUGS.map(slug => async () => {
    try {
      await sleep(2000); // Rate limit protection
      const res = await fetch(`https://apply.workable.com/api/v3/accounts/${slug}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '', location: [], department: [], worktype: [], remote: [] }),
      });
      if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); return []; }
      const data = await res.json();
      const companyJobs = (data.results || [])
        .map(j => ({
          source: 'workable',
          external_id: `wb_${slug}_${j.shortcode}`,
          dedup_hash: dedupHash(slug, j.title),
          title: j.title,
          company: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          company_logo: null,
          location: j.remote ? `Remote${j.location?.city ? ` - ${j.location.city}` : ''}` : (j.location?.city || j.location?.country || 'Unknown'),
          job_type: j.type === 'full' ? 'full_time' : j.type === 'part' ? 'part_time' : j.type ? normalizeJobType(j.type) : null,
          salary: null,
          description: null,
          tags: extractTags(j.title + ' ' + (j.department || []).join(' ')),
          apply_url: `https://apply.workable.com/${slug}/j/${j.shortcode}/`,
          category: (j.department || [])[0] || null,
          published_at: j.published || null,
        }));
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      return companyJobs;
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
      return [];
    }
  });

  const results = await workerPool(tasks, 3);
  results.forEach(r => { if (Array.isArray(r)) allJobs.push(...r); });

  console.log(`  Total: ${allJobs.length} jobs from Workable`);
  return allJobs;
}

// ─── Source: Lever (per-company) ───
async function fetchLever() {
  console.log('\n── Lever ──');
  const jobs = [];

  for (const slug of LEVER_SLUGS) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
      if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); continue; }
      const data = await res.json();
      const companyJobs = (Array.isArray(data) ? data : [])
        .map(j => ({
          source: 'lever',
          external_id: `lever_${slug}_${j.id}`,
          dedup_hash: dedupHash(j.text ? slug : slug, j.text || ''),
          title: (j.text || '').trim(),
          company: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          company_logo: null,
          location: j.categories?.location || 'Remote',
          job_type: j.categories?.commitment || null,
          salary: null,
          description: (j.descriptionPlain || '').substring(0, 5000),
          tags: extractTags(`${j.text || ''} ${j.descriptionPlain || ''}`),
          apply_url: j.hostedUrl || j.applyUrl || `https://jobs.lever.co/${slug}/${j.id}`,
          category: j.categories?.department || j.categories?.team || null,
          published_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
        }));
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      jobs.push(...companyJobs);
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
    }
    await sleep(500);
  }

  console.log(`  Total: ${jobs.length} jobs from Lever`);
  return jobs;
}

// ─── Source: SmartRecruiters (per-company) ───
const SMARTRECRUITERS_SLUGS = [
  // APAC
  'Grab','DeliveryHero','Wise','Freshworks',
  // Global with APAC presence
  'Visa','Canva','ServiceNow',
  // Migrated from Greenhouse
  'Bigcommerce','Polygontechnology',
  // Remote-first additions
  'DocuSign',
];

async function fetchSmartRecruiters() {
  console.log('\n── SmartRecruiters ──');
  const jobs = [];

  for (const slug of SMARTRECRUITERS_SLUGS) {
    try {
      let offset = 0;
      let total = 0;
      do {
        const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100&offset=${offset}`);
        if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); break; }
        const data = await res.json();
        total = data.totalFound || 0;
        for (const j of (data.content || [])) {
          const loc = j.location || {};
          const city = loc.city || '';
          const country = loc.country || '';
          const location = [city, country].filter(Boolean).join(', ') || 'Remote';
          jobs.push({
            source: 'smartrecruiters',
            external_id: `sr_${slug}_${j.id || j.uuid}`,
            dedup_hash: dedupHash(j.company?.name || slug, j.name || ''),
            title: (j.name || '').trim(),
            company: j.company?.name || slug,
            company_logo: null,
            location,
            job_type: j.typeOfEmployment?.label || null,
            salary: null,
            description: null,
            tags: extractTags(j.name || ''),
            apply_url: j.applyUrl || `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
            category: j.department?.label || j.function?.label || null,
            published_at: j.releasedDate || null,
          });
        }
        offset += 100;
        await sleep(500);
      } while (offset < total && offset < 1000);
      console.log(`  ✅ ${slug}: ${Math.min(total, jobs.length)} jobs`);
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
    }
  }

  console.log(`  Total: ${jobs.length} jobs from SmartRecruiters`);
  return jobs;
}

// ─── Source: Workday (per-company, POST API) ───
const WORKDAY_BOARDS = [
  { slug: 'propertyguru', host: 'propertyguru.wd105.myworkdayjobs.com', path: 'PropertyGuru', company: 'PropertyGuru' },
];

async function fetchWorkday() {
  console.log('\n── Workday ──');
  const jobs = [];

  for (const board of WORKDAY_BOARDS) {
    try {
      let offset = 0;
      let total = 0;
      do {
        const res = await fetch(`https://${board.host}/wday/cxs/${board.slug}/${board.path}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: '' }),
        });
        if (!res.ok) { console.log(`  ⚠ ${board.slug}: ${res.status}`); break; }
        const data = await res.json();
        total = data.total || 0;
        for (const j of (data.jobPostings || [])) {
          jobs.push({
            source: 'workday',
            external_id: `wd_${board.slug}_${j.bulletFields?.[0] || offset}`,
            dedup_hash: dedupHash(board.company, j.title || ''),
            title: (j.title || '').trim(),
            company: board.company,
            company_logo: null,
            location: j.locationsText || 'Remote',
            job_type: null,
            salary: null,
            description: null,
            tags: extractTags(j.title || ''),
            apply_url: `https://${board.host}/en-US/${board.path}/job${j.externalPath || ''}`,
            category: null,
            published_at: j.postedOn || null,
          });
        }
        offset += 20;
        await sleep(300);
      } while (offset < total);
      console.log(`  ✅ ${board.slug}: ${Math.min(total, jobs.length)} jobs`);
    } catch (e) {
      console.log(`  ⚠ ${board.slug}: ${e.message}`);
    }
  }

  console.log(`  Total: ${jobs.length} jobs from Workday`);
  return jobs;
}

// ─── Source: Foorilla (HTML scraping via HTMX) ───
// Uses ?remote=true filter + pagination + parallel worker pool

// Worker pool: runs N tasks concurrently
async function workerPool(tasks, concurrency = 10) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try {
        const result = await tasks[i]();
        if (result) results.push(result);
      } catch (e) { /* skip */ }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results;
}

function parseFoorillaJob(slug, html) {
  // Parse structured HTML for job data
  const titleMatch = html.match(/<h\d[^>]*>([^<]+)<\/h\d>/);
  const companyMatch = html.match(/@([A-Za-z0-9_.\- ]+)/);
  const locationMatch = html.match(/(?:📍|location|Location|loc)[:\s]*([^<\n]+)/i);
  const applyMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*(?:Apply|apply)/i) ||
                    html.match(/href="(https?:\/\/[^"]*(?:lever|greenhouse|ashby|workday|personio|jobs|careers|apply)[^"]*)"/i);

  // Extract tags from bracket notation [React] [Python] etc
  const tagRegex = /\[([A-Za-z0-9+#. ]+)\]/g;
  const tags = [];
  let tagMatch;
  while ((tagMatch = tagRegex.exec(html))) {
    const tag = tagMatch[1].trim();
    if (!['SE','MI','EN','EX'].includes(tag)) tags.push(tag);
  }

  // Extract salary
  const salaryMatch = html.match(/(?:[$€£¥][\d,]+[KkMm]?(?:\s*[-–]\s*[$€£¥]?[\d,]+[KkMm]?)?|[\d,]+\s*(?:USD|EUR|GBP))/);

  // Extract job type
  const typeMatch = html.match(/(?:Full Time|Part Time|Contract|Freelance|Internship)/i);

  // Extract experience level
  const expMatch = html.match(/\[(SE|MI|EN|EX)\]/);

  const title = titleMatch?.[1]?.trim();
  const company = companyMatch?.[1]?.trim();
  if (!title || !company) return null;

  const idMatch = slug.match(/-(\d+)\/$/);
  const externalId = idMatch ? `foorilla_${idMatch[1]}` : `foorilla_${crypto.createHash('md5').update(slug).digest('hex').substring(0, 10)}`;
  const applyUrl = applyMatch?.[1] || `https://foorilla.com${slug}`;

  return {
    source: 'foorilla',
    external_id: externalId,
    dedup_hash: dedupHash(company, title),
    title,
    company,
    company_logo: null,
    location: locationMatch?.[1]?.trim() || 'Remote',
    job_type: typeMatch ? normalizeJobType(typeMatch[0]) : null,
    salary: salaryMatch?.[0] || null,
    description: null,
    tags: tags.length ? tags : extractTags(title),
    apply_url: applyUrl,
    category: expMatch?.[1] || null,
    published_at: null,
  };
}

async function fetchFoorilla() {
  console.log('\n── Foorilla ──');
  const CONCURRENCY = 100;

  // Use multiple keyword queries as separate "sessions" to bypass pagination cap
  const KEYWORDS = [
    '', // default
    // Roles
    'engineer','developer','frontend','backend','fullstack','devops','sre','platform',
    'data','machine learning','ai','ml','nlp','deep learning','computer vision',
    'product','designer','ux','ui','design','researcher','scientist',
    'manager','director','vp','head','lead','principal','staff','senior','junior','intern',
    'analyst','qa','tester','automation','quality',
    'marketing','growth','seo','content','copywriter','social media',
    'sales','account','business development','partnerships','customer success',
    'support','operations','finance','hr','recruiting','people',
    'legal','compliance','security','infosec','cybersecurity',
    // Languages & Frameworks
    'python','javascript','typescript','react','angular','vue','svelte',
    'node','golang','go','rust','java','kotlin','swift','scala','elixir',
    'ruby','rails','php','laravel','c++','c#','.net','sql',
    'nextjs','remix','nuxt','django','flask','fastapi','spring',
    // Infra & Cloud
    'cloud','aws','azure','gcp','kubernetes','docker','terraform','ansible',
    'linux','networking','database','postgresql','mongodb','redis','kafka',
    'api','microservices','distributed','infrastructure',
    // Domains
    'blockchain','web3','crypto','defi','nft','smart contract','solidity',
    'fintech','healthtech','edtech','biotech','gaming','ecommerce',
    'mobile','ios','android','flutter','react native',
    'embedded','firmware','hardware','robotics','iot',
    // Misc
    'remote','hybrid','onsite','contract','freelance','part time',
    'startup','series','venture','saas','b2b','b2c',
    'singapore','london','berlin','amsterdam','toronto','sydney','tokyo',
    'india','europe','asia','apac','latam','africa',
  ];

  try {
    // Phase 1: Collect slugs from all keyword sessions in parallel
    const allSlugs = new Set();

    const extractSlugs = async (keyword) => {
      const q = keyword ? `?q=${encodeURIComponent(keyword)}` : '';
      const url = `https://foorilla.com/hiring/jobs/${q}`;
      try {
        const res = await fetch(url, { headers: { 'HX-Request': 'true' } });
        if (!res.ok) return 0;
        const html = await res.text();
        const slugRegex = /hx-get="(\/hiring\/jobs\/[^"]+\/)"/g;
        let match, found = 0;
        while ((match = slugRegex.exec(html))) {
          const slug = match[1];
          if (/\-\d+\/$/.test(slug) && !allSlugs.has(slug)) {
            allSlugs.add(slug);
            found++;
          }
        }
        return found;
      } catch { return 0; }
    };

    // Run keyword sessions with concurrency limit
    const keywordTasks = KEYWORDS.map(kw => async () => {
      const found = await extractSlugs(kw);
      if (found > 0) console.log(`  🔍 "${kw || 'default'}": ${found} new slugs (total: ${allSlugs.size})`);
      return found;
    });
    await workerPool(keywordTasks, 10);

    // Also paginate the default listing for pages 2-20
    for (let page = 2; page <= 20; page++) {
      const res = await fetch(`https://foorilla.com/hiring/jobs/?page=${page}`, { headers: { 'HX-Request': 'true' } });
      if (!res.ok) break;
      const html = await res.text();
      const slugRegex = /hx-get="(\/hiring\/jobs\/[^"]+\/)"/g;
      let match, found = 0;
      while ((match = slugRegex.exec(html))) {
        const slug = match[1];
        if (/\-\d+\/$/.test(slug) && !allSlugs.has(slug)) {
          allSlugs.add(slug);
          found++;
        }
      }
      if (found > 0) console.log(`  📄 Page ${page}: ${found} new slugs (total: ${allSlugs.size})`);
      if (found === 0) break;
      await sleep(200);
    }

    console.log(`  📋 Total unique slugs: ${allSlugs.size}`);
    if (allSlugs.size === 0) return [];

    // Phase 2: Fetch details in parallel using worker pool
    const slugArr = [...allSlugs];
    const tasks = slugArr.map(slug => async () => {
      const res = await fetch(`https://foorilla.com${slug}`, {
        headers: { 'HX-Request': 'true' },
      });
      if (!res.ok) return null;
      const html = await res.text();
      return parseFoorillaJob(slug, html);
    });

    console.log(`  ⚡ Fetching details with ${CONCURRENCY} parallel workers...`);
    const jobs = await workerPool(tasks, CONCURRENCY);
    console.log(`  ✅ Parsed ${jobs.length} jobs from Foorilla`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ Foorilla error: ${e.message}`);
    return [];
  }
}

// ─── Cleanup: remove jobs older than 30 days ───
async function cleanupOldJobs() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?synced_at=lt.${cutoff}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
    }
  );
  if (res.ok) {
    const deleted = await res.json();
    console.log(`\n🗑️ Cleaned up ${deleted.length} jobs older than 30 days`);
  }
}

// ─── Main ───
async function main() {
  console.log('🚀 Jobs Sync — Starting');
  const startTime = Date.now();

  // Fetch from all sources (aggregators first = richer data wins dedup)
  const remoteok = await fetchRemoteOK();
  const remotive = await fetchRemotive();
  const arbeitnow = await fetchArbeitnow();
  const wwr = await fetchWeWorkRemotely();
  const himalayas = await fetchHimalayas();
  const jobicy = await fetchJobicy();
  const greenhouse = await fetchGreenhouse();
  const ashby = await fetchAshby();
  const workable = await fetchWorkable();
  const lever = await fetchLever();
  const smartrecruiters = await fetchSmartRecruiters();
  const workday = await fetchWorkday();
  const bamboohr = await fetchBambooHR();
  const foorilla = await fetchFoorilla();

  // Merge all jobs — priority order (first seen wins dedup via DB constraint)
  const allJobs = [...remoteok, ...remotive, ...arbeitnow, ...wwr, ...himalayas, ...jobicy, ...greenhouse, ...ashby, ...workable, ...lever, ...smartrecruiters, ...workday, ...bamboohr, ...foorilla];
  console.log(`\n📊 Total jobs collected: ${allJobs.length}`);

  // Filter out invalid entries
  const validJobs = allJobs.filter(j => j.title && j.company && j.apply_url);
  console.log(`   Valid jobs: ${validJobs.length}`);

  // Stamp synced_at on every record
  const now = new Date().toISOString();
  for (const job of validJobs) {
    job.synced_at = now;
  }

  // Upsert to Supabase
  if (validJobs.length > 0) {
    const { inserted, skipped } = await supabaseUpsert(validJobs);
    console.log(`\n✅ Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
  }

  // Cleanup old jobs
  await cleanupOldJobs();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🏁 Done in ${elapsed}s`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
