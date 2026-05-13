#!/usr/bin/env node
/**
 * Meta Social Poster — Facebook Page + Instagram + Threads
 * Posts engagement content from x-content.json to Meta platforms.
 * Uses the same engagement queue as X/Bluesky but maintains separate state indices.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────
const CONTENT_FILE = path.join(__dirname, 'x-content.json');
const STATE_FILE   = path.join(__dirname, 'meta-state.json');
const IMAGES_DIR   = path.join(__dirname, '../images');

const META_PAGE_ID    = process.env.META_PAGE_ID;
const META_PAGE_TOKEN = process.env.META_PAGE_TOKEN;
const META_IG_USER_ID = process.env.META_IG_USER_ID;       // optional
const THREADS_USER_ID = process.env.THREADS_USER_ID;         // optional
const THREADS_TOKEN   = process.env.THREADS_ACCESS_TOKEN;    // optional

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

// ── State ─────────────────────────────────────────────────────────────────
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { facebook: { index: 0 }, instagram: { index: 0 }, threads: { index: 0 } };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Facebook Page Post (returns public image URL for IG/Threads) ──────────
async function postToFacebook(text, imagePath) {
  if (!META_PAGE_ID || !META_PAGE_TOKEN) return { ok: false, imageUrl: null };
  try {
    if (imagePath && fs.existsSync(imagePath)) {
      const isVideo = imagePath.endsWith('.mp4');
      const fileData = fs.readFileSync(imagePath);
      const formData = new FormData();
      
      if (isVideo) {
        formData.append('description', text);
        formData.append('source', new Blob([fileData], { type: 'video/mp4' }), require('path').basename(imagePath));
      } else {
        formData.append('message', text);
        formData.append('source', new Blob([fileData], { type: 'image/jpeg' }), require('path').basename(imagePath));
      }
      formData.append('access_token', META_PAGE_TOKEN);

      const endpoint = isVideo ? 'videos' : 'photos';
      const url = `${GRAPH_URL}/${META_PAGE_ID}/${endpoint}`;
      
      const res = await fetch(url, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.id) {
        console.log(`✅ Facebook: posted ${isVideo ? 'video' : 'photo'} ${data.id}`);
        let imageUrl = null;
        if (!isVideo) {
          try {
            const imgRes = await fetch(`${GRAPH_URL}/${data.id}?fields=images&access_token=${META_PAGE_TOKEN}`);
            const imgData = await imgRes.json();
            if (imgData.images && imgData.images.length > 0) imageUrl = imgData.images[0].source;
          } catch (e) {}
        }
        return { ok: true, imageUrl };
      } else {
        console.error('❌ Facebook error:', JSON.stringify(data));
        return { ok: false, imageUrl: null };
      }
    } else {
      const url = `${GRAPH_URL}/${META_PAGE_ID}/feed`;
      const params = new URLSearchParams({ message: text, access_token: META_PAGE_TOKEN });
      const res = await fetch(url, { method: 'POST', body: params });
      const data = await res.json();
      return { ok: !!data.id, imageUrl: null };
    }
  } catch (e) {
    console.error('❌ Facebook exception:', e.message);
    return { ok: false, imageUrl: null };
  }
}

// ── Instagram Post ────────────────────────────────────────────────────────
async function postToInstagram(text, mediaUrl, isVideo = false) {
  if (!META_IG_USER_ID || !META_PAGE_TOKEN) return false;
  if (!mediaUrl) return false;

  try {
    const createParams = new URLSearchParams({
      caption: text,
      access_token: META_PAGE_TOKEN,
    });
    
    if (isVideo) {
      createParams.append('media_type', 'REELS');
      createParams.append('video_url', mediaUrl);
    } else {
      createParams.append('image_url', mediaUrl);
    }

    const createRes = await fetch(`${GRAPH_URL}/${META_IG_USER_ID}/media`, { method: 'POST', body: createParams });
    const createData = await createRes.json();

    if (!createData.id) {
      console.error('❌ Instagram container error:', JSON.stringify(createData));
      return false;
    }

    console.log(`📦 Instagram: container created ${createData.id}`);
    // Wait longer for video processing
    let ready = false;
    for (let i = 0; i < (isVideo ? 6 : 2); i++) {
        await new Promise(r => setTimeout(r, 5000));
        if (isVideo) {
           const statusRes = await fetch(`${GRAPH_URL}/${createData.id}?fields=status_code&access_token=${META_PAGE_TOKEN}`);
           const statusData = await statusRes.json();
           if (statusData.status_code === 'FINISHED') { ready = true; break; }
        } else {
           ready = true; break;
        }
    }

    const publishParams = new URLSearchParams({ creation_id: createData.id, access_token: META_PAGE_TOKEN });
    const pubRes = await fetch(`${GRAPH_URL}/${META_IG_USER_ID}/media_publish`, { method: 'POST', body: publishParams });
    const pubData = await pubRes.json();

    if (pubData.id) {
      console.log(`✅ Instagram: published ${pubData.id}`);
      return true;
    } else {
      console.error('❌ Instagram publish error:', JSON.stringify(pubData));
      return false;
    }
  } catch (e) {
    console.error('❌ Instagram exception:', e.message);
    return false;
  }
}

// ── Threads Post ──────────────────────────────────────────────────────────
// Uses public URL directly (not Facebook CDN) so images always work
async function postToThreads(text, mediaUrl, isVideo = false) {
  if (!THREADS_USER_ID || !THREADS_TOKEN) return false;

  try {
    const createParams = new URLSearchParams({ text, access_token: THREADS_TOKEN });
    
    if (mediaUrl) {
      createParams.append('media_type', isVideo ? 'VIDEO' : 'IMAGE');
      if (isVideo) createParams.append('video_url', mediaUrl);
      else createParams.append('image_url', mediaUrl);
    } else {
      createParams.append('media_type', 'TEXT');
    }

    console.log(`🧵 Threads: creating container (media_type=${mediaUrl ? (isVideo ? 'VIDEO' : 'IMAGE') : 'TEXT'}, url=${mediaUrl || 'none'})`);
    const createRes = await fetch(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads`, { method: 'POST', body: createParams });
    const createData = await createRes.json();

    if (!createData.id) {
      console.error('❌ Threads container error:', JSON.stringify(createData));
      // If IMAGE fails, retry as TEXT-only
      if (mediaUrl) {
        console.log('🔄 Threads: retrying as TEXT-only...');
        return postToThreads(text, null, false);
      }
      return false;
    }

    // Wait for media processing
    for (let i = 0; i < (isVideo ? 10 : 3); i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`https://graph.threads.net/v1.0/${createData.id}?fields=status&access_token=${THREADS_TOKEN}`);
        const statusData = await statusRes.json();
        if (statusData.status === 'FINISHED') break;
        if (statusData.status === 'ERROR') {
          console.error('❌ Threads media processing failed:', JSON.stringify(statusData));
          return false;
        }
    }

    const pubParams = new URLSearchParams({ creation_id: createData.id, access_token: THREADS_TOKEN });
    const pubRes = await fetch(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads_publish`, { method: 'POST', body: pubParams });
    const pubData = await pubRes.json();

    if (pubData.id) {
      console.log(`✅ Threads: published ${pubData.id}`);
      return true;
    } else {
      console.error('❌ Threads publish error:', JSON.stringify(pubData));
      return false;
    }
  } catch (e) {
    console.error('❌ Threads exception:', e.message);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
  const state = loadState();
  const items = content.engagement || [];

  // Initialize posted history for dedup
  if (!state.postedHashes) state.postedHashes = [];

  // Use the facebook index as the primary (all platforms share the same queue)
  const idx = state.facebook?.index || 0;

  if (idx >= items.length) {
    console.log(`✅ All ${items.length} engagement posts published on Meta. Done.`);
    process.exit(0);
  }

  const item = items[idx];
  const text = item.text.trim();

  // ── Dedup check: skip if this exact text was already posted ──
  const hash = text.substring(0, 80);
  if (state.postedHashes.includes(hash)) {
    console.log(`⚠️  Duplicate detected (index ${idx}), skipping: "${hash}..."`);
    state.facebook.index = idx + 1;
    state.instagram.index = idx + 1;
    state.threads.index = idx + 1;
    saveState(state);
    return;
  }

  console.log(`\n📝 Meta Post #${idx + 1}/${items.length}: "${text.substring(0, 60)}..."`);

  // Resolve image path — try multiple locations
  let imagePath = null;
  if (item.img) {
    const candidates = [
      item.img.startsWith('/') ? path.join(process.cwd(), 'public', item.img) : null,
      path.join(IMAGES_DIR, item.img),
      path.join(process.cwd(), 'public/images/social', item.img),
      path.join(process.cwd(), 'public/images/social', path.basename(item.img)),
    ].filter(Boolean);
    for (const p of candidates) {
      if (fs.existsSync(p)) { imagePath = p; break; }
    }
    if (!imagePath) console.warn(`⚠️  Image not found in any path: ${item.img}`);
  }

  // 1. Post to Facebook first — get public CDN URL from the uploaded photo
  const fb = await postToFacebook(text, imagePath);
  
  const isVideo = imagePath && imagePath.endsWith('.mp4');

  // Build a public URL for Threads/Instagram independently of Facebook CDN
  // Threads needs a publicly accessible URL — use the site's own domain
  let publicMediaUrl = null;
  if (item.img) {
    const imgPath = item.img.startsWith('/') ? item.img : `/images/social/${item.img}`;
    publicMediaUrl = `https://cvin.bio${imgPath}`;
  }
  // Prefer FB CDN for Instagram (better compatibility), fallback to public URL
  const igMediaUrl = fb.imageUrl || publicMediaUrl;
  // Always use public URL for Threads (FB CDN URLs are often restricted)
  const threadsMediaUrl = publicMediaUrl;

  await postToInstagram(text, igMediaUrl, isVideo);
  await postToThreads(text, threadsMediaUrl, isVideo);

  // Advance index if at least Facebook succeeded
  if (fb.ok) {
    state.facebook.index = idx + 1;
    state.instagram.index = idx + 1;
    state.threads.index = idx + 1;
    state.lastPostedAt = new Date().toISOString();
    state.postedHashes.push(hash);
    // Keep only last 200 hashes to prevent unbounded growth
    if (state.postedHashes.length > 200) state.postedHashes = state.postedHashes.slice(-200);
    saveState(state);
    console.log(`📊 Advanced Meta index to ${idx + 1}`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
