// Telegram Job Poster — posts latest jobs to a Telegram channel
// Piggybacks on the existing 3x/day cron (zero extra compute)
// Telegram Bot API is 100% free with no rate limits for channel posting
//
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, SUPABASE_URL, SUPABASE_KEY

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// ─── Banned Jobs Filter (must match jobs-sync.mjs) ───
const BANNED_PATTERNS = [
  '\\btherapists?\\b', '\\bpsychiatric\\b', '\\bpsychiatrist\\b', '\\bnurse\\b',
  '\\bphysician\\b', '\\bmedical assistant\\b', '\\bphlebotomist\\b',
  '\\bbehavior technician\\b', '\\brbt\\b', '\\bretail ambassador\\b',
  '\\bstore (opening|associate|manager|lead|director)\\b', '\\bbarista\\b',
  '\\bjanitor\\b', '\\bcashier\\b', '\\bbookkeeper\\b', '\\bhvac\\b',
  '\\bplumbing\\b', '\\bplumber\\b', '\\bwarehouse\\b',
  '\\bdelivery driver\\b', '\\btruck driver\\b', '\\bteacher\\b', '\\btutor\\b',
  '\\bcaregiver\\b', '\\bnanny\\b', '\\bhousekeeper\\b', '\\bcleaner\\b',
  '\\bdentist\\b', '\\bdental\\b', '\\bpharmacist\\b', '\\bpharmacy\\b',
  '\\bparamedic\\b', '\\bsurgeon\\b', '\\bclinician\\b', '\\boptometrist\\b',
  '\\bveterinarian\\b', '\\bveterinary\\b', '\\bmassage\\b', '\\besthetician\\b',
  '\\bsalon\\b', '\\bspa\\b', '\\bfitness instructor\\b', '\\bpersonal trainer\\b',
  '\\bpastor\\b', '\\bclergy\\b', '\\bmechanic\\b', '\\bforklift\\b',
  '\\bbartender\\b', '\\bwaiter\\b', '\\bwaitress\\b', '\\bchef\\b', '\\bcook\\b',
  '\\bdishwasher\\b', '\\bbusser\\b', '\\bhostess\\b', '\\bcounselor\\b',
  '\\bpainter\\b', '\\bcarpenter\\b', '\\belectrician\\b', '\\bwelder\\b',
  '\\bmason\\b', '\\bconstruction\\b', '\\bsecurity guard\\b', '\\bbouncer\\b',
  '\\bkeyholder\\b', '\\bretail\\b', '\\bdispensary\\b',
  '\\bpsychologist\\b', '\\bdashmart\\b',
  '\\bshift (supervisor|leader|manager)\\b', '\\bcall center\\b',
  '\\bsoldering\\b', '\\bmanufacturing\\b', '\\brobot operator\\b',
  '\\bequipment operator\\b', '\\bassembl\\w*\\b', '\\bfactory\\b',
  '\\bdispatcher\\b', '\\bdriver\\b', '\\bdelivery\\b',
  '\\binventory\\b', '\\breceiving\\b', '\\bfulfillment\\b',
  '\\btechnician\\b', '\\bbrand ambassador\\b', '\\bpart.time\\b',
  '\\bseasonal\\b', '\\b1099\\b',
  // Additional patterns for junk that was slipping through
  '\\bforeman\\b', '\\bforewoman\\b', '\\bjourneyman\\b',
  '\\banimal\\b', '\\bhusbandry\\b', '\\binfusion\\b', '\\bmicrobiology\\b',
  '\\blaboratory tech\\b', '\\blab tech\\b',
  '\\bfield service\\b', '\\bfield tech\\b',
  '\\bshop tech\\b', '\\bservice tech\\b',
  '\\binstaller\\b', '\\bfabricator\\b', '\\bmaintenance\\b',
  '\\broofing\\b', '\\bpaving\\b', '\\bexcavat\\b', '\\blandscap\\b',
  '\\bpipefitter\\b', '\\bironworker\\b', '\\bscaffold\\b',
  '\\bconcrete\\b', '\\bdrywall\\b', '\\binsulation\\b',
  '\\bsales rep\\b', '\\bsales associate\\b',
  '\\bstore manager\\b', '\\bassistant.*manager\\b',
  '\\bRN\\b', '\\bLPN\\b', '\\bCNA\\b', '\\bEMT\\b',
  '\\bcustodian\\b', '\\bgroundskeeper\\b',
  // Round 3
  '\\bproduction\\b', '\\boperator\\b', '\\bpilot\\b', '\\bsurvey\\b',
  '\\bsupply chain\\b', '\\bgrounds\\b', '\\bline tech\\b',
  '\\bcurb\\b', '\\bpowerline\\b', '\\bice cream\\b',
  '\\bhelicopter\\b', '\\bautocad\\b',
  '\\boriginations?\\b', '\\bmetal\\b', '\\bprep\\b',
  '\\btelemedicine\\b',
];
const BANNED_REGEX = new RegExp(BANNED_PATTERNS.join('|'), 'i');

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
const FETCH_LIMIT = 500; // fetch extra to allow company dedup
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Helpers ───────────────────────────────────────────────────────────────

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
  // Decode first to prevent double-encoding, then re-escape
  const decoded = decodeHTML(text);
  return decoded
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Known brands whose casing can't be derived from title case
const BRAND_CASE = {
  'deepl': 'DeepL',
  'deepmind': 'DeepMind',
  'openai': 'OpenAI',
  'mongodb': 'MongoDB',
  'webflow': 'Webflow',
  'clickup': 'ClickUp',
  'linkedin': 'LinkedIn',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'bitgo': 'BitGo',
  'coinbase': 'Coinbase',
  'okx': 'OKX',
  'bybit': 'Bybit',
  'sofi': 'SoFi',
  'postman': 'Postman',
  'langchain': 'LangChain',
  'datadog': 'Datadog',
  'snowflake': 'Snowflake',
  'hashicorp': 'HashiCorp',
  'devrev': 'DevRev',
  'airbnb': 'Airbnb',
  'infobip': 'Infobip',
  'hubspot': 'HubSpot',
  'shopify': 'Shopify',
  'cloudflare': 'Cloudflare',
  'nerdwallet': 'NerdWallet',
  'mckinsey': 'McKinsey',
  'descript': 'Descript',
  'synthesia': 'Synthesia',
  'pinecone': 'Pinecone',
  'deepgram': 'Deepgram',
  'supabase': 'Supabase',
  'perplexity': 'Perplexity',
  'replit': 'Replit',
  'taskrabbit': 'TaskRabbit',
  'servicenow': 'ServiceNow',
  'airwallex': 'Airwallex',
  'gopuff': 'Gopuff',
};

