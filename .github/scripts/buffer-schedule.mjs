// Buffer LinkedIn + Instagram Auto-Scheduler (GitHub Actions version)
// Reads state from buffer-state.json, schedules next batch, updates state

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'buffer-state.json');

const TOKEN = process.env.BUFFER_TOKEN;
if (!TOKEN) { console.error('Missing BUFFER_TOKEN'); process.exit(1); }

const CHANNELS = {
  linkedin:  '69c5268baf47dacb69589bc6',
};
const IMG_BASE = 'https://cvin.bio/images/social';

const CONTENT_FILE = path.join(__dirname, 'buffer-content.json');
const bufferContent = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
const POSTS = bufferContent.linkedin;
const IG_POSTS = bufferContent.instagram;
const FB_POSTS = bufferContent.facebook;

// Pick the right content per platform
function getPostText(platform, index) {
  if (platform === 'instagram') return IG_POSTS[index];
  if (platform === 'facebook') return FB_POSTS[index];
  return POSTS[index];
}

async function gql(query) {
  const r = await fetch('https://api.buffer.com/graphql', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

async function schedulePost(channelId, platform, text, imageNum, dueAt) {
  const mp4Local = require('path').join(__dirname, '../../public/images/social', `post_${imageNum}.mp4`);
  const isVideo = fs.existsSync(mp4Local);
  const mediaUrl = `${IMG_BASE}/post_${imageNum}.${isVideo ? 'mp4' : 'png'}`;
  
  const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  
  const metadataBlock = platform === 'instagram'
    ? `metadata: { instagram: { type: post, shouldShareToFeed: true } }`
    : platform === 'facebook'
    ? `metadata: { facebook: { type: post } }`
    : '';
    
  const assetsBlock = isVideo 
    ? `assets: { video: { url: "${mediaUrl}" } }`
    : `assets: { images: [{ url: "${mediaUrl}" }] }`;
  
  const query = `mutation {
    createPost(input: {
      channelId: "${channelId}"
      text: "${escapedText}"
      mode: customScheduled
      schedulingType: automatic
      dueAt: "${dueAt}"
      ${assetsBlock}
      ${metadataBlock}
    }) {
      ... on PostActionSuccess { post { id dueAt } }
      ... on LimitReachedError { message }
      ... on InvalidInputError { message }
      ... on UnexpectedError { message }
    }
  }`;
  
  return gql(query);
}

// 6 posts/day: 00:30, 04:30, 08:30, 12:30, 16:30, 20:30 UTC
function generateSchedule(startIndex) {
  const now = new Date();
  // Start from tomorrow
  let day = new Date(now);
  day.setUTCDate(day.getUTCDate() + 1);
  day.setUTCHours(0, 0, 0, 0);
  
  const slots = [
    { h: 0, m: 30, prevDay: false },
    { h: 4, m: 30, prevDay: false },
    { h: 8, m: 30, prevDay: false },
    { h: 12, m: 30, prevDay: false },
    { h: 16, m: 30, prevDay: false },
    { h: 20, m: 30, prevDay: false },
  ];
  const dates = [];
  let slotIdx = 0;
  
  while (dates.length < POSTS.length - startIndex) {
    const d = new Date(day);
    if (slots[slotIdx].prevDay) {
      d.setUTCDate(d.getUTCDate() - 1);
    }
    d.setUTCHours(slots[slotIdx].h, slots[slotIdx].m, 0, 0);
    
    if (d > now) {
      dates.push(d.toISOString());
    }
    
    slotIdx++;
    if (slotIdx >= slots.length) { slotIdx = 0; day.setUTCDate(day.getUTCDate() + 1); }
  }
  return dates;
}

async function main() {
  // Load state
  let state = { linkedin: 10, instagram: 10, facebook: 0 }; // default: first 10 already scheduled
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  
  console.log(`📅 Buffer Scheduler — current state: LI=${state.linkedin}, IG=${state.instagram}`);
  
  if (state.linkedin >= POSTS.length && state.instagram >= POSTS.length) {
    console.log('✅ All posts scheduled on all channels. Nothing to do.');
    process.exit(0);
  }
  
  for (const [platform, channelId] of Object.entries(CHANNELS)) {
    const skip = state[platform] || 0;
    if (skip >= POSTS.length) { console.log(`\n── ${platform}: all done ──`); continue; }
    
    const schedule = generateSchedule(skip);
    console.log(`\n── ${platform.toUpperCase()} (starting from #${skip + 1}) ──`);
    
    let scheduled = 0;
    
    for (let i = skip; i < POSTS.length; i++) {
      const imageNum = String(i + 1).padStart(2, '0');
      const dueAt = schedule[i - skip];
      if (!dueAt) break;
      const text = getPostText(platform, i);
      
      try {
        const result = await schedulePost(channelId, platform, text, imageNum, dueAt);
        
        if (result.data?.createPost?.post) {
          const time = new Date(dueAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          console.log(`✅ #${i + 1} → ${time}`);
          scheduled++;
          state[platform] = i + 1;
        } else {
          const err = result.data?.createPost?.message || result.errors?.[0]?.message || 'Unknown';
          console.log(`❌ #${i + 1} → ${err}`);
          if (err.includes('limit') || err.includes('Limit')) {
            console.log(`⏸ Hit limit for ${platform}. Will continue next run.`);
            break;
          }
        }
      } catch (e) {
        console.log(`❌ #${i + 1} → ${e.message}`);
      }
      
      await new Promise(r => setTimeout(r, 1500));
    }
    
    console.log(`   ${platform}: ${scheduled} new posts scheduled`);
  }
  
  // Save state
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`\n💾 State saved: LI=${state.linkedin}, IG=${state.instagram}`);
}

main().catch(e => { console.error(e); process.exit(1); });
