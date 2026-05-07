// Telegram AI Jobs Poster — posts daily AI/ML job roundup to @hashtag_ai
//
// Pulls from the same Supabase jobs DB, but filters for:
//  1. AI/ML-relevant titles (engineer, researcher, scientist, etc.)
//  2. Famous AI companies only (top-tier labs + infra + apps)
//
// Env: TELEGRAM_AI_BOT_TOKEN, TELEGRAM_AI_CHANNEL_ID, SUPABASE_URL, SUPABASE_KEY
// Usage: node telegram-ai-jobs.mjs [--dry-run]

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Config ──────────────────────────────────────────────────────────────────
const BOT_TOKEN  = process.env.TELEGRAM_AI_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_AI_CHANNEL_ID || '@hashtag_ai';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('TELEGRAM_AI_BOT_TOKEN not set. Skipping.');
  process.exit(0);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const JOBS_PER_POST = 5;
const FETCH_LIMIT = 1000;
const DEDUP_FILE = resolve(__dirname, '.telegram-ai-jobs-posted.json');
const DEDUP_MAX = 500;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Famous AI companies (only these get posted) ─────────────────────────────
const AI_COMPANIES = new Set([
  // Frontier labs
  'openai', 'anthropic', 'deepmind', 'google deepmind', 'meta', 'xai',
  'mistral', 'cohere', 'inflection', 'character', 'reka', 'aleph alpha',
  'stability ai', 'midjourney',
  // AI infrastructure
  'nvidia', 'databricks', 'scale ai', 'coreweave', 'lambda',
  'cerebras', 'groq', 'sambanova', 'tenstorrent', 'graphcore', 'd-matrix',
  'together ai', 'fireworks', 'anyscale', 'modal', 'baseten', 'replicate',
  'hugging face', 'weights & biases', 'wandb', 'langchain', 'pinecone',
  'weaviate', 'vectara', 'unstructured', 'arize',
  // AI applications
  'cursor', 'perplexity', 'replit', 'jasper', 'grammarly', 'descript',
  'elevenlabs', 'synthesia', 'heygen', 'runway', 'pika', 'ideogram',
  'suno', 'udio', 'livekit', 'deepgram', 'moveworks', 'cresta',
  'cognition', 'sierra', 'poolside', 'contextual ai', 'tavus',
  'abnormal security', 'observe ai', 'c3 ai', 'datarobot', 'snorkel',
  // AI robotics / AV / frontier
  'waymo', 'cruise', 'nuro', 'figure', 'skydio', 'shield ai',
  'physical intelligence', 'sanctuary ai', 'insitro', 'pathai',
  // Big tech AI divisions
  'google', 'apple', 'microsoft', 'amazon', 'meta', 'tesla',
]);

function isAICompany(company) {
  const c = company.toLowerCase().trim();
  for (const name of AI_COMPANIES) {
    if (c.includes(name) || name.includes(c)) return true;
  }
  return false;
}

// ─── AI/ML title patterns ────────────────────────────────────────────────────
const AI_TITLE_RE = /\b(ai\b|artificial intelligence|machine learning|ml\b|deep learning|llm|nlp\b|natural language|computer vision|cv\b|generative|gen\s*ai|foundation model|large language|diffusion|transformer|neural|reinforcement learning|rl\b|speech|perception|autonomy|autonomous|robotics|data scien|research scien|research engineer|applied scien|ml engineer|ml ops|mlops|ai engineer|ai research|ai product|ai safety|alignment|model (train|eval|deploy|infra)|prompt engineer|inference|gpu|cuda|pytorch|tensorflow|jax\b|model.*engineer|train.*engineer)/i;

// ─── Skip patterns (non-tech roles) ──────────────────────────────────────────
const SKIP_RE = /\b(intern|co-?op|contractor|part.time|bounty|mechanic|nurse|driver|warehouse|retail|janitor|cashier|barista|therapist|physician|dentist|pharmacist|veterinarian|cook|chef|welder|carpenter|electrician|plumber|hvac|maintenance|technician|assembl|production|operator|seasonal|1099|security guard|dispatcher|delivery|forklift|custodian)\b/i;

// ─── Dedup tracking ──────────────────────────────────────────────────────────
function loadPosted() {
  try {
    if (existsSync(DEDUP_FILE)) {
      return JSON.parse(readFileSync(DEDUP_FILE, 'utf8'));
    }
  } catch { /* start fresh */ }
  return [];
}

