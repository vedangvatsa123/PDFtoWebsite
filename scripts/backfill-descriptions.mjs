#!/usr/bin/env node
/**
 * Aggressive backfill for remaining missing descriptions.
 * - SmartRecruiters: HTML scrape with itemprop="description"
 * - Greenhouse failures: direct page fetch
 * - Lever: direct page fetch
 * 50 concurrent workers.
 */
import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const CONCURRENCY = 50;
const TIMEOUT = 10000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

// ── Fetch HTML page and extract description ──
async function fetchPageDesc(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      signal: AbortSignal.timeout(TIMEOUT),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Strategy 1: itemprop="description" (SmartRecruiters)
    let m = html.match(/<div[^>]*itemprop="description"[^>]*>([\s\S]*?)(?:<\/div>\s*<\/main>|<footer)/i);
    if (m && m[1].length > 100) return m[1];
    
    // Strategy 2: posting-description (Lever)
    m = html.match(/<div[^>]*class="[^"]*posting-page[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*postings-btn-wrapper/i);
    if (m && m[1].length > 100) return m[1];
    
    // Strategy 3: content section from Greenhouse custom domains
    m = html.match(/<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
    if (m && m[1].length > 100) return m[1];
    
    // Strategy 4: application/ld+json
    m = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (m) {
      try {
        const json = JSON.parse(m[1]);
        if (json.description && json.description.length > 50) return json.description;
      } catch {}
    }
    
    // Strategy 5: og:description meta tag (last resort, usually short)
    m = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);
    if (m && m[1].length > 100) return m[1];
    
    // Strategy 6: meta description
    m = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
    if (m && m[1].length > 100) return m[1];
    
    return null;
  } catch { return null; }
}

// ── Process in batches with concurrency ──
async function processBatch(jobs, label) {
  let success = 0, fail = 0;
  const total = jobs.length;
  
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (job) => {
        const desc = await fetchPageDesc(job.apply_url);
        if (desc && desc.trim().length > 50) {
          const { error } = await supabase
            .from('jobs')
            .update({ description: desc })
            .eq('id', job.id);
          if (!error) { success++; return; }
        }
        fail++;
      })
    );
    process.stdout.write(`  ${label}: ${i + batch.length}/${total} (${success} filled, ${fail} failed)\r`);
  }
  console.log(`\n  ${label}: Done — ${success} filled, ${fail} failed`);
  return success;
}

// ═══════════════ MAIN ═══════════════
console.log('=== Aggressive description backfill (50 concurrent) ===\n');

// Fetch all jobs still missing descriptions
async function fetchMissing(source) {
  const jobs = [];
  let page = 0;
  while (true) {
    const { data } = await supabase.from('jobs')
      .select('id, apply_url, company')
      .eq('source', source)
      .is('description', null)
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || !data.length) break;
    jobs.push(...data);
    page++;
  }
  return jobs;
}

const srJobs = await fetchMissing('smartrecruiters');
const ghJobs = await fetchMissing('greenhouse');
const leverJobs = await fetchMissing('lever');
const ashbyJobs = await fetchMissing('ashby');

console.log(`SmartRecruiters: ${srJobs.length} missing`);
console.log(`Greenhouse: ${ghJobs.length} missing`);
console.log(`Lever: ${leverJobs.length} missing`);
console.log(`Ashby: ${ashbyJobs.length} missing`);

let totalFilled = 0;

if (srJobs.length > 0) {
  console.log(`\nBackfilling SmartRecruiters...`);
  totalFilled += await processBatch(srJobs, 'SR');
}

if (ghJobs.length > 0) {
  console.log(`\nBackfilling Greenhouse (page scrape for remaining failures)...`);
  totalFilled += await processBatch(ghJobs, 'GH');
}

if (leverJobs.length > 0) {
  console.log(`\nBackfilling Lever...`);
  totalFilled += await processBatch(leverJobs, 'Lever');
}

if (ashbyJobs.length > 0) {
  console.log(`\nBackfilling Ashby...`);
  totalFilled += await processBatch(ashbyJobs, 'Ashby');
}

console.log(`\n✅ Total: ${totalFilled} descriptions filled`);
console.log('Re-run: node scripts/export-jobs-csv.mjs');
