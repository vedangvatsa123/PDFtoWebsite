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

// Angle image map: 0-5 → salary, 6-11 → ghosting, etc.
const ANGLE_IMAGES = [
  path.join(IMAGES_DIR, 'salary.png'),
  path.join(IMAGES_DIR, 'ghosting.png'),
  path.join(IMAGES_DIR, 'entry.png'),
  path.join(IMAGES_DIR, 'understaffing.png'),
  path.join(IMAGES_DIR, 'pdf.png'),
];

// ── 30-post pool — unique CTA connecting naturally from each post ──────────
const POSTS = [
  // ANGLE 1: Salary (posts 0-5)
  `Someone on Reddit shared this. 2,000 upvotes in a day.

Work of 3 people. $53k. No raise.

Manager promised 15%. Got 1.75%.

Left his keys on the desk. Walked out by 10am.

Nobody was surprised.

If they don't value you, someone else will. cvin.bio`,

  `Annual review.

Manager: "We value you."
HR: "Budget constraints."
Letter: 2.1% raise.
Inflation: 3.8%.

Effective pay cut dressed up as a raise.

Your next raise starts with being visible to the right people. cvin.bio`,

  `"We'll revisit your compensation in 6 months."

That was 18 months ago.

Verbal commitments in this economy are not commitments. They're stalling tactics.

Get it in writing. Or get better options. cvin.bio`,

  `The real math of staying loyal to one company:

Year 1: market rate.
Year 4: budget freeze.

Meanwhile, someone hired externally gets 20% more than you on day one.

Loyalty is not a career strategy. Options are. cvin.bio`,

  `Biggest lie in performance reviews:

"We can only raise exceptional performers this cycle."

Translation: the exceptional performers already left.

Be easy to find when the right company comes looking. cvin.bio`,

  `Why external hires get paid more than you.

When you're already there, they pay what you accepted.
When someone new comes in, they have to compete.

Having options isn't aggressive. It's how this works. cvin.bio`,

  // ANGLE 2: Ghosting (posts 6-11)
  `Job hunting in 2026:

45 minutes filling a form that already had your CV.
One call. Two interviews. Take-home task.

Two weeks later: nothing. Not a rejection. Just silence.

A profile that works for you even when companies don't. cvin.bio`,

  `Companies post about psychological safety.

Then ghost candidates after the final round.

The application experience is a preview of the culture.

The companies worth joining will find you first. cvin.bio`,

  `Recruiter called. Said it was urgent. Great fit.

Three interviews in two weeks.

Radio silence for a month.

Then: "Hey, are you still exploring opportunities?"

Let the right ones find you instead. cvin.bio`,

  `"We'll be in touch by end of week."

Week 3: new hire announced on LinkedIn.

You were never going to hear back. They just didn't want to say so.

Stop waiting. Build the profile that keeps working. cvin.bio`,

  `The worst part of job hunting isn't rejection.

It's preparing hard, doing well, and then never hearing anything again.

At least rejection gives you information.

Make your profile something that stays visible regardless. cvin.bio`,

  `"Expect to hear from us Monday."

Monday: nothing.
Thursday: "We went another direction."

Could have said that before Monday.

Your next opportunity won't start with a 45-minute form. cvin.bio`,

  // ANGLE 3: Entry level (posts 12-17)
  `Real job listing.

Entry level.
3-5 years experience required.
Degree required.
Salary: competitive.

The talent is there. The listing is broken.

You're more than a listing can capture. Show it at cvin.bio`,

  `Entry level used to mean you could learn on the job.

Now it means: want someone senior, not paying senior rates, not willing to train.

Let your actual skills speak louder than the requirements. cvin.bio`,

  `Fresh grad: degree, two internships, portfolio.

Entry level role: 3 years experience.
Junior role: 5 years.
Mid-level: management experience.

Someone pulled the ladder up.

Build the profile that bypasses the first filter. cvin.bio`,

  `Entry Level Data Analyst.
Skills: Python, SQL, Tableau, Power BI, Excel, R, ML preferred.
Salary: $38,000.

And then a paragraph about "growth opportunities."

Your growth doesn't need their permission. cvin.bio`,

  `Hiring manager: we can't find qualified candidates.

Job listing: 5 years experience. Master's degree. Salary undisclosed.

The candidates exist. They moved on when they saw the listing.

Be somewhere better before they fix it. cvin.bio`,

  `The culture fit rejection:

Posted entry level. Wanted senior. Found one who'd accept entry pay.

That person leaves in 8 months. Cycle repeats.

Don't wait for it to repeat on you. cvin.bio`,

  // ANGLE 4: Understaffing (posts 18-23)
  `Companies say they can't find talent.

They fired 3 people. Told 1 to cover it all.

Talent shortages at a 17-year high. Employee engagement at a 10-year low.

Know your worth before they pretend they don't. cvin.bio`,

  `The talent shortage isn't real.

What's real: below-market pay, poor management, no flexibility.

The talent moved somewhere that treats it better.

Be somewhere better. cvin.bio`,

  `Understaffing is a business decision dressed up as a market problem.

"We can't find anyone" means: nobody will work these hours for this pay with this manager.

Until they fix the conditions, you have options. cvin.bio`,

  `Shortages at a 17-year high.
Engagement at a 10-year low.

These two things are connected.

Companies keep acting like they're not. Your next employer will show you the difference. cvin.bio`,

  `You can't treat people like disposable assets for a decade and act confused when they stop applying.

The engagement drop isn't mysterious.

Your energy belongs somewhere it's matched. cvin.bio`,

  `Companies spend thousands per hire on recruitment.

Almost nothing on retention.

Then wonder why they're always hiring.

Let the right companies find you at cvin.bio`,

  // ANGLE 5: PDF/ATS (posts 24-29)
  `Someone posted a Sunday newspaper to r/jobs.

Job listings section: completely empty.

We still hire like it's that newspaper. PDF. ATS scans it. Bot rejects it. Hear nothing.

Skip the ATS. Share a link instead. cvin.bio`,

  `72% of resumes are rejected before a human sees them.

The ATS was built to help recruiters manage volume.

It now filters out qualified candidates before anyone human reads them.

A link doesn't go through an ATS. cvin.bio`,

  `Your CV goes to:
1. Email inbox.
2. ATS keyword filter.
3. 6-second skim.
4. Pile.

None of these care about your actual work.

Don't be a pile. Be a link. cvin.bio`,

  `The application process, translated:

You: here is my career on one page.
ATS: does it have the exact keyword? No. Rejected.
Recruiter: why can't we find anyone good?

Be findable. cvin.bio`,

  `PDFs don't update.
Can't show your work.
Get lost in inboxes.
Look identical to everyone else's.

A link is alive. It shows who you are, what you built, how to reach you.

Turn your CV into a website at cvin.bio`,

  `The hiring process is broken. You know it. Recruiters know it. Even managers know it.

The candidates who stand out are the ones who don't rely on the system to do it for them.

Your profile. Your link. Your terms. cvin.bio`,
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
async function main() {
  let state = { index: 0 };
  if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  const poolIndex  = state.index % POSTS.length;
  const angleIndex = Math.floor(poolIndex / 6);
  const imagePath  = ANGLE_IMAGES[angleIndex];

  let text = POSTS[poolIndex].trim();
  // Trim to 270 chars at last sentence boundary if needed
  if (text.length > 270) {
    text = text.substring(0, 270).replace(/\n[^\n]*$/, '') + '…';
  }

  console.log(`Posting X #${state.index + 1} (pool ${poolIndex}, angle ${angleIndex + 1})`);
  console.log('Preview:', text.substring(0, 80) + '...');
  console.log('Image:', path.basename(imagePath));

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
    console.log(`✅ Tweet #${state.index + 1} posted at ${new Date().toISOString()}`);
    state.index++;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } else {
    console.error('❌ Failed:', JSON.stringify(result.body, null, 2));
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
