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

const STATE_FILE = path.join(__dirname, 'x-state.json');
const IMAGES_DIR = path.join(__dirname, '../images');

// ── 16 posts, each with its own matching image (post_01.png – post_16.png) ──
const POSTS = [
  // Post 1 → post_01.png (salary: "they said 15% raise. they gave 1.75%.")
  `Someone on Reddit shared this. 2,000 upvotes in a day.

Work of 3 people. $53k. No raise.

Manager promised 15%. Got 1.75%.

Left his keys on the desk. Walked out by 10am.

Nobody was surprised.

If they don't value you, someone else will. cvin.bio`,

  // Post 2 → post_02.png (ghosting: "job ghosting is the norm now.")
  `Job hunting in 2026:

45 minutes filling a form that already had your CV.
One call. Two interviews. Take-home task.

Two weeks later: nothing. Not a rejection. Just silence.

A profile that works for you even when companies don't. cvin.bio`,

  // Post 3 → post_03.png (entry: "entry level. 3-5 years required.")
  `Real job listing.

Entry level.
3-5 years experience required.
Degree required.
Salary: competitive.

The talent is there. The listing is broken.

You're more than a listing can capture. Show it at cvin.bio`,

  // Post 4 → post_04.png (understaffing: "companies say they can't find talent.")
  `Companies say they can't find talent.

They fired 3 people. Told 1 to cover it all.

Talent shortages at a 17-year high. Employee engagement at a 10-year low.

Know your worth before they pretend they don't. cvin.bio`,

  // Post 5 → post_05.png (pdf: "your CV is a PDF going nowhere.")
  `Someone posted a Sunday newspaper to r/jobs.

Job listings section: completely empty.

We still hire like it's that newspaper. PDF. ATS scans it. Bot rejects it. Hear nothing.

Skip the ATS. Share a link instead. cvin.bio`,

  // Post 6 → post_06.png (salary: "annual review season.")
  `Annual review.

Manager: "We value you."
HR: "Budget constraints."
Letter: 2.1% raise.
Inflation: 3.8%.

Effective pay cut dressed up as a raise.

Your next raise starts with being visible to the right people. cvin.bio`,

  // Post 7 → post_07.png (ghosting: "companies ghost after final round.")
  `Companies post about psychological safety.

Then ghost candidates after the final round.

The application experience is a preview of the culture.

The companies worth joining will find you first. cvin.bio`,

  // Post 8 → post_08.png (entry: "entry level used to mean you could learn.")
  `Entry level used to mean you could learn on the job.

Now it means: want someone senior, not paying senior rates, not willing to train.

Let your actual skills speak louder than the requirements. cvin.bio`,

  // Post 9 → post_09.png (understaffing: "the talent shortage isn't real.")
  `The talent shortage isn't real.

What's real: below-market pay, poor management, no flexibility.

The talent moved somewhere that treats it better.

Be somewhere better. cvin.bio`,

  // Post 10 → post_10.png (pdf: "72% of resumes rejected before a human sees them.")
  `72% of resumes are rejected before a human sees them.

The ATS was built to help recruiters manage volume.

It now filters out qualified candidates before anyone human reads them.

A link doesn't go through an ATS. cvin.bio`,

  // Post 11 → post_11.png (salary: "verbal promises aren't commitments.")
  `"We'll revisit your compensation in 6 months."

That was 18 months ago.

Verbal commitments in this economy are not commitments. They're stalling tactics.

Get it in writing. Or get better options. cvin.bio`,

  // Post 12 → post_12.png (ghosting: "recruiter said it was urgent.")
  `Recruiter called. Said it was urgent. Great fit.

Three interviews in two weeks.

Radio silence for a month.

Then: "Hey, are you still exploring opportunities?"

Let the right ones find you instead. cvin.bio`,

  // Post 13 → post_13.png (entry: "the ladder isn't broken. someone pulled it up.")
  `Fresh grad: degree, two internships, portfolio.

Entry level role: 3 years experience.
Junior role: 5 years.
Mid-level: management experience.

Someone pulled the ladder up.

Build the profile that bypasses the first filter. cvin.bio`,

  // Post 14 → post_14.png (understaffing: "understaffing is a business decision.")
  `Understaffing is a business decision dressed up as a market problem.

"We can't find anyone" means: nobody will work these hours for this pay with this manager.

Until they fix the conditions, you have options. cvin.bio`,

  // Post 15 → post_15.png (pdf: "your CV goes to a pile.")
  `Your CV goes to:
1. Email inbox.
2. ATS keyword filter.
3. 6-second skim.
4. Pile.

None of these care about your actual work.

Don't be a pile. Be a link. cvin.bio`,

  // Post 16 → post_16.png (salary: "loyalty is not a career strategy.")
  `The real math of staying loyal to one company:

Year 1: market rate.
Year 4: budget freeze.

Meanwhile, someone hired externally gets 20% more than you on day one.

Loyalty is not a career strategy. Options are. cvin.bio`,
];

