#!/usr/bin/env node
/**
 * enrich-from-ats.mjs — Fetch company descriptions from their actual ATS pages
 *
 * BambooHR:  https://company.bamboohr.com/careers → meta description
 * Ashby:     https://jobs.ashbyhq.com/company → meta description  
 * Lever:     https://jobs.lever.co/company → meta description
 * Greenhouse: careers page URL → meta description
 *
 * 100 parallel workers
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
);

const OUTPUT = path.join(__dirname, '..', 'src', 'lib', 'company-descriptions.json');

let existing = {};
try { existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf8')); } catch {}

function htmlDecode(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Extract meta description from HTML
function extractMeta(html) {
  for (const pattern of [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']{15,500})["']/i,
    /<meta[^>]*content=["']([^"']{15,500})["'][^>]*name=["']description["']/i,
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']{15,500})["']/i,
    /<meta[^>]*content=["']([^"']{15,500})["'][^>]*property=["']og:description["']/i,
  ]) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const desc = htmlDecode(match[1]).trim();
      // Filter out generic ATS descriptions
      if (desc.length > 20
        && !desc.startsWith('http')
        && !/^(Find|Browse|Search|Apply|View|See) (all |open )?jobs/i.test(desc)
        && !/^(Current|Open) (job )?(openings|positions)/i.test(desc)
      ) return desc;
    }
  }
  return null;
}

// Build the ATS page URL from apply_url
function getAtsPageUrl(applyUrl, source) {
  try {
    const url = new URL(applyUrl);
    
    if (source === 'bamboohr' || url.hostname.includes('bamboohr.com')) {
      // company.bamboohr.com/careers/123 → company.bamboohr.com/careers
      return `https://${url.hostname}/careers`;
    }
    
    if (source === 'ashby' || url.hostname === 'jobs.ashbyhq.com') {
      // jobs.ashbyhq.com/company/uuid → jobs.ashbyhq.com/company
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0]) return `https://jobs.ashbyhq.com/${parts[0]}`;
    }
    
    if (source === 'lever' || url.hostname === 'jobs.lever.co') {
      // jobs.lever.co/company/uuid → jobs.lever.co/company
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0]) return `https://jobs.lever.co/${parts[0]}`;
    }
    
    if (source === 'greenhouse') {
      // boards.greenhouse.io/company/jobs/123 → boards.greenhouse.io/company
      if (url.hostname.includes('greenhouse.io')) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0]) return `https://${url.hostname}/${parts[0]}`;
      }
      // careers.company.com/job/123 → careers.company.com
      if (url.hostname.startsWith('careers.')) {
        return `https://${url.hostname}`;
      }
      // company.com/jobs/123 → company.com
      return `https://${url.hostname}`;
    }

    if (source === 'workable' || url.hostname.includes('workable.com')) {
      // apply.workable.com/company/j/xxx → apply.workable.com/company
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0]) return `https://apply.workable.com/${parts[0]}`;
    }
    
    if (source === 'personio' || url.hostname.includes('personio.de')) {
      return `https://${url.hostname}`;
    }

    if (source === 'breezy' || url.hostname.includes('breezy.hr')) {
      return `https://${url.hostname}`;
    }
    
    // Generic: try the base domain
    return `https://${url.hostname}`;
  } catch { return null; }
}

async function fetchDescription(pageUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    while (size < 40000) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    try { reader.cancel(); } catch {}
    const html = chunks.map(c => new TextDecoder().decode(c)).join('');

    // Try meta tags first
    const meta = extractMeta(html);
    if (meta) return meta;

    // For BambooHR/Ashby/Lever: try to extract intro text from page body
    const bodyText = stripHtml(html);
    
    // Look for "About" section
    const aboutMatch = bodyText.match(/About\s+(?:Us|the\s+Company)[:\s]+(.{30,400})/i);
    if (aboutMatch?.[1]) {
      const sentences = aboutMatch[1].match(/[^.!?]+[.!?]+/g);
      if (sentences) return sentences.slice(0, 3).join(' ').trim();
    }

    return null;
  } catch { return null; }
}

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

async function main() {
  console.log('📊 Fetching missing companies from DB...');

  const companyData = {};  // slug -> { name, source, atsPageUrl }
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('company, source, apply_url')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    data.forEach(j => {
      if (!j.company) return;
      const slug = toSlug(j.company);
      if (existing[slug]) return;  // already enriched
      if (companyData[slug]) return;  // already seen
      const atsUrl = getAtsPageUrl(j.apply_url, j.source);
      if (atsUrl) {
        companyData[slug] = { name: j.company, source: j.source, atsPageUrl: atsUrl };
      }
    });
    if (data.length < 1000) break;
    page++;
  }

  const slugs = Object.keys(companyData);
  console.log(`  ${slugs.length} missing companies with ATS page URLs\n`);

  if (slugs.length === 0) { console.log('✅ All enriched!'); return; }

  const results = { ...existing };
  let hits = 0, misses = 0;
  const startTime = Date.now();

  // Process in batches of 100
  const BATCH = 100;
  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH);
    await Promise.all(batch.map(async (slug) => {
      const cd = companyData[slug];
      const desc = await fetchDescription(cd.atsPageUrl);
      if (desc) {
        results[slug] = desc;
        hits++;
      } else {
        misses++;
      }
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ⏳ ${Math.min(i + BATCH, slugs.length)}/${slugs.length} in ${elapsed}s | hits:${hits} miss:${misses}`);

    // Save every 500
    if ((i + BATCH) % 500 < BATCH) {
      fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
      console.log(`  💾 Saved (${Object.keys(results).length} total)`);
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log(`\n✅ Done! ${Object.keys(results).length} total companies enriched`);
  console.log(`   ATS pages hit: ${hits} | Miss: ${misses}`);
  console.log(`   Saved to: ${OUTPUT}`);
}

main().catch(console.error);
