// Telegram Job Poster — posts latest jobs to a Telegram channel
// Piggybacks on the existing 3x/day cron (zero extra compute)
// Telegram Bot API is 100% free with no rate limits for channel posting
//
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, SUPABASE_URL, SUPABASE_KEY

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set. Skipping.');
  process.exit(0);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const JOBS_PER_POST = 10;
const FETCH_LIMIT = 100; // fetch extra to allow company dedup
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Helpers ───────────────────────────────────────────────────────────────

function escapeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(text, max = 60) {
  if (!text || text.length <= max) return text || '';
  return text.substring(0, max - 1) + '…';
}

// ── Fetch unposted jobs from Supabase ────────────────────────────────────

async function fetchUnpostedJobs() {
  const params = new URLSearchParams({
    select: 'id,title,company,location,apply_url',
    'telegram_posted_at': 'is.null',
    order: 'created_at.desc',
    limit: String(FETCH_LIMIT),
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch jobs: ${res.status} ${err}`);
  }

  return res.json();
}

// ── Pick jobs: 2+ remote, 1 per company, diverse locations ───────────────

function isRemote(loc) {
  return !loc || loc.toLowerCase().includes('remote');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickJobs(jobs, limit) {
  const seen = new Set();
  const remote = [];
  const nonRemote = [];

  for (const job of jobs) {
    const key = job.company.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    if (isRemote(job.location)) {
      remote.push(job);
    } else {
      nonRemote.push(job);
    }
  }

  // Guarantee at least 2 remote, fill rest with non-remote
  const minRemote = Math.min(2, remote.length);
  const picked = remote.slice(0, minRemote);
  const remaining = limit - picked.length;

  // Fill with non-remote first, then overflow remote
  picked.push(...nonRemote.slice(0, remaining));
  if (picked.length < limit) {
    picked.push(...remote.slice(minRemote, minRemote + (limit - picked.length)));
  }

  return picked.slice(0, limit);
}

// ── Mark jobs as posted ──────────────────────────────────────────────────

async function markJobsPosted(jobIds) {
  const now = new Date().toISOString();

  for (let i = 0; i < jobIds.length; i += 50) {
    const batch = jobIds.slice(i, i + 50);
    const idFilter = batch.map(id => `"${id}"`).join(',');

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?id=in.(${idFilter})`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ telegram_posted_at: now }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`  Failed to mark batch as posted: ${err}`);
    }
  }
}

// ── Format the Telegram message ──────────────────────────────────────────

function formatJobsMessage(jobs) {
  const lines = [];

  for (const job of jobs) {
    const title = truncate(job.title, 60);
    const company = escapeHTML(job.company);
    const url = escapeHTML(job.apply_url);

    lines.push(`• ${company} is hiring <a href="${url}">${escapeHTML(title)}</a>`);
  }

  lines.push('');
  lines.push('—');
  lines.push('Turn your CV into a Website: <a href="https://cvin.bio/jobs">cvin.bio/jobs</a>');

  return lines.join('\n');
}

// ── Send message via Telegram Bot API ────────────────────────────────────

async function sendTelegramMessage(text) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description} (code: ${data.error_code})`);
  }

  return data.result;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('Telegram Job Poster');
  console.log(`  Channel: ${CHANNEL_ID}`);

  // 1. Fetch unposted jobs (grab extra for dedup headroom)
  const allJobs = await fetchUnpostedJobs();

  if (allJobs.length === 0) {
    console.log('  No new jobs to post.');
    return;
  }

  // 2. Shuffle for source diversity, then pick: 2+ remote, 1 per company
  const jobs = pickJobs(shuffle(allJobs), JOBS_PER_POST);
  const remoteCount = jobs.filter(j => isRemote(j.location)).length;
  console.log(`  ${allJobs.length} unposted -> ${jobs.length} picked (${remoteCount} remote)`);

  // 3. Format and send
  const message = formatJobsMessage(jobs);
  console.log(`  Message: ${message.length} chars`);

  if (message.length > 4096) {
    const half = Math.ceil(jobs.length / 2);
    await sendTelegramMessage(formatJobsMessage(jobs.slice(0, half)));
    await new Promise(r => setTimeout(r, 1000));
    await sendTelegramMessage(formatJobsMessage(jobs.slice(half)));
    console.log('  Posted in 2 batches');
  } else {
    const result = await sendTelegramMessage(message);
    console.log(`  Posted. Message ID: ${result.message_id}`);
  }

  // 4. Mark ALL fetched jobs as posted (not just the 10 picked)
  //    This prevents the skipped duplicates from clogging the queue
  const allIds = allJobs.map(j => j.id);
  await markJobsPosted(allIds);
  console.log(`  Marked ${allIds.length} jobs as posted`);
}

main().catch(e => {
  console.error('Telegram post failed:', e.message);
  process.exit(1);
});
