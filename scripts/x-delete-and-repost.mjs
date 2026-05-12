import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const CONSUMER_KEY        = process.env.X_CONSUMER_KEY;
const CONSUMER_SECRET     = process.env.X_CONSUMER_SECRET;
const ACCESS_TOKEN        = process.env.X_ACCESS_TOKEN;
const ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

if (!CONSUMER_KEY || !ACCESS_TOKEN) {
  console.error('❌ Missing X API keys in .env.local');
  process.exit(1);
}

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

// Delete a tweet
function deleteTweet(tweetId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.twitter.com/2/tweets/${tweetId}`;
    const auth = oauthHeader('DELETE', url);
    const req = https.request({
      hostname: 'api.twitter.com',
      path: `/2/tweets/${tweetId}`,
      method: 'DELETE',
      headers: { Authorization: auth },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Upload media
function uploadMedia(imgPath) {
  return new Promise((resolve, reject) => {
    if (!imgPath || !fs.existsSync(imgPath)) { resolve(null); return; }
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
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: {
        Authorization:  auth,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
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

// Post tweet
function postTweet(text, mediaId, replyToId) {
  return new Promise((resolve, reject) => {
    const url     = 'https://api.twitter.com/2/tweets';
    const payload = { text };
    if (mediaId)   payload.media = { media_ids: [mediaId] };
    if (replyToId) payload.reply = { in_reply_to_tweet_id: replyToId };
    const body = JSON.stringify(payload);
    const auth = oauthHeader('POST', url);
    const req  = https.request({
      hostname: 'api.twitter.com', path: '/2/tweets', method: 'POST',
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

function safelyTruncate(text, limit = 280) {
  if (text.length <= limit) return text;
  const urlMatch = text.match(/\n(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)$/i);
  if (!urlMatch) return text.substring(0, limit - 1).replace(/\n[^\n]*$/, '') + '…';
  const url = urlMatch[1];
  const urlChunk = '\n\n' + url;
  const rawText = text.slice(0, text.length - urlMatch[0].length).trim();
  const allowedLength = limit - urlChunk.length - 1;
  return rawText.substring(0, allowedLength).replace(/\n[^\n]*$/, '') + '…' + urlChunk;
}

async function main() {
  const REPO_ROOT = path.join(__dirname, '..');
  const STATE_FILE = path.join(REPO_ROOT, '.github', 'scripts', 'x-state.json');
  const CONTENT_FILE = path.join(REPO_ROOT, '.github', 'scripts', 'x-content.json');

  // Tweet IDs to delete
  const tweetIds = [
    '2053381858553962695', '2053381869710819476', '2053381880905400701',
    '2053381892104221079', '2053381903349141981', '2053381914581418383',
    '2053381925784428969', '2053381936828047550', '2053381947896848475',
    '2053381959091364178',
  ];

  // ── PHASE 1: Delete all tweets ──────────────────────────────────────
  console.log('🗑️  PHASE 1: Deleting 10 tweets...\n');
  for (const id of tweetIds) {
    const result = await deleteTweet(id);
    if (result.status === 200 && result.body?.data?.deleted) {
      console.log(`  ✅ Deleted ${id}`);
    } else {
      console.log(`  ⚠️ ${id}: ${JSON.stringify(result.body)}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // ── PHASE 2: Repost the thread ─────────────────────────────────────
  console.log('\n🧵 PHASE 2: Reposting salary-negotiation-playbook thread...\n');

  const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  const thread = content.threads.find(t => t.topic === 'salary-negotiation-playbook');
  if (!thread) { console.error('❌ Thread not found'); process.exit(1); }

  let previousTweetId = null;
  const postedIds = [];

  for (let i = 0; i < thread.tweets.length; i++) {
    let tweetText = thread.tweets[i];
    let imgPath = null;
    if (typeof tweetText === 'object') {
      imgPath = tweetText.img;
      tweetText = tweetText.text;
    }
    tweetText = safelyTruncate(tweetText, 280);

    console.log(`  Tweet ${i + 1}/${thread.tweets.length}: "${tweetText.substring(0, 60)}..."`);

    // Upload image
    let mediaId = null;
    if (imgPath) {
      try {
        const fullPath = imgPath.startsWith('/') ? imgPath : path.join(REPO_ROOT, imgPath);
        mediaId = await uploadMedia(fullPath);
        if (mediaId) console.log(`  🖼️  Media: ${mediaId}`);
      } catch (e) { console.warn(`  ⚠️ Image failed: ${e.message}`); }
    }

    const result = await postTweet(tweetText, mediaId, previousTweetId);

    if (result.status === 201) {
      previousTweetId = result.body.data.id;
      postedIds.push(previousTweetId);
      console.log(`  ✅ Posted (${previousTweetId})\n`);
    } else {
      console.error(`  ❌ Failed: ${JSON.stringify(result.body)}`);
      break;
    }

    // Rate limit: 2s between tweets
    if (i < thread.tweets.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // ── PHASE 3: Update state ──────────────────────────────────────────
  console.log(`\n📝 PHASE 3: Updating state...`);
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  // Update the thread history entry
  const histEntry = state.threadHistory.find(h => h.topic === 'salary-negotiation-playbook');
  if (histEntry) {
    histEntry.tweetIds = postedIds;
    histEntry.postedAt = new Date().toISOString();
  } else {
    state.threadHistory.push({
      topic: 'salary-negotiation-playbook',
      tweetIds: postedIds,
      postedAt: new Date().toISOString(),
    });
  }
  state.lastPostedAt.thread = new Date().toISOString();

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`✅ Done. Thread reposted with ${postedIds.length} tweets.`);
  console.log(`First tweet: https://x.com/cvinbio/status/${postedIds[0]}`);
}

main().catch(e => { console.error(e); process.exit(1); });
