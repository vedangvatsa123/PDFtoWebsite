import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Credentials from GitHub Secrets ──────────────────────────────────────
const CONSUMER_KEY        = process.env.X_CONSUMER_KEY;
const CONSUMER_SECRET     = process.env.X_CONSUMER_SECRET;
const ACCESS_TOKEN        = process.env.X_ACCESS_TOKEN;
const ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

// ── Slot (set by workflow: "thread", "insight", or "engagement") ─────────
const SLOT = process.env.X_POST_SLOT || 'engagement';

const STATE_FILE   = path.join(__dirname, 'x-state.json');
const CONTENT_FILE = path.join(__dirname, 'x-content.json');
const IMAGES_DIR   = path.join(__dirname, '../images');
const REPO_ROOT    = path.join(__dirname, '../..');

// ── OAuth 1.0a ────────────────────────────────────────────────────────────
const pct = s => encodeURIComponent(String(s));

function oauthHeader(method, url, queryParams = {}) {
  const p = {
    oauth_consumer_key:     CONSUMER_KEY,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
    oauth_token:            ACCESS_TOKEN,
    oauth_version:          '1.0',
  };
  const allParams = { ...p, ...queryParams };
  const base    = Object.keys(allParams).sort().map(k => `${pct(k)}=${pct(allParams[k])}`).join('&');
  const sigBase = `${method.toUpperCase()}&${pct(url)}&${pct(base)}`;
  const sigKey  = `${pct(CONSUMER_SECRET)}&${pct(ACCESS_TOKEN_SECRET)}`;
  p.oauth_signature = crypto.createHmac('sha1', sigKey).update(sigBase).digest('base64');
  const hdr = Object.keys(p).filter(k => k.startsWith('oauth')).sort()
    .map(k => `${pct(k)}="${pct(p[k])}"`).join(', ');
  return `OAuth ${hdr}`;
}

