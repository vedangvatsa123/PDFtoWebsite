#!/usr/bin/env node
/**
 * Bluesky Engagement Engine v2
 * Finds trending career/job posts and replies with contextual, intellectual comments.
 * Uses Gemini to generate replies that actually respond to the post content.
 *
 * Rules enforced in the prompt:
 *  - Use "we" not "I/me" (org account)
 *  - No AI slop words
 *  - No emdashes or stylistic colons
 *  - No URLs or CTAs
 *  - Under 250 characters
 *  - Must add genuine intellectual value to the specific post
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'bsky-engage-log.json');

const HANDLE = 'cv-in-bio.bsky.social';
const APP_PASSWORD = process.env.BSKY_APP_PASSWORD;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!APP_PASSWORD) { console.error('Missing BSKY_APP_PASSWORD'); process.exit(1); }
if (!GEMINI_KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }

const MAX_COMMENTS = parseInt(process.env.BSKY_ENGAGE_LIMIT || '50', 10);
const DELAY_MS = 15000; // 15s between comments (avoid anti-spam)

// ── Search queries ──────────────────────────────────────────────────────
const SEARCH_QUERIES = [
  // Career & jobs
  'job hunting', 'job search', 'hiring process', 'resume', 'layoffs',
  'career advice', 'remote work', 'salary negotiation', 'recruiter',
  'ATS', 'entry level', 'toxic workplace', 'ghosted job',
  'cover letter', 'career change', 'unemployment', 'got fired', 'job offer',
  'interview process', 'hiring manager', 'return to office', 'RTO mandate',
  'quit my job', 'underpaid', 'overworked', 'burnout work', 'tech layoffs',
  // Tech & AI
  'artificial intelligence', 'AI replacing jobs', 'AI tools',
  'ChatGPT', 'software engineering', 'coding bootcamp', 'open source',
  'developer experience', 'tech industry', 'SaaS', 'product management',
  'engineering manager', 'technical interview', 'AI automation',
  'future of work', 'tech workers', 'machine learning',
  // Business & startups
  'startup founder', 'venture capital', 'bootstrapped', 'side project',
  'building in public', 'product launch', 'startup life', 'entrepreneur',
  'small business', 'freelancer life', 'consulting', 'business model',
  'gig economy', 'corporate culture', 'workplace culture', 'leadership',
];

// ── Gemini reply generator ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the social media voice of a careers and professional development platform. You reply to posts about jobs, hiring, careers, workplace culture, tech industry, AI, startups, and business on Bluesky.

STRICT RULES:
- Write exactly ONE reply that is UNDER 200 characters (hard limit, count every single character including spaces and newlines)
- Actually respond to what the person said. Reference their specific situation.
- Use "we" instead of "I" or "me" because this is an org account
- Sound like a real person, not a brand. Conversational, warm, opinionated.
- Add a genuinely useful observation, counterpoint, or shared experience
- Use line breaks between thoughts for readability

BANNED (instant fail):
- Any URL, link, or website name
- The words: leverage, delve, navigate, elevate, unlock, ecosystem, landscape, tapestry, holistic, synergy, paradigm, disrupt, empower, resonate, crucial, pivotal, foster, robust, streamline, utilize, facilitate, comprehensive, innovative, seamlessly, endeavor, moreover, furthermore, indeed, "is real", "is valid", "never been more important"
- Emdashes (—)
- Colons used stylistically (e.g. "Here's the thing:")
- Hashtags
- Emojis
- Starting with "This." or "So much this."
- The phrase "couldn't agree more"
- Any promotional language

GOOD EXAMPLES:
"Two years of searching is brutal. The part nobody talks about is how it changes the way you see yourself after a while."
"We've seen this exact pattern with hundreds of candidates.\n\nThe companies that ghost after round 4 are usually the ones that never had budget approval to begin with."
"Updating a resume to pass ATS filters feels like writing for a machine instead of a person.\n\nBecause that's exactly what it is."`;

async function generateReply(postText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`;
  
  const body = {
    contents: [{
      parts: [{ text: `Reply to this Bluesky post:\n\n"${postText.substring(0, 500)}"\n\nWrite a single reply UNDER 200 characters total. This is a hard limit. Count carefully. Follow all rules in your system prompt. Output ONLY the reply text, nothing else.` }],
    }],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 500,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Gemini failed: ${r.status} ${err}`);
  }

  const data = await r.json();
  let reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  
  // Strip quotes if Gemini wraps in quotes
  if (reply.startsWith('"') && reply.endsWith('"')) reply = reply.slice(1, -1);
  
  // Hard truncation at 250 chars — cut at last sentence boundary
  if (reply.length > 250) {
    const truncated = reply.substring(0, 250);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExcl = truncated.lastIndexOf('!');
    const lastQ = truncated.lastIndexOf('?');
    const lastBreak = truncated.lastIndexOf('\n');
    const cutPoint = Math.max(lastPeriod, lastExcl, lastQ, lastBreak);
    if (cutPoint > 100) {
      reply = reply.substring(0, cutPoint + 1).trim();
    } else {
      reply = truncated.trim();
    }
  }
  return reply;
}

// ── Validation ──────────────────────────────────────────────────────────
function validateReply(reply) {
  if (!reply || reply.length === 0) return 'empty';
  if (reply.length > 250) return `too long (${reply.length} chars)`;
  if (reply.includes('—')) return 'contains emdash';
  if (reply.includes('http') || reply.includes('.com') || reply.includes('.bio') || reply.includes('.io')) return 'contains URL';
  
  const slop = ['leverage', 'delve', 'navigate', 'elevate', 'unlock', 'ecosystem',
    'landscape', 'tapestry', 'holistic', 'synergy', 'paradigm', 'disrupt', 'empower',
    'resonate', 'crucial', 'pivotal', 'foster', 'robust', 'streamline', 'utilize',
    'facilitate', 'comprehensive', 'innovative', 'seamlessly', 'endeavor', 'moreover',
    'furthermore', 'indeed', 'is real', 'is valid', 'never been more important'];
  for (const w of slop) {
    if (reply.toLowerCase().includes(w)) return `contains slop word: "${w}"`;
  }
  
  if (reply.startsWith('This.') || reply.startsWith('So much this')) return 'starts with "This."';
  if (reply.includes("couldn't agree more")) return 'contains "couldn\'t agree more"';
  if (/[#]/.test(reply)) return 'contains hashtag';
  
  return null; // valid
}

// ── AT Protocol helpers ─────────────────────────────────────────────────
async function createSession() {
  const r = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: HANDLE, password: APP_PASSWORD }),
  });
  if (!r.ok) throw new Error(`Auth failed: ${r.status}`);
  return r.json();
}

async function searchPosts(session, query, limit = 25) {
  const params = new URLSearchParams({ q: query, sort: 'top', limit: String(limit) });
  const r = await fetch(`https://bsky.social/xrpc/app.bsky.feed.searchPosts?${params}`, {
    headers: { 'Authorization': `Bearer ${session.accessJwt}` },
  });
  if (!r.ok) { console.warn(`Search failed for "${query}": ${r.status}`); return []; }
  const data = await r.json();
  return data.posts || [];
}

async function replyToPost(session, post, text) {
  const record = {
    $type: 'app.bsky.feed.post',
    text,
    reply: {
      root: { uri: post.uri, cid: post.cid },
      parent: { uri: post.uri, cid: post.cid },
    },
    createdAt: new Date().toISOString(),
  };

  const r = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Reply failed: ${r.status} ${err}`);
  }
  return r.json();
}

// ── Deduplication ───────────────────────────────────────────────────────
function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); }
  catch { return { repliedTo: [], lastRunAt: null, totalComments: 0 }; }
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// ── Relevance filter ────────────────────────────────────────────────────
function isRelevant(post) {
  const text = (post.record?.text || '').toLowerCase();
  
  // Exclude politics/spam/promo/nsfw
  const exclude = ['trump', 'biden', 'congress', 'senate', 'democrat', 'republican',
    'election', 'vote', 'epstein', 'supreme court', 'legislation',
    'breaking news', 'rt if', 'repost', 'follow me', 'giveaway', 'sponsored',
    'affiliate', 'discount code', 'promo', 'buy now', 'limited time',
    'free trial', 'check out my', 'dm me', 'link in bio',
    'crypto', 'nft', 'airdrop', 'bitcoin', 'gofundme', 'donate',
    'sign up for', 'subscribe to', 'use code',
    'nsfw', 'onlyfans', 'porn', 'xxx', 'fetish', 'feetworship', 'footfetish'];
  if (exclude.some(w => text.includes(w))) return false;
  
  if (text.length < 80) return false;
  if (post.author?.handle === HANDLE) return false;
  if (text.includes('cvin')) return false;
  if ((post.likeCount || 0) < 2) return false;
  
  return true;
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🦋 Bluesky Engagement Engine v2 (Gemini-powered)`);
  console.log(`   Target: ${MAX_COMMENTS} comments\n`);

  const session = await createSession();
  console.log(`🔑 Authenticated as ${session.handle}\n`);

  const log = loadLog();
  const repliedSet = new Set(log.repliedTo);

  // Gather posts
  let allPosts = [];
  for (const query of SEARCH_QUERIES) {
    const posts = await searchPosts(session, query, 25);
    allPosts.push(...posts);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`📊 Found ${allPosts.length} total posts across ${SEARCH_QUERIES.length} queries`);

  // Deduplicate
  const seen = new Set();
  const unique = allPosts.filter(p => { if (seen.has(p.uri)) return false; seen.add(p.uri); return true; });
  console.log(`📊 ${unique.length} unique posts`);

  // Filter + sort by engagement
  const relevant = unique
    .filter(p => isRelevant(p) && !repliedSet.has(p.uri))
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));

  console.log(`📊 ${relevant.length} relevant, unreplied posts\n`);

  let commented = 0;
  let retries = 0;

  for (const post of relevant) {
    if (commented >= MAX_COMMENTS) break;

    const postText = post.record?.text || '';
    const author = post.author?.handle || 'unknown';
    const likes = post.likeCount || 0;

    // Generate contextual reply via Gemini
    let reply;
    try {
      reply = await generateReply(postText);
    } catch (e) {
      console.error(`   ⚠️ Gemini error: ${e.message}`);
      retries++;
      if (retries > 5) { console.error('Too many Gemini failures, stopping.'); break; }
      continue;
    }

    // Validate
    const issue = validateReply(reply);
    if (issue) {
      console.warn(`   ⚠️ Skipping (${issue}): "${reply.substring(0, 60)}..."`);
      continue;
    }

    console.log(`\n💬 #${commented + 1} → @${author} (${likes} ♡)`);
    console.log(`   Post: "${postText.substring(0, 100)}..."`);
    console.log(`   Reply: "${reply}"`);

    try {
      const result = await replyToPost(session, post, reply);
      console.log(`   ✅ ${result.uri}`);
      repliedSet.add(post.uri);
      log.repliedTo.push(post.uri);
      commented++;
    } catch (e) {
      console.error(`   ❌ ${e.message}`);
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  log.lastRunAt = new Date().toISOString();
  log.totalComments = (log.totalComments || 0) + commented;
  saveLog(log);

  console.log(`\n✅ Done! Posted ${commented} comments.`);
  console.log(`📊 Lifetime total: ${log.totalComments}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
