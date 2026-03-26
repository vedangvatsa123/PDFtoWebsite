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

const IMG_DIR = path.join(__dirname, '..', 'images');

const POSTS = [
  `Someone on Reddit shared this. 2,000 upvotes in a day.\n\nWork of 3 people. $53k. No raise.\n\nManager promised 15%. Got 1.75%.\n\nLeft his keys on the desk. Walked out by 10am.\n\nNobody was surprised.\n\nIf they don't value you, someone else will. cvin.bio`,
  `Job hunting in 2026:\n\n45 minutes filling a form that already had your CV.\nOne call. Two interviews. Take-home task.\n\nTwo weeks later: nothing. Not a rejection. Just silence.\n\nA profile that works for you even when companies don't. cvin.bio`,
  `Real job listing.\n\nEntry level.\n3-5 years experience required.\nDegree required.\nSalary: competitive.\n\nThe talent is there. The listing is broken.\n\nYou're more than a listing can capture. Show it at cvin.bio`,
  `Companies say they can't find talent.\n\nThey fired 3 people. Told 1 to cover it all.\n\nTalent shortages at a 17-year high. Employee engagement at a 10-year low.\n\nKnow your worth before they pretend they don't. cvin.bio`,
  `Someone posted a Sunday newspaper to r/jobs.\n\nJob listings section: completely empty.\n\nWe still hire like it's that newspaper. PDF. ATS scans it. Bot rejects it. Hear nothing.\n\nSkip the ATS. Share a link instead. cvin.bio`,
  `Annual review.\n\nManager: "We value you."\nHR: "Budget constraints."\nLetter: 2.1% raise.\nInflation: 3.8%.\n\nEffective pay cut dressed up as a raise.\n\nYour next raise starts with being visible to the right people. cvin.bio`,
  `Companies post about psychological safety.\n\nThen ghost candidates after the final round.\n\nThe application experience is a preview of the culture.\n\nThe companies worth joining will find you first. cvin.bio`,
  `Entry level used to mean you could learn on the job.\n\nNow it means: want someone senior, not paying senior rates, not willing to train.\n\nLet your actual skills speak louder than the requirements. cvin.bio`,
  `The talent shortage isn't real.\n\nWhat's real: below-market pay, poor management, no flexibility.\n\nThe talent moved somewhere that treats it better.\n\nBe somewhere better. cvin.bio`,
  `72% of resumes are rejected before a human sees them.\n\nThe ATS was built to help recruiters manage volume.\n\nIt now filters out qualified candidates before anyone human reads them.\n\nA link doesn't go through an ATS. cvin.bio`,
  `"We'll revisit your compensation in 6 months."\n\nThat was 18 months ago.\n\nVerbal commitments in this economy are not commitments. They're stalling tactics.\n\nGet it in writing. Or get better options. cvin.bio`,
  `Recruiter called. Said it was urgent. Great fit.\n\nThree interviews in two weeks.\n\nRadio silence for a month.\n\nThen: "Hey, are you still exploring opportunities?"\n\nLet the right ones find you instead. cvin.bio`,
  `Fresh grad: degree, two internships, portfolio.\n\nEntry level role: 3 years experience.\nJunior role: 5 years.\nMid-level: management experience.\n\nSomeone pulled the ladder up.\n\nBuild the profile that bypasses the first filter. cvin.bio`,
  `Understaffing is a business decision dressed up as a market problem.\n\n"We can't find anyone" means: nobody will work these hours for this pay with this manager.\n\nUntil they fix the conditions, you have options. cvin.bio`,
  `Your CV goes to:\n1. Email inbox.\n2. ATS keyword filter.\n3. 6-second skim.\n4. Pile.\n\nNone of these care about your actual work.\n\nDon't be a pile. Be a link. cvin.bio`,
  `The real math of staying loyal to one company:\n\nYear 1: market rate.\nYear 4: budget freeze.\n\nMeanwhile, someone hired externally gets 20% more than you on day one.\n\nLoyalty is not a career strategy. Options are. cvin.bio`,
  `The real cost of a bad hire:\n\n$240,000 per wrong hire.\n6 months to realize the mistake.\n74% of employers admit they've hired wrong.\n\nCompanies spend more recovering from bad hires than actually finding good ones.\n\nBe impossible to ignore. cvin.bio`,
  `Where recruiters actually look:\n\n1. LinkedIn — 3 seconds\n2. Portfolio link — 12 seconds\n3. Your CV — 6 seconds\n4. Cover letter — never\n\nA link gets 4x more attention than a PDF. cvin.bio`,
  `Remote work in 2021:\nEverywhere. Flexible. Trust-based.\n\nRemote work in 2026:\nHybrid mandatory. Surveillance software. Return to office.\n\nThe job market changed. Your strategy should too.\n\nStart here. cvin.bio`,
  `What they ask: "Tell me about yourself."\n\nWhat they mean: sell yourself in 60 seconds or you're out.\n\nThe gap between what interviewers say and what they want is enormous.\n\nLet your profile speak before you walk in. cvin.bio`,
  `Your CV: sits in a folder.\nYour profile link: works while you sleep.\n\nOne gets lost. One gets shared.\n\nStop sending files. Start sharing links. cvin.bio`,
  `100 applications sent. 12 callbacks. 4 interviews. 1 offer.\n\nThat's the average.\n\nThe system isn't broken for companies. It's broken for you.\n\nMake every application count. cvin.bio`,
  `Why candidates get rejected:\n\n34% — No online presence\n28% — Generic CV\n22% — No portfolio\n16% — Other\n\nMore than half of rejections happen before anyone reads your skills.\n\nFix the first impression. cvin.bio`,
  `How long companies take to reply:\n\nDay 1 — You apply.\nDay 14 — Automated acknowledgment.\nDay 45 — First human contact.\nDay 90 — "We went with someone else."\n\n90 days of silence is not a process. It's disrespect.\n\nTake back control. cvin.bio`,
  `Sending a PDF:\n✗ Filtered by ATS\n✗ Buried in inbox\n✗ Can't update once sent\n✗ No analytics\n\nSharing a link:\n✓ Bypasses all filters\n✓ Always accessible\n✓ Updates in real time\n✓ Track who viewed\n\nThe difference is one click. cvin.bio`,
  `The job market in 2026:\n\n250 applications per opening.\n7.4 seconds spent on each CV.\n63% of jobs filled through networking.\n85% of applications never reach a human.\n\nNumbers don't lie. Your strategy needs to change. cvin.bio`,
];

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
  let state = { index: 0, lastPostedAt: null };
  if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  if (state.index >= POSTS.length) {
    console.log(`✅ All ${POSTS.length} posts published. Nothing to do.`);
    process.exit(0);
  }

  console.log(`🦋 Bluesky poster — posting #${state.index + 1} of ${POSTS.length}`);

  const session = await createSession();
  console.log(`🔑 Authenticated as ${session.handle}`);

  const text = POSTS[state.index];
  const imgNum = String(state.index + 1).padStart(2, '0');
  const imgPath = path.join(IMG_DIR, `post_${imgNum}.png`);

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
