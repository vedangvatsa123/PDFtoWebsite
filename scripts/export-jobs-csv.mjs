#!/usr/bin/env node
/**
 * Export all job listings from Supabase to CSV.
 * Row 1: Banner with clickable CTA link
 * Row 2: Column headers
 * Row 3+: Job data
 *
 * Usage: node scripts/export-jobs-csv.mjs
 * Output: scripts/cvinbio-jobs-export.csv
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Fetch all jobs in batches
const allJobs = [];
let page = 0;
const batchSize = 1000;

console.log('Fetching jobs from Supabase...');
while (true) {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, company, location, job_type, salary, tags, apply_url, category, source, published_at')
    .not('company', 'ilike', '%Gopuff%')
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(page * batchSize, (page + 1) * batchSize - 1);

  if (error) { console.error('Error:', error.message); break; }
  if (!data || data.length === 0) break;
  allJobs.push(...data);
  console.log(`  Fetched ${allJobs.length} jobs...`);
  if (data.length < batchSize) break;
  page++;
}

console.log(`Total: ${allJobs.length} jobs from ${new Set(allJobs.map(j => j.company)).size} companies`);

// CSV helper
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Build CSV
const lines = [];

// Row 1: Banner
lines.push(csvEscape('🚀 Turn your CV into a shareable website in seconds — https://cvin.bio — Free, AI-powered, instant.'));

// Row 2: Headers
const headers = ['Title', 'Company', 'Location', 'Job Type', 'Salary', 'Skills/Tags', 'Category', 'Source', 'Published', 'Apply Link'];
lines.push(headers.map(csvEscape).join(','));

// Row 3+: Data
for (const job of allJobs) {
  const row = [
    job.title,
    job.company,
    job.location,
    job.job_type || '',
    job.salary || '',
    Array.isArray(job.tags) ? job.tags.join('; ') : (job.tags || ''),
    job.category || '',
    job.source || '',
    job.published_at ? new Date(job.published_at).toISOString().split('T')[0] : '',
    job.apply_url || '',
  ];
  lines.push(row.map(csvEscape).join(','));
}

const outPath = resolve(__dirname, 'cvinbio-jobs-export.csv');
writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`\n✅ Exported to ${outPath}`);
console.log(`   ${allJobs.length} jobs, ${new Set(allJobs.map(j => j.company)).size} companies`);