// ── OAuth 1.0a ────────────────────────────────────────────────────────────
const pct = s => encodeURIComponent(String(s));

function oauthHeader(method, url) {
  const p = {
    oauth_consumer_key:     CONSUMER_KEY,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
    oauth_token:            ACCESS_TOKEN,
    oauth_version:          '1.0',
  };
  const base    = Object.keys(p).sort().map(k => `${pct(k)}=${pct(p[k])}`).join('&');
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
        console.log(`Media upload ${res.statusCode}:`, d.substring(0, 150));
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

// ── Post tweet v2 ─────────────────────────────────────────────────────────
function postTweet(text, mediaId) {
  return new Promise((resolve, reject) => {
    const url  = 'https://api.twitter.com/2/tweets';
    const body = JSON.stringify(mediaId
      ? { text, media: { media_ids: [mediaId] } }
      : { text });
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
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────
const COOLDOWN_MS = 7 * 60 * 60 * 1000; // 7 hours

async function main() {
  let state = { index: 0, lastPostedAt: null };
  if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  // Cooldown: skip if last post was less than 7 hours ago
  if (state.lastPostedAt) {
    const elapsed = Date.now() - new Date(state.lastPostedAt).getTime();
    if (elapsed < COOLDOWN_MS) {
      const hoursLeft = ((COOLDOWN_MS - elapsed) / 3600000).toFixed(1);
      console.log(`⏸ Cooldown: last post was ${(elapsed / 3600000).toFixed(1)}h ago. Next in ${hoursLeft}h. Skipping.`);
      process.exit(0);
    }
  }

  // Stop if all 16 posts exhausted (don't cycle)
  if (state.index >= POSTS.length) {
    console.log(`✅ All ${POSTS.length} posts published. Waiting for more content to be added.`);
    process.exit(0);
  }

  const postIndex = state.index;
  const imageNum  = String(postIndex + 1).padStart(2, '0');
  const imagePath = path.join(IMAGES_DIR, `post_${imageNum}.png`);

  let text = POSTS[postIndex].trim();
  if (text.length > 270) {
    text = text.substring(0, 270).replace(/\n[^\n]*$/, '') + '…';
  }

  console.log(`Posting X #${postIndex + 1}/${POSTS.length}`);
  console.log('Image:', `post_${imageNum}.png`);
  console.log('Preview:', text.substring(0, 80) + '...');

  // Upload image
  let mediaId = null;
  try {
    mediaId = await uploadMedia(imagePath);
    console.log('Media ID:', mediaId);
  } catch (e) {
    console.warn('Image upload failed, posting text-only:', e.message);
  }

  const result = await postTweet(text, mediaId);

  if (result.status === 201) {
    console.log(`✅ Tweet #${postIndex + 1} posted at ${new Date().toISOString()}`);
    state.index++;
    state.lastPostedAt = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } else {
    console.error('❌ Failed:', JSON.stringify(result.body, null, 2));
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
