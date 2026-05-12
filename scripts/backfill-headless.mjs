#!/usr/bin/env node
/**
 * backfill-headless.mjs v3 — High-quality scraper
 * - Validates descriptions are real job content (not nav/junk)
 * - Extracts experience level from description text
 * - Always extracts tags from description
 * - Saves incrementally, skips dead domains after 5 failures
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const CONCURRENCY = 5;
const PAGE_TIMEOUT = 10000;

// ── Tag extraction ──
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
  'figma','sketch','adobe xd','tailwind','css','sass','html',
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
  'sales','marketing','finance','accounting','legal','hr','human resources',
  'operations','support','customer success','business development','partnerships',
  'analyst','recruiter','recruiting','talent','people ops','enablement',
  'content','copywriter','writer','editor','communications','pr',
  'revenue','growth','strategy','consulting','solutions',
  'engineering','engineer','architect','infrastructure','platform','sre','reliability',
  'qa','quality assurance','testing','test engineer','automation',
  'intern','internship','frontend','backend','full stack','fullstack',
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
  'Figma','Sketch','Adobe XD','Tailwind','CSS','Sass','HTML',
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
  'Sales','Marketing','Finance','Accounting','Legal','HR','HR',
  'Operations','Support','Customer Success','Business Development','Partnerships',
  'Analyst','Recruiter','Recruiting','Talent','People Ops','Enablement',
  'Content','Copywriter','Writer','Editor','Communications','PR',
  'Revenue','Growth','Strategy','Consulting','Solutions',
  'Engineering','Engineering','Architect','Infrastructure','Platform','SRE','Reliability',
  'QA','QA','Testing','Testing','Automation',
  'Intern','Internship','Frontend','Backend','Full Stack','Full Stack',
];

function extractTags(text) {
  if (!text) return [];
  const found = new Set();
  for (let i = 0; i < TECH_KEYWORDS.length; i++) {
    if (TECH_KEYWORDS[i].test(text)) found.add(KEYWORD_LABELS[i]);
  }
  return [...found];
}

// ── Experience level extraction from description text ──
function extractExperienceLevel(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  // Look for explicit year ranges: "5+ years", "3-5 years", "10 years of experience"
  const yearPatterns = [
    /(\d+)\+?\s*(?:to|-)\s*(\d+)\s*(?:\+)?\s*years?\s*(?:of\s+)?(?:experience|exp)/i,
    /(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp|relevant|professional|work)/i,
    /minimum\s+(?:of\s+)?(\d+)\s*(?:\+)?\s*years?/i,
    /at\s+least\s+(\d+)\s*(?:\+)?\s*years?/i,
  ];

  let years = null;
  for (const pat of yearPatterns) {
    const m = text.match(pat);
    if (m) {
      years = parseInt(m[2] || m[1]);
      break;
    }
  }

  // Map years to level
  if (years !== null) {
    if (years <= 1) return 'entry';
    if (years <= 3) return 'junior';
    if (years <= 5) return 'mid';
    if (years <= 8) return 'senior';
    if (years <= 12) return 'staff';
    return 'principal';
  }

  // Fallback: check for explicit level keywords in text
  if (/\b(intern|internship|co-op)\b/i.test(t)) return 'intern';
  if (/\b(entry.?level|new grad|graduate|early career)\b/i.test(t)) return 'entry';
  if (/\b(junior|jr\.?|associate)\b/i.test(t) && !/senior/i.test(t)) return 'junior';
  if (/\b(staff|principal|distinguished)\b/i.test(t)) return 'staff';
  if (/\b(senior|sr\.?|lead)\b/i.test(t)) return 'senior';
  if (/\b(director|vp|head of|chief)\b/i.test(t)) return 'director';

  return null;  // Don't guess — return null if we can't determine
}

// ── Description quality validation ──
function isValidJobDescription(text) {
  if (!text || text.length < 150) return false;

  // Reject if it's mostly navigation/menu junk
  const words = text.split(/\s+/).length;
  if (words < 30) return false;

  // Must contain at least 2 job-related signals
  const signals = [
    /\b(responsibilit|qualificat|requirement|experience|about (?:the|this)|what you|we are|join us|role|position)\b/i,
    /\b(team|company|work with|collaborate|build|develop|manage|lead|drive)\b/i,
    /\b(salary|benefit|compensation|equity|bonus|remote|hybrid|full.time|part.time)\b/i,
    /\b(apply|submit|candidate|resume|cv|cover letter|interview)\b/i,
    /\b(years|degree|bachelor|master|education|certification)\b/i,
  ];
  const signalCount = signals.filter(p => p.test(text)).length;
  if (signalCount < 2) return false;

  // Reject cookie consent / login pages
  const junkPatterns = [
    /\b(accept cookies|cookie policy|privacy policy|sign in|log in|create account)\b/i,
    /\b(page not found|404|error|access denied|forbidden)\b/i,
  ];
  const junkHits = junkPatterns.filter(p => p.test(text)).length;
  // Allow 1 junk hit (footer might have cookie mention), reject if dominant
  if (junkHits >= 2) return false;
  if (junkHits >= 1 && signalCount < 3) return false;

  return true;
}

const failedDomains = new Map();

async function main() {
  console.time('Total');

  console.log('📥 Loading jobs...');
  const jobs = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('id, title, apply_url, tags')
      .or('description.is.null,description.eq.')
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    jobs.push(...data);
    from += 1000;
  }
  console.log(`📊 ${jobs.length} jobs to scrape\n`);
  if (!jobs.length) { console.log('✅ Nothing to do!'); return; }

  const browser = await chromium.launch({ headless: true });
  let scraped = 0, failed = 0, skipped = 0, junkRejected = 0, done = 0;
  const total = jobs.length;

  async function worker(id) {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });

    while (jobs.length > 0) {
      const job = jobs.shift();
      if (!job) break;
      done++;

      if (!job.apply_url) { failed++; continue; }

      let domain;
      try { domain = new URL(job.apply_url).hostname; } catch { failed++; continue; }
      const domFails = failedDomains.get(domain) || 0;
      if (domFails >= 5) { skipped++; continue; }

      try {
        const page = await ctx.newPage();
        await page.goto(job.apply_url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
        await page.waitForTimeout(1500);

        const text = await page.evaluate(() => {
          const sels = [
            '[class*="job-description"]', '[class*="posting-description"]',
            '[class*="ashby-job-posting"]', '[id="content"]',
            'article', 'main', '[class*="description"]',
          ];
          for (const s of sels) {
            const el = document.querySelector(s);
            if (el && el.innerText.length > 100) return el.innerText;
          }
          return document.body?.innerText || '';
        });

        await page.close();

        // Validate it's a real job description
        if (!isValidJobDescription(text)) {
          failedDomains.set(domain, domFails + 1);
          junkRejected++;
          continue;
        }

        const desc = text.substring(0, 5000);
        const update = { description: desc };

        // Always extract tags from description
        const tags = extractTags(`${job.title} ${desc}`);
        if (tags.length > 0) update.tags = tags;

        // Extract experience level from description
        const expLevel = extractExperienceLevel(desc);
        if (expLevel) update.experience_level = expLevel;

        // Save immediately
        await supabase.from('jobs').update(update).eq('id', job.id);
        scraped++;
      } catch {
        failedDomains.set(domain, domFails + 1);
        failed++;
      }

      if (done % 50 === 0) {
        process.stdout.write(`\r  ${done}/${total} | ✅ ${scraped} | ❌ ${failed} | 🚫 ${junkRejected} junk | ⏭️ ${skipped} skipped`);
      }
    }
    await ctx.close();
  }

  console.log(`🚀 ${CONCURRENCY} workers...\n`);
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
  await browser.close();

  console.log(`\n\n✅ Done: ${scraped} scraped | ${failed} failed | ${junkRejected} junk rejected | ${skipped} domain-skipped`);
  console.log(`📊 Blocked domains: ${[...failedDomains.entries()].filter(([,v]) => v >= 5).map(([d]) => d).join(', ')}`);
  console.timeEnd('Total');
}

main().catch(console.error);
