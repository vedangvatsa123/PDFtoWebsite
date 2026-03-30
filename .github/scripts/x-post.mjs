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

  // Post 17 → post_17.png (infographic: "the real cost of a bad hire")
  `The real cost of a bad hire:

$240,000 per wrong hire.
6 months to realize the mistake.
74% of employers admit they've hired wrong.

Companies spend more recovering from bad hires than actually finding good ones.

Be impossible to ignore. cvin.bio`,

  // Post 18 → post_18.png (infographic: "where recruiters actually look")
  `Where recruiters actually look:

1. LinkedIn — 3 seconds
2. Portfolio link — 12 seconds
3. Your CV — 6 seconds
4. Cover letter — never

A link gets 4x more attention than a PDF. cvin.bio`,

  // Post 19 → post_19.png (infographic: "remote jobs: what changed")
  `Remote work in 2021:
Everywhere. Flexible. Trust-based.

Remote work in 2026:
Hybrid mandatory. Surveillance software. Return to office.

The job market changed. Your strategy should too.

Start here. cvin.bio`,

  // Post 20 → post_20.png (infographic: "the interview gap")
  `What they ask: "Tell me about yourself."

What they mean: sell yourself in 60 seconds or you're out.

The gap between what interviewers say and what they want is enormous.

Let your profile speak before you walk in. cvin.bio`,

  // Post 21 → post_21.png (infographic: "your CV vs your profile")
  `Your CV: sits in a folder.
Your profile link: works while you sleep.

One gets lost. One gets shared.

Stop sending files. Start sharing links. cvin.bio`,

  // Post 22 → post_22.png (chart: "applications vs callbacks")
  `100 applications sent. 12 callbacks. 4 interviews. 1 offer.

That's the average.

The system isn't broken for companies. It's broken for you.

Make every application count. cvin.bio`,

  // Post 23 → post_23.png (pie chart: "why candidates get rejected")
  `Why candidates get rejected:

34% — No online presence
28% — Generic CV
22% — No portfolio
16% — Other

More than half of rejections happen before anyone reads your skills.

Fix the first impression. cvin.bio`,

  // Post 24 → post_24.png (timeline: "how long companies take to reply")
  `How long companies take to reply:

Day 1 — You apply.
Day 14 — Automated acknowledgment.
Day 45 — First human contact.
Day 90 — "We went with someone else."

90 days of silence is not a process. It's disrespect.

Take back control. cvin.bio`,

  // Post 25 → post_25.png (comparison: "PDF vs Link")
  `Sending a PDF:
✗ Filtered by ATS
✗ Buried in inbox
✗ Can't update once sent
✗ No analytics

Sharing a link:
✓ Bypasses all filters
✓ Always accessible
✓ Updates in real time
✓ Track who viewed

The difference is one click. cvin.bio`,

  // Post 26 → post_26.png (stats: "the job market in 2026")
  `The job market in 2026:

250 applications per opening.
7.4 seconds spent on each CV.
63% of jobs filled through networking.
85% of applications never reach a human.

Numbers don't lie. Your strategy needs to change. cvin.bio`,

  // Post 27 → post_27.png (fired after reporting to HR)
  `Someone reported their manager to HR.

HR asked them not to file an official report. "Just a misunderstanding."

Two weeks later, they were let go.

"Why don't you try to figure that out?" said the HR guy.

No paper trail. No proof. No protection.

Always file the report. cvin.bio`,

  // Post 28 → post_28.png (offer then devastated)
  `She got a job offer. And she was devastated.

Out of work for a year. Two interviews finally came through.

The one she wanted rejected her. The one she dreaded made an offer.

Same commute as her toxic old job. Same role. Same feeling.

But she took it. Because nothing else came through.

Sometimes you take the floor to stop the fall. cvin.bio`,

  // Post 29 → post_29.png (quit after 2 days)
  `He quit after 2 days.

His manager screamed at him during sales calls. Slammed things on the desk. Made him lie to customers.

His grandfather passed that weekend. Monday morning, the yelling continued.

He grabbed his stuff and walked out.

Manager's advice: "That's not a good look."

Neither is abuse. cvin.bio`,

  // Post 30 → post_30.png (rejected from every place)
  `"I've been rejected from every place in my small town."

Every restaurant. Every store. Every warehouse.

Not underqualified. Just unlucky.

Some people don't have the luxury of being picky. They just need someone to say yes.

Keep going. Someone will. cvin.bio`,

  // Post 31 → post_31.png (150 apps, 12k pay cut)
  `150 applications. 4 months. 12 first-round interviews.

One offer. $12,000 less than his current salary.

Same city. Same work. Same cost of living.

Stay miserable at $64k or leave for $52k and lose $1,000 a month.

The market is "take a 19% pay cut to change jobs" bad. cvin.bio`,

  // Post 32 → post_32.png (boss scheduled firing 3 days early)
  `His boss scheduled the firing meeting 3 days early. By accident.

He saw the invite on Teams while on vacation. With his wife. On their anniversary.

For 3 days he waited. Knowing. Panic attacks. Couldn't sleep.

When they finally let him go, they posted his exact job 22 minutes later.

For 20K less. cvin.bio`,

  // Post 33 → post_33.png (joblessness and depression)
  `"Joblessness is one of the worst things that can happen to someone."

Car parked in the same spot every day. Savings draining. 28 years old.

Got a new job. The coworker sabotaged his code. Lied to the CEO.

Fired again. Three months of depression.

More than a year gone. All savings gone.

Plan your safety net. cvin.bio`,

  // Post 34 → post_34.png (verbal offer pulled)
  `She accepted the offer verbally.

Cleared multiple rounds. Did presentations. Was told to expect the contract next week.

Instead, she got an email: "We will not be moving forward due to headcount."

1.5 years out of work. Countless interviews.

Now she has trust issues with job offers.

The system is broken. cvin.bio`,

  // Post 35 → post_35.png (changed jobs and hate it)
  `"I changed jobs and I hate it."

Left after 10 years. Took a better-paying role.

Ugly office. Cluttered desk. No handover. Predecessor hoarded all information.

The actual job? Correcting spelling in Word. Sending meeting invites. Taking minutes.

She went from doing skilled work to being a glorified assistant.

More money isn't always more life. cvin.bio`,

  // Post 36 → post_36.png (company taunted employees)
  `A company literally taunted its employees. Like dogs.

Dangled bonuses. Pulled them back. Set impossible KPIs.

2,700 upvotes. Hundreds of comments saying: "Same."

When the company treats you like a game piece, you're allowed to flip the board.

Know your worth. cvin.bio`,

  // Post 37 → post_37.png (loyalty never pays)
  `"Loyalty will earn you respect. Rarely a raise."

He stayed 4 years. Never missed a day. Always delivered.

Meanwhile, a new hire got 30% more. Day one.

Internal increments stay flat. The only real raise comes from leaving.

Loyalty is a beautiful word. It's just not a pay strategy. cvin.bio`,

  // Post 38 → post_38.png (remote job bait and switch)
  `The job post said "Permanent WFH."

She applied because the office was too far. Six months unemployed.

Got an interview. Checked the listing again. WFH was removed.

They edited it. After people applied.

Companies lure remote applicants, then switch to onsite.

Read the fine print. Every time. cvin.bio`,

  // Post 39 → post_39.png (I miss working)
  `"I miss working. I miss the dignity of having a job."

That was the whole post. 658 upvotes.

No rant. No details. Just someone who wanted to feel useful again.

Work isn't just a paycheck. It's purpose.

If you're in between — your next chapter isn't over. It hasn't started. cvin.bio`,

  // Post 40 → post_40.png (left good WLB for chaos)
  `He left a good job with great work-life balance.

Took a 75% pay increase at a big tech company.

Week one: fires everywhere. Nights and weekends expected. Skip-level manager hijacking standups.

His wife and kids felt it immediately.

He called his old boss. Asked to come back.

Extra pay isn't worth your peace. cvin.bio`,

  // Post 41 → post_41.png (interview went great then rejected)
  `Forklift driver. 6 years of experience.

Interviewer said he was the only applicant. Loved his resume.

"HR will set up your orientation."

4 AM the next morning: rejection email.

"We decided to go with other candidates."

What other candidates? He was the only one.

The lying never stops. cvin.bio`,

  // Post 42 → post_42.png (corporate performance theater)
  `"Is corporate culture just one big performance?"

Brown-nosing. Fake presentations. Forced team-building nobody wants.

He got promoted from blue-collar to management. Culture shock was brutal.

Zero respect for different personalities. Machiavellian games.

1,800 people upvoted. Nobody disagreed.

If the culture is a circus, you don't owe them another act. cvin.bio`,

  // Post 43 → post_43.png (hired back at higher salary)
  `Company let him go. Said the role was cut.

6 months later, his replacement quit.

HR called: "Would you come back?"

He said no.

Where were they when he begged to stay?

28% of new hires are boomerangs. Companies rehire the people they fired.

At higher salaries. cvin.bio`,

  // Post 44 → post_44.png (4 days to find a job)
  `"I have 4 days to find a job or I'll be removed from my house."

400 applications since February. Double-digit interviews.

Last 3 jobs refused to pay him or had something happen.

Legal citizen. Bank account. Still not getting paid.

4 days until homelessness.

The system doesn't just fail some people. It forgets them. cvin.bio`,

  // Post 45 → post_45.png (toxic job searching while burnt out)
  `"How do you job search while stuck in a toxic role?"

Managing a team. Coaching low performers. Getting zero support.

Publicly called out in meetings. Blamed when things fail.

Then going home and writing cover letters at midnight.

Burnout + job hunting is a full-time job on top of a full-time job.

You're not weak for struggling. cvin.bio`,

  // Post 46 → post_46.png (75% of resumes never seen)
  `75% of resumes never reach a human.

Not 50%. Not 60%. Three out of four.

Your carefully crafted resume, filtered out by a robot.

The CEO of GlobalWork confirmed it last week.

A link doesn't get filtered. It gets clicked.

Stop competing with bots. cvin.bio`,

  // Post 47 → post_47.png (hiring is risk avoidance)
  `Hiring isn't about finding the best person anymore.

It's about not making a bad decision.

Roles stay open for months. Interview rounds keep growing. Strong candidates get filtered for minor gaps.

Then companies complain they can't find anyone.

Hiring became risk avoidance theater. And everyone loses. cvin.bio`,

  // Post 48 → post_48.png (understaffing epidemic)
  `Understaffing has become an epidemic.

Pharmacies. Hotels. Grocery stores. Schools.

Companies cut headcount. Told 1 person to do the work of 3.

Then called it a "talent shortage."

2,800 upvotes. Because everyone has lived it.

You're not imagining being overworked. It's by design. cvin.bio`,

  // Post 49 → post_49.png (job search LinkedIn meme)
  `Job search on LinkedIn:

Apply → No response.
Apply → Auto-rejection in 3 minutes.
Apply → "We've decided to move forward with other candidates."
Apply → Ghosted.

12,000 upvotes. Because it's everyone's feed.

LinkedIn isn't broken. The process behind it is. cvin.bio`,

  // Post 50 → post_50.png (last day dignity)
  `His last day at the company.

He cleaned his desk. Returned his badge. Thanked his team.

Nobody from management said goodbye. HR sent a form.

After 4 years, he walked out the same door he walked in.

Invisible.

Companies talk about culture. Then treat exits like admin tasks.

You deserve a proper goodbye. cvin.bio`,

  // Post 51 → post_51.png (offered more than asked)
  `He asked for $58k. They offered $65k.

Said he was a great fit and wanted to move fast.

After 3 months of unemployment. 150+ applications.

Good employers do exist. And when they value you, they show it.

Don't sell yourself short. Someone will pay what you're worth.

Keep applying. cvin.bio`,

  // Post 52 → post_52.png (Sunday scaries)
  `If Sunday evenings fill you with dread, that's not laziness.

It's your body telling you the deal isn't right.

The commute you hate. The manager you avoid. The Slack you mute.

Life is too short to spend 50 weeks dreading Monday.

Your career isn't a life sentence. It's a choice.

Make a different one. cvin.bio`,

  // Post 53 → post_53.png (the spreadsheet)
  `He kept a spreadsheet.

Row 1: Applied. Row 2: Applied. Row 3: Applied.

By row 200, the "Status" column was all the same word: Nothing.

200 applications. Not 200 conversations. 200 silences.

He didn't need to apply harder. He needed to be found.

cvin.bio`,

  // Post 54 → post_54.png (the reference check)
  `Recruiter asked for 3 references. She sent them within the hour.

Told her old manager, her mentor, her former CTO. "They'll call this week."

All three cleared their schedules. Waited by the phone.

No one called. Not that week. Not ever.

The recruiter moved on. Never told her.

Three people waited for a call that was never coming.

The system wastes more than your time. It wastes the time of people who believe in you.

cvin.bio`,

  // Post 55 → post_55.png (applied to own company)
  `A software engineer applied to his own company's job posting. As an experiment.

Same resume that got him hired 2 years ago. Same skills. Same title.

The ATS rejected him in 4 minutes.

He was literally doing the job. The algorithm said he wasn't qualified for it.

The filter isn't finding the best people. It's losing them.

cvin.bio`,

  // Post 56 → post_56.png (the 10 year gap)
  `She raised two kids for 10 years.

Managed a household budget tighter than most startups. Coordinated schedules across 4 people. Negotiated with schools, doctors, contractors.

Every ATS saw one thing: a gap.

Not the 10 years of unpaid management. Not the problem-solving. Not the discipline.

Just a gap.

10 years of invisible work doesn't fit in a keyword filter.

cvin.bio`,

  // Post 57 → post_57.png (the internal candidate)
  `He trained 3 new hires. Covered for his manager during leave. Ran the team for 6 months.

When the manager role opened, he applied.

They hired someone external. No interview. No explanation.

The new manager asked him to "help with onboarding."

He was asked to train his own boss. Again.

Loyalty without leverage is just free labor.

cvin.bio`,
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
  let state = { index: 0, lastPostedAt: null };
  if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  // Cooldown: skip if last post was less than 4 hours ago (prevents duplicates from overlapping runs)
  if (state.lastPostedAt) {
    const elapsed = Date.now() - new Date(state.lastPostedAt).getTime();
    const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
    if (elapsed < COOLDOWN_MS) {
      const mins = Math.round(elapsed / 60000);
      console.log(`⏳ Cooldown: last post was ${mins}m ago (need ${COOLDOWN_MS / 60000}m gap). Skipping.`);
      process.exit(0);
    }
  }

  // Stop if all posts exhausted (don't cycle)
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
