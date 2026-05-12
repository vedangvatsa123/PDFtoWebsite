// Bluesky Auto-Poster — posts via AT Protocol API
// Triggered by GitHub Actions cron at 1 AM, 9 AM, 5 PM IST

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'bsky-state.json');

const HANDLE = 'cvinbio.bsky.social';
const APP_PASSWORD = process.env.BSKY_APP_PASSWORD;
if (!APP_PASSWORD) { console.error('Missing BSKY_APP_PASSWORD'); process.exit(1); }

const IMG_DIR = path.join(__dirname, '../../public/images/social');

const CONTENT_FILE = path.join(__dirname, 'buffer-content.json');
const bufferContent = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
const POSTS = bufferContent.linkedin;

// ── AT Protocol helpers ───────────────────────────────────────────────────
async function createSession() {
  const r = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: HANDLE, password: APP_PASSWORD }),
  });
  if (!r.ok) throw new Error(`Auth failed: ${r.status}`);
  return r.json();
}

async function uploadImage(session, imgPath) {
  const imgData = fs.readFileSync(imgPath);
  const r = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessJwt}`,
      'Content-Type': 'image/png',
    },
    body: imgData,
  });
  if (!r.ok) throw new Error(`Image upload failed: ${r.status}`);
  const data = await r.json();
  return data.blob;
}

async function createPost(session, text, imageBlob) {
  // Detect cvin.bio link and add facet
  const facets = [];
  const linkMatch = text.match(/cvin\.bio/);
  if (linkMatch) {
    const start = new TextEncoder().encode(text.substring(0, linkMatch.index)).length;
    const end = start + new TextEncoder().encode('cvin.bio').length;
    facets.push({
      index: { byteStart: start, byteEnd: end },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://cvin.bio' }],
    });
  }

  const record = {
    $type: 'app.bsky.feed.post',
    text,
    facets,
    createdAt: new Date().toISOString(),
  };

  if (imageBlob) {
    record.embed = {
      $type: 'app.bsky.embed.images',
      images: [{ alt: 'Infographic about the job market by CVin.Bio', image: imageBlob }],
    };
  }

  const r = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record,
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Post failed: ${r.status} ${err}`);
  }
  return r.json();
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  // Pull latest state from git first
  try {
    const { execSync } = await import('child_process');
    execSync('git pull --rebase origin main', { cwd: path.join(__dirname, '../..'), stdio: 'pipe' });
    console.log('📥 Pulled latest state from git');
  } catch (e) {
    console.warn('⚠️ Git pull failed, proceeding with checkout state:', e.message);
  }

  let state = { index: 0, lastPostedAt: null };
  if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  // Cooldown: skip if posted recently (20h gap for 1x/day schedule)
  if (state.lastPostedAt) {
    const elapsed = Date.now() - new Date(state.lastPostedAt).getTime();
    const COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 hours
    if (elapsed < COOLDOWN_MS) {
      const hrs = (elapsed / 3600000).toFixed(1);
      console.log(`⏳ Cooldown: last post was ${hrs}h ago (need 20h gap). Skipping.`);
      process.exit(0);
    }
  }

  if (state.index >= POSTS.length) {
    console.log(`✅ All ${POSTS.length} posts published. Nothing to do.`);
    process.exit(0);
  }

  console.log(`🦋 Bluesky poster — posting #${state.index + 1} of ${POSTS.length}`);

  const session = await createSession();
  console.log(`🔑 Authenticated as ${session.handle}`);

  const text = POSTS[state.index];
  const imgNum = String(state.index + 1).padStart(2, '0');
  let imgPath = path.join(__dirname, '../../public/images/social', `post_${imgNum}.png`);
  if (imgPath.endsWith('.mp4')) { console.warn('⚠️ Bluesky script does not support video upload, skipping...'); imgPath = null; }
  if (imgPath && !fs.existsSync(imgPath)) {
    imgPath = path.join(__dirname, '..', 'images', `post_${imgNum}.png`);
  }

  let imageBlob = null;
  if (fs.existsSync(imgPath)) {
    imageBlob = await uploadImage(session, imgPath);
    console.log(`🖼️ Image uploaded: post_${imgNum}.png`);
  }

  const result = await createPost(session, text, imageBlob);
  console.log(`✅ Posted! URI: ${result.uri}`);

  state.index++;
  state.lastPostedAt = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`💾 State saved: next post is #${state.index + 1}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