function savePosted(urls) {
  // Keep only last DEDUP_MAX entries
  const trimmed = urls.slice(-DEDUP_MAX);
  writeFileSync(DEDUP_FILE, JSON.stringify(trimmed, null, 2));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function decodeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHTML(text) {
  if (!text) return '';
  const decoded = decodeHTML(text);
  return decoded
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const BRAND_CASE = {
  'openai': 'OpenAI', 'deepmind': 'DeepMind', 'xai': 'xAI',
  'langchain': 'LangChain', 'deepgram': 'Deepgram', 'pinecone': 'Pinecone',
  'hugging face': 'Hugging Face', 'elevenlabs': 'ElevenLabs',
  'coreweave': 'CoreWeave', 'databricks': 'Databricks',
  'perplexity': 'Perplexity', 'grammarly': 'Grammarly',
  'anthropic': 'Anthropic', 'midjourney': 'Midjourney',
  'stability ai': 'Stability AI', 'together ai': 'Together AI',
  'cerebras': 'Cerebras', 'sambanova': 'SambaNova',
  'synthesia': 'Synthesia', 'descript': 'Descript',
  'scale ai': 'Scale AI', 'cognition': 'Cognition',
  'replit': 'Replit', 'cursor': 'Cursor',
  'nvidia': 'NVIDIA', 'google': 'Google', 'apple': 'Apple',
  'microsoft': 'Microsoft', 'amazon': 'Amazon', 'meta': 'Meta',
  'tesla': 'Tesla', 'waymo': 'Waymo',
};

function cleanCompany(name) {
  if (!name) return '';
  let clean = decodeHTML(name)
    .replace(/[,\s]+(?:Inc\.?|LLC|Ltd\.?|Corp\.?|GmbH|Pty\.?|Co\.?|PLC|AG|SE)\.?\s*$/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();
  const key = clean.toLowerCase();
  if (BRAND_CASE[key]) clean = BRAND_CASE[key];
  // Break domain-like names
  if (clean.includes('.')) clean = clean.replace(/\.([a-z]{2,6})$/i, '\u200B.$1');
  return clean || decodeHTML(name);
}

function cleanLocation(loc) {
  if (!loc) return 'Remote';
  let clean = decodeHTML(loc);
  // Shorten verbose locations: "San Francisco, CA, United States" → "San Francisco, CA"
  clean = clean.replace(/,\s*(United States|USA|US|United Kingdom|UK|Canada|Australia|Germany|France)\s*$/i, '');
  clean = clean.replace(/\s*\(.*?\)/g, '');
  return clean.trim() || 'Remote';
}

// ─── Fetch AI jobs from Supabase ─────────────────────────────────────────────
const ALLOWED_SOURCES = ['greenhouse', 'ashby', 'lever', 'workable', 'remoteok'];

async function fetchJobs() {
  const sourceFilter = ALLOWED_SOURCES.map(s => `"${s}"`).join(',');
  const params = new URLSearchParams({
    select: 'id,title,company,location,apply_url,source',
    'source': `in.(${sourceFilter})`,
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
    throw new Error(`Supabase fetch failed: ${res.status} ${err}`);
  }

  return res.json();
}

// ─── Pick 5 AI jobs (one per company, spread across different orgs) ──────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickJobs(jobs, postedUrls) {
  const postedSet = new Set(postedUrls);
  const companySeen = new Set();
  const picked = [];

  // Filter → AI company + AI title + not skipped + not already posted
  const candidates = shuffle(jobs).filter(job => {
    if (!job.company || !job.title || !job.apply_url) return false;
    if (postedSet.has(job.apply_url)) return false;
    if (SKIP_RE.test(job.title)) return false;
    if (!isAICompany(job.company)) return false;
    if (!AI_TITLE_RE.test(job.title)) return false;
    // Skip non-English titles
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]/.test(job.title)) return false;
    return true;
  });

  // One per company first
  for (const job of candidates) {
    if (picked.length >= JOBS_PER_POST) break;
    const key = job.company.toLowerCase().trim();
    if (companySeen.has(key)) continue;
    companySeen.add(key);
    picked.push(job);
  }

  // If still under limit, allow duplicates from different companies
  if (picked.length < JOBS_PER_POST) {
    for (const job of candidates) {
      if (picked.length >= JOBS_PER_POST) break;
      if (picked.some(p => p.apply_url === job.apply_url)) continue;
      picked.push(job);
    }
  }

  return picked;
}

// ─── Format Telegram message ─────────────────────────────────────────────────
function formatMessage(jobs) {
  const lines = [];

  for (const job of jobs) {
    const title = escapeHTML(decodeHTML(job.title));
    const company = escapeHTML(cleanCompany(job.company));
    const location = escapeHTML(cleanLocation(job.location));
    const url = escapeHTML(job.apply_url);

    lines.push(`<a href="${url}"><b>${title}</b></a>`);
    lines.push(`${company} · ${location}`);
    lines.push('');
  }

  lines.push('_');
  lines.push('AI Discussion Group: t.me/hashtag_ai');

  return lines.join('\n');
}

// ─── Send via Telegram Bot API ───────────────────────────────────────────────
async function sendTelegram(text) {
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

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🤖 Telegram AI Jobs Poster');
  console.log(`  Channel: ${CHANNEL_ID}`);
  console.log(`  Dry run: ${DRY_RUN}`);

  // 1. Load dedup history
  const postedUrls = loadPosted();
  console.log(`  Previously posted: ${postedUrls.length} jobs`);

  // 2. Fetch all jobs
  const allJobs = await fetchJobs();
  console.log(`  Fetched: ${allJobs.length} jobs from DB`);

  // 3. Pick 5 AI jobs
  const jobs = pickJobs(allJobs, postedUrls);
  console.log(`  Picked: ${jobs.length} AI jobs`);

  if (jobs.length === 0) {
    console.log('  No new AI jobs to post. Done.');
    return;
  }

  // 4. Preview
  for (const job of jobs) {
    console.log(`  • ${cleanCompany(job.company)} — ${job.title}`);
  }

  // 5. Format and send
  const message = formatMessage(jobs);
  console.log(`  Message: ${message.length} chars`);
  console.log('---');
  console.log(message.replace(/<[^>]*>/g, ''));
  console.log('---');

  if (!DRY_RUN) {
    const result = await sendTelegram(message);
    console.log(`  ✅ Posted. Message ID: ${result.message_id}`);
  } else {
    console.log('  🏜️  Dry run — skipped posting.');
  }

  // 6. Update dedup file
  const newUrls = [...postedUrls, ...jobs.map(j => j.apply_url)];
  savePosted(newUrls);
  console.log(`  Saved ${newUrls.length} total URLs to dedup file.`);
}

main().catch(e => {
  console.error('❌ AI Jobs post failed:', e.message);
  process.exit(1);
});