function titleCase(str) {
  if (!str) return '';
  // Don't title-case ALL-CAPS acronyms (e.g. "OKX", "AWS")
  if (str === str.toUpperCase() && str.length <= 5) return str;
  return str
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function cleanCompany(name) {
  if (!name) return '';
  let clean = decodeHTML(name);
  // Strip legal suffixes (require space/comma before suffix to avoid matching word endings like 'Wise')
  clean = clean
    .replace(/[,\s]+(?:Inc\.?|LLC|Ltd\.?|Corp\.?|GmbH|S\.?R\.?L\.?|Pty\.?|Co\.?|PLC|AG|SE)\.?\s*$/i, '')
    .replace(/\s+(Infrastructure|Technology|Technologies|Solutions|Services|Digital|Software|Global|Group|International)\s*&.*$/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s+\d+$/, '') // Strip trailing numbers like "Shopback 2"
    .trim();
  // Fix capitalization: check brand map first, then title-case
  const key = clean.toLowerCase();
  if (BRAND_CASE[key]) {
    clean = BRAND_CASE[key];
  } else if (clean === clean.toLowerCase()) {
    // Only title-case if the name is all-lowercase (don't touch mixed case like "ServiceNow")
    clean = titleCase(clean);
  }
  // Break domain-like names so Telegram doesn't auto-link (e.g. Expatfile.tax)
  if (clean.includes('.')) {
    clean = clean.replace(/\.([a-z]{2,6})$/i, '\u200B.$1');
  }
  return clean || decodeHTML(name);
}

function cleanTitle(title) {
  if (!title) return '';
  let clean = decodeHTML(title);
  // Remove ALL parenthetical content (closed parens)
  clean = clean.replace(/\s*\(.*?\)/g, '');
  // Remove unclosed parentheticals like "(React Native" with no closing )
  clean = clean.replace(/\s*\([^)]*$/, '');
  // Remove everything after separators (hyphen/en-dash with >=1 space, em-dash, pipe, or colon)
  clean = clean.replace(/(?:\s+[-–]\s*|\s*[-–]\s+|—|\||\s*:\s).*$/, '');
  // Remove comma-separated department qualifiers like ", Post-Training" or ", Brand & Communications"
  clean = clean.replace(/,\s+[A-Z][a-zA-Z\s&/\-]+$/, '');
  return clean.trim() || decodeHTML(title);
}

function truncate(text, max = 60) {
  if (!text || text.length <= max) return text || '';
  return text.substring(0, max - 1) + '…';
}

// ── Fetch unposted jobs from Supabase ────────────────────────────────────
// Only fetch from curated sources — BambooHR excluded (unfiltered junk)
const TELEGRAM_ALLOWED_SOURCES = ['greenhouse', 'ashby', 'lever', 'workable', 'remoteok'];

async function fetchUnpostedJobs() {
  const sourceFilter = TELEGRAM_ALLOWED_SOURCES.map(s => `"${s}"`).join(',');
  const params = new URLSearchParams({
    select: 'id,title,company,location,apply_url,source',
    'telegram_posted_at': 'is.null',
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

// ── Priority companies — big names drive reshares ────────────────────────
const PRIORITY_COMPANIES = new Set([
  'airbnb','anthropic','stripe','coinbase','databricks','discord','dropbox','figma',
  'gitlab','google','meta','microsoft','apple','amazon','netflix','openai','shopify',
  'slack','snap','spotify','square','tiktok','uber','vercel','cloudflare','datadog',
  'twilio','reddit','pinterest','linkedin','oracle','salesforce','adobe','nvidia',
  'palantir','robinhood','ripple','binance','plaid','brex','ramp','mercury','chime',
  'affirm','klarna','revolut','wise','deel','remote','notion','linear','retool',
  'supabase','mongodb','elastic','grafana','hashicorp','confluent','snowflake',
  'github','atlassian','canva','asana','airtable','monday','hubspot','zendesk',
  'intercom','twitch','epic games','unity','riot games','duolingo','instacart',
  'doordash','lyft','waymo','cruise','nuro','postman','deepmind','stability ai',
  'cohere','mistral','scale ai','coreweave','lambda','perplexity','cursor','replit',
  'warp','raycast','sentry','pagerduty','okta','crowdstrike','zscaler','1password',
  'livekit','elevenlabs','midjourney','hugging face','runway','character',
  'uniswap','alchemy','chainalysis','fireblocks','consensys','phantom','opensea',
  'wealthsimple','monzo','nubank','mercari','flexport','faire','toast',
]);

function isHighProfileCompany(company) {
  const c = company.toLowerCase().trim();
  for (const p of PRIORITY_COMPANIES) {
    if (c.includes(p) || p.includes(c)) return true;
  }
  return false;
}

function pickJobs(jobs, limit) {
  const seen = new Set();
  const priority = [];
  const regular = [];
  const overflow = []; // extra jobs from same companies if we need to fill

  for (const job of jobs) {
    // Skip bad data: truncated names, non-English titles
    if (!job.company || job.company.includes('...') || job.company.length <= 2) continue;
    if (!job.title || /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]/.test(job.title)) continue;
    // Skip non-tech/non-business jobs
    if (BANNED_REGEX.test(job.title)) continue;

    const key = job.company.toLowerCase().trim();
    if (seen.has(key)) {
      overflow.push(job); // save for backfill
      continue;
    }
    seen.add(key);

    if (isHighProfileCompany(job.company)) {
      priority.push(job);
    } else {
      regular.push(job);
    }
  }

  // Priority companies go first, then fill with regular
  const picked = [...priority.slice(0, limit)];
  if (picked.length < limit) {
    picked.push(...regular.slice(0, limit - picked.length));
  }

  // If still under limit, backfill with overflow
  if (picked.length < limit) {
    picked.push(...shuffle(overflow).slice(0, limit - picked.length));
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
    const title = truncate(cleanTitle(job.title), 60);
    const company = escapeHTML(cleanCompany(job.company));
    const url = escapeHTML(job.apply_url);

    lines.push(`• ${company} is hiring <a href="${url}">${escapeHTML(title)}</a>`);
  }

  lines.push('');
  lines.push('—');
  lines.push('Turn your CV into a Website: <a href="https://cvin.bio?utm_source=social&utm_medium=telegram">cvin.bio</a>');

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

  // 4. Mark ONLY the picked jobs as posted
  const pickedIds = jobs.map(j => j.id);
  await markJobsPosted(pickedIds);
  console.log(`  Marked ${pickedIds.length} jobs as posted`);
}

main().catch(e => {
  console.error('Telegram post failed:', e.message);
  process.exit(1);
});
