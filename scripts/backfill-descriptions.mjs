#!/usr/bin/env node
/**
 * backfill-descriptions.mjs — Scrapes missing job descriptions + re-tags
 *
 * Phase 1: Fetch jobs with null description, curl apply_url, extract text
 * Phase 2: Re-extract tags for jobs that have description but empty tags
 *
 * 50 concurrent workers, rate-limited per domain
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
);

const CONCURRENCY = 50;
const FETCH_TIMEOUT = 8000;

// ── Tech keywords (same as jobs-sync.mjs) ──
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
  'sales','marketing','finance','accounting','legal','hr','human resources',
  'operations','support','customer success','business development','partnerships',
  'analyst','recruiter','recruiting','talent','people ops','enablement',
  'content','copywriter','writer','editor','communications','pr',
  'revenue','growth','strategy','consulting','solutions',
  'devrel','developer relations','evangelist','community',
  'program manager','project manager','executive','vp','director',
  'engineering','engineer','architect','infrastructure','platform','sre','reliability',
  'qa','quality assurance','testing','test engineer','automation',
  'intern','internship',
  'frontend','backend','full stack','fullstack',
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

function extractTags(text) {
  if (!text) return [];
  const found = new Set();
  for (let i = 0; i < TECH_KEYWORDS.length; i++) {
    if (TECH_KEYWORDS[i].test(text)) found.add(KEYWORD_LABELS[i]);
  }
  return [...found];
}

function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDescription(html) {
  // Try JSON-LD first
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      try {
        const content = block.replace(/<\/?script[^>]*>/gi, '');
        const data = JSON.parse(content);
        const desc = data.description || data.jobDescription;
        if (desc && desc.length > 50) return htmlToText(desc).substring(0, 5000);
      } catch {}
    }
  }

  // ATS-specific patterns
  const patterns = [
    /<div[^>]*class="[^"]*ashby-job-posting-description[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
    /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>\s*<div/i,
    /<div[^>]*class="[^"]*posting-page[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*posting-apply/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*class="[^"]*job.?description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pat of patterns) {
    const m = html.match(pat);
    if (m && m[1]) {
      const text = htmlToText(m[1]);
      if (text.length > 100) return text.substring(0, 5000);
    }
  }

  // Fallback: body text
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const text = htmlToText(bodyMatch[1]);
    if (text.length > 200) return text.substring(0, 5000);
  }
  return null;
}

async function fetchURL(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(items, worker, concurrency) {
  let idx = 0, done = 0;
  const total = items.length;
  async function next() {
    while (idx < total) {
      const i = idx++;
      await worker(items[i], i);
      done++;
      if (done % 100 === 0 || done === total) {
        process.stdout.write(`\r  ${done}/${total} processed...`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
  console.log('');
}

async function batchUpdate(updates) {
  const BATCH = 50;
  let saved = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    await Promise.all(batch.map(u =>
      supabase.from('jobs').update(u.data).eq('id', u.id)
    ));
    saved += batch.length;
    if (saved % 500 === 0 || saved === updates.length) {
      process.stdout.write(`\r  ${saved}/${updates.length} saved...`);
    }
  }
  console.log('');
}

async function main() {
  console.time('Total');

  // ═══ Phase 1: Scrape missing descriptions ═══
  console.log('\n🔍 Phase 1: Loading jobs with missing descriptions...');
  const missingJobs = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('id, title, apply_url, tags')
      .or('description.is.null,description.eq.')
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    missingJobs.push(...data);
    from += 1000;
    process.stdout.write(`\r  Loaded ${missingJobs.length}...`);
  }
  console.log(`\n📊 ${missingJobs.length} jobs missing descriptions`);

  const descUpdates = [];
  let scraped = 0, failed = 0;

  console.log(`\n🌐 Scraping URLs (${CONCURRENCY} workers)...`);
  await runPool(missingJobs, async (job) => {
    if (!job.apply_url) { failed++; return; }
    const html = await fetchURL(job.apply_url);
    if (!html) { failed++; return; }
    const desc = extractDescription(html);
    if (!desc || desc.length < 50) { failed++; return; }

    const update = { description: desc.substring(0, 5000) };
    // Also tag if empty
    if (!job.tags || job.tags.length === 0) {
      update.tags = extractTags(`${job.title} ${desc}`);
    }
    descUpdates.push({ id: job.id, data: update });
    scraped++;
  }, CONCURRENCY);

  console.log(`✅ Scraped: ${scraped} | Failed: ${failed}`);

  if (descUpdates.length > 0) {
    console.log(`\n💾 Saving ${descUpdates.length} descriptions...`);
    await batchUpdate(descUpdates);
  }

  // ═══ Phase 2: Re-tag jobs with empty tags ═══
  console.log('\n🏷️  Phase 2: Loading jobs with empty tags...');
  const untaggedJobs = [];
  from = 0;
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('id, title, description')
      .not('description', 'is', null)
      .or('tags.is.null,tags.eq.{}')
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    untaggedJobs.push(...data);
    from += 1000;
  }
  console.log(`📊 ${untaggedJobs.length} jobs need tags`);

  const tagUpdates = [];
  for (const job of untaggedJobs) {
    const tags = extractTags(`${job.title} ${job.description || ''}`);
    if (tags.length > 0) tagUpdates.push({ id: job.id, data: { tags } });
  }

  if (tagUpdates.length > 0) {
    console.log(`\n💾 Saving ${tagUpdates.length} tag updates...`);
    await batchUpdate(tagUpdates);
  }

  console.log('\n✅ All done!');
  console.timeEnd('Total');
}

main().catch(console.error);