// ── Upload image to X v1.1 ────────────────────────────────────────────────
function uploadMedia(imgPath) {
  return new Promise((resolve, reject) => {
    if (!imgPath) { console.warn('  ⚠️ No image path provided'); resolve(null); return; }
    if (!fs.existsSync(imgPath)) { console.warn(`  ⚠️ Image not found: ${imgPath}`); resolve(null); return; }
    console.log(`  📎 Uploading: ${imgPath} (${(fs.statSync(imgPath).size / 1024).toFixed(0)}KB)`);
    const data     = fs.readFileSync(imgPath);
    const boundary = `----Boundary${crypto.randomBytes(8).toString('hex')}`;
    const UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';
    const parts    = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"\r\n\r\n`),
      data,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(parts);
    const auth = oauthHeader('POST', UPLOAD_URL);
    const url  = new URL(UPLOAD_URL);

    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers: {
        Authorization:  auth,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (!d.trim()) { reject(new Error(`HTTP ${res.statusCode} empty body`)); return; }
        try {
          const j = JSON.parse(d);
          j.media_id_string ? resolve(j.media_id_string) : reject(new Error(d));
        } catch { reject(new Error('Parse error: ' + d)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Post tweet v2 (supports reply threading) ──────────────────────────────
function postTweet(text, mediaId, replyToId) {
  return new Promise((resolve, reject) => {
    const url     = 'https://api.twitter.com/2/tweets';
    const payload = { text };
    if (mediaId)   payload.media = { media_ids: [mediaId] };
    if (replyToId) payload.reply = { in_reply_to_tweet_id: replyToId };

    const body = JSON.stringify(payload);
    const auth = oauthHeader('POST', url);
    const req  = https.request({
      hostname: 'api.twitter.com',
      path:     '/2/tweets',
      method:   'POST',
      headers: {
        Authorization:   auth,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: { error: d } }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Fetch recent tweets to check for duplicates ──────────────────────────
function fetchUserTimeline() {
  return new Promise((resolve) => {
    const meUrl = 'https://api.twitter.com/2/users/me';
    const meAuth = oauthHeader('GET', meUrl);
    const meReq = https.request({
      hostname: 'api.twitter.com', path: '/2/users/me', method: 'GET',
      headers: { Authorization: meAuth },
    }, meRes => {
      let d = '';
      meRes.on('data', c => d += c);
      meRes.on('end', () => {
        try {
          const user = JSON.parse(d);
          if (!user.data?.id) { resolve({ status: meRes.statusCode, body: { data: [] } }); return; }
          const userId = user.data.id;
          const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets`;
          const qp = { max_results: '10' };
          const tweetsAuth = oauthHeader('GET', tweetsUrl, qp);
          const tweetsReq = https.request({
            hostname: 'api.twitter.com',
            path: `/2/users/${userId}/tweets?max_results=10`,
            method: 'GET',
            headers: { Authorization: tweetsAuth },
          }, tweetsRes => {
            let td = '';
            tweetsRes.on('data', c => td += c);
            tweetsRes.on('end', () => {
              try { resolve({ status: tweetsRes.statusCode, body: JSON.parse(td) }); }
              catch { resolve({ status: tweetsRes.statusCode, body: { data: [] } }); }
            });
          });
          tweetsReq.on('error', () => resolve({ status: 0, body: { data: [] } }));
          tweetsReq.end();
        } catch { resolve({ status: meRes.statusCode, body: { data: [] } }); }
      });
    });
    meReq.on('error', () => resolve({ status: 0, body: { data: [] } }));
    meReq.end();
  });
}

// ── Lockfile helpers ─────────────────────────────────────────────────────
const LOCK_FILE = path.join(__dirname, '.x-post.lock');
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;

function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const lockAge = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
    if (lockAge < LOCK_TIMEOUT_MS) {
      console.log(`🔒 Another run in progress (${Math.round(lockAge / 1000)}s old). Exiting.`);
      return false;
    }
    console.log(`🔓 Removing stale lock`);
  }
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, slot: SLOT, ts: new Date().toISOString() }));
  return true;
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE); } catch {}
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  if (!acquireLock()) process.exit(0);
  try { await runPost(); }
  finally { releaseLock(); }
}

async function runPost() {
  // Pull latest state
  try {
    const { execSync } = await import('child_process');
    execSync('git pull --rebase origin main', { cwd: path.join(__dirname, '../..'), stdio: 'pipe' });
    console.log('📥 Pulled latest state');
  } catch (e) {
    console.warn('⚠️ Git pull failed:', e.message);
  }

  // Load state
  let state = { threads: { index: 0 }, insights: { index: 0 }, engagement: { index: 0 }, lastPostedAt: {} };
  if (fs.existsSync(STATE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state = { ...state, ...raw };
  }
  // Ensure sub-objects exist
  if (!state.lastPostedAt) state.lastPostedAt = {};
  if (!state.threads)      state.threads = { index: 0 };
  if (!state.insights)     state.insights = { index: 0 };
  if (!state.engagement)   state.engagement = { index: 0 };

  // Cooldown per slot: 20h gap
  const slotLastPosted = state.lastPostedAt[SLOT];
  if (slotLastPosted) {
    const elapsed = Date.now() - new Date(slotLastPosted).getTime();
    const COOLDOWN_MS = 20 * 60 * 60 * 1000;
    if (elapsed < COOLDOWN_MS) {
      const hrs = (elapsed / 3600000).toFixed(1);
      console.log(`⏳ [${SLOT}] Cooldown: last post ${hrs}h ago (need 20h). Skipping.`);
      process.exit(0);
    }
  }

  // Load content
  if (!fs.existsSync(CONTENT_FILE)) {
    console.error('❌ Missing x-content.json'); process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));

  // Dispatch by slot
  if (SLOT === 'thread') {
    await postThread(state, content);
  } else if (SLOT === 'insight') {
    await postSingle(state, content, 'insights');
  } else {
    await postSingle(state, content, 'engagement');
  }
}

// ── Safely truncate while preserving trailing URLs ────────────────────────
function safelyTruncate(text, limit = 280) {
  if (text.length <= limit) return text;
  
  // Find a URL at the very end of the string
  const urlMatch = text.match(/\n(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)$/i);
  if (!urlMatch) {
    return text.substring(0, limit - 1).replace(/\n[^\n]*$/, '') + '…';
  }
  
  const url = urlMatch[1];
  const urlChunk = '\n\n' + url;
  const rawText = text.slice(0, text.length - urlMatch[0].length).trim();
  
  const allowedLength = limit - urlChunk.length - 1; // 1 for ellipsis
  const truncatedText = rawText.substring(0, allowedLength).replace(/\n[^\n]*$/, '') + '…';
  
  return truncatedText + urlChunk;
}

// ── Post a single tweet (insights / engagement) ──────────────────────────
async function postSingle(state, content, slotKey) {
  const items = content[slotKey] || content.engagement;
  const idx   = state[slotKey]?.index || 0;

  if (idx >= items.length) {
    console.log(`✅ [${slotKey}] All ${items.length} posts published. Waiting for more content.`);
    process.exit(0);
  }

  const item = items[idx];
  let text = item.text.trim();
  text = safelyTruncate(text, 280);

  console.log(`📝 [${slotKey}] Posting #${idx + 1}/${items.length}: "${text.substring(0, 60)}..."`);

  // Pre-flight duplicate check
  const firstLine = text.split('\n')[0].trim().substring(0, 50);
  try {
    const recent = await fetchUserTimeline();
    if (recent.status === 200 && recent.body.data) {
      if (recent.body.data.some(t => t.text?.includes(firstLine))) {
        console.log(`⚠️ Duplicate detected on timeline. Advancing index.`);
        state[slotKey].index++;
        state.lastPostedAt[SLOT] = new Date().toISOString();
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        return;
      }
    }
  } catch (e) { console.warn('Timeline check failed:', e.message); }

  // Upload image if present
  let mediaId = null;
  if (item.img) {
    try {
      // Resolve image path: absolute, repo-relative (.github/...), or IMAGES_DIR-relative
      let imgPath;
      if (item.img.startsWith('/')) {
        imgPath = item.img;
      } else if (item.img.startsWith('.github/')) {
        imgPath = path.join(REPO_ROOT, item.img);
      } else {
        // Covers both filenames (post_29.png) and subdirs (memes/foo.jpeg)
        imgPath = path.join(IMAGES_DIR, item.img);
      }
      mediaId = await uploadMedia(imgPath);
      if (mediaId) console.log('🖼️ Media uploaded:', mediaId);
      else console.warn('⚠️ No media ID returned — posting without image');
    } catch (e) { console.warn('Image upload failed:', e.message); }
  } else {
    console.log('📝 No image for this post');
  }

  const result = await postTweet(text, mediaId);

  if (result.status === 201) {
    const tweetId = result.body?.data?.id || 'unknown';
    console.log(`✅ [${slotKey}] Posted #${idx + 1} (tweet: ${tweetId})`);
    state[slotKey].index++;
    state.lastPostedAt[SLOT] = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } else if (result.status === 403 && JSON.stringify(result.body).includes('duplicate')) {
    console.log(`⚠️ X API duplicate. Advancing.`);
    state[slotKey].index++;
    state.lastPostedAt[SLOT] = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } else {
    console.error('❌ Failed:', JSON.stringify(result.body, null, 2));
    process.exit(1);
  }
}

// ── Post a thread (reply chain) ──────────────────────────────────────────
async function postThread(state, content) {
  const threads = content.threads || [];
  const idx     = state.threads?.index || 0;

  if (idx >= threads.length) {
    console.log(`✅ [threads] All ${threads.length} threads published. Waiting for more content.`);
    process.exit(0);
  }

  const thread = threads[idx];
  const tweets = thread.tweets;

  console.log(`🧵 [threads] Posting thread #${idx + 1}/${threads.length}: "${thread.topic}" (${tweets.length} tweets)`);

  // Pre-flight: check if thread opener is already on timeline
  const firstTweetText = typeof tweets[0] === 'string' ? tweets[0] : tweets[0].text;
  const firstLine = firstTweetText.split('\n')[0].trim().substring(0, 50);
  try {
    const recent = await fetchUserTimeline();
    if (recent.status === 200 && recent.body.data) {
      if (recent.body.data.some(t => t.text?.includes(firstLine))) {
        console.log(`⚠️ Thread opener already on timeline. Advancing.`);
        state.threads.index++;
        state.lastPostedAt.thread = new Date().toISOString();
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        return;
      }
    }
  } catch (e) { console.warn('Timeline check failed:', e.message); }

  // Post thread as reply chain
  let previousTweetId = null;
  const postedIds = [];

  for (let i = 0; i < tweets.length; i++) {
    let tweetText = tweets[i];

    // Handle both string tweets and object tweets {text, img}
    let imgPath = null;
    if (typeof tweetText === 'object') {
      imgPath = tweetText.img;
      tweetText = tweetText.text;
    }

    tweetText = safelyTruncate(tweetText, 280);

    console.log(`  Tweet ${i + 1}/${tweets.length}: "${tweetText.substring(0, 50)}..."`);

    // Upload image if present
    let mediaId = null;
    if (imgPath) {
      try {
        let fullPath;
        if (imgPath.startsWith('/')) {
          fullPath = imgPath;
        } else if (imgPath.startsWith('.github/')) {
          fullPath = path.join(REPO_ROOT, imgPath);
        } else {
          fullPath = path.join(IMAGES_DIR, imgPath);
        }
        mediaId = await uploadMedia(fullPath);
        if (mediaId) console.log(`  🖼️ Media: ${mediaId}`);
        else console.warn(`  ⚠️ No media ID — posting tweet without image`);
      } catch (e) { console.warn(`  Image failed: ${e.message}`); }
    }

    const result = await postTweet(tweetText, mediaId, previousTweetId);

    if (result.status === 201) {
      previousTweetId = result.body.data.id;
      postedIds.push(previousTweetId);
      console.log(`  ✅ Tweet ${i + 1} posted (${previousTweetId})`);
    } else if (result.status === 403 && JSON.stringify(result.body).includes('duplicate')) {
      // Duplicate tweet in thread — skip but continue chain
      console.log(`  ⚠️ Tweet ${i + 1} duplicate, skipping`);
      continue;
    } else {
      console.error(`  ❌ Tweet ${i + 1} failed:`, JSON.stringify(result.body));
      // Don't fail the whole thread if one tweet fails midway — still advance
      break;
    }

    // Rate limit safety: 2s between tweets in thread
    if (i < tweets.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Update state
  console.log(`🧵 Thread "${thread.topic}" posted (${postedIds.length}/${tweets.length} tweets)`);
  state.threads.index++;
  state.lastPostedAt.thread = new Date().toISOString();
  if (!state.threadHistory) state.threadHistory = [];
  state.threadHistory.push({
    topic: thread.topic,
    tweetIds: postedIds,
    postedAt: new Date().toISOString(),
  });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
