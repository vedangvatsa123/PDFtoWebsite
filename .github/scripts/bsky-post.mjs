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
  `Someone reported their manager to HR.\n\nHR asked them not to file an official report. "Just a misunderstanding."\n\nTwo weeks later, they were let go.\n\n"Why don't you try to figure that out?" said the HR guy.\n\nNo paper trail. No proof. No protection.\n\nAlways file the report. cvin.bio`,
  `She got a job offer. And she was devastated.\n\nOut of work for a year. Two interviews finally came through.\n\nThe one she wanted rejected her. The one she dreaded made an offer.\n\nSame commute as her toxic old job. Same role. Same feeling.\n\nBut she took it. Because nothing else came through.\n\nSometimes you take the floor to stop the fall. cvin.bio`,
  `He quit after 2 days.\n\nHis manager screamed at him during sales calls. Slammed things on the desk. Made him lie to customers.\n\nHis grandfather passed that weekend. Monday morning, the yelling continued.\n\nHe grabbed his stuff and walked out.\n\nManager's advice: "That's not a good look."\n\nNeither is abuse. cvin.bio`,
  `"I've been rejected from every place in my small town."\n\nEvery restaurant. Every store. Every warehouse.\n\nNot underqualified. Just unlucky.\n\nSome people don't have the luxury of being picky. They just need someone to say yes.\n\nKeep going. Someone will. cvin.bio`,
  `150 applications. 4 months. 12 first-round interviews.\n\nOne offer. $12,000 less than his current salary.\n\nSame city. Same work. Same cost of living.\n\nStay miserable at $64k or leave for $52k and lose $1,000 a month.\n\nThe market is "take a 19% pay cut to change jobs" bad. cvin.bio`,
  `His boss scheduled the firing meeting 3 days early. By accident.\n\nHe saw the invite on Teams while on vacation. With his wife. On their anniversary.\n\nFor 3 days he waited. Knowing. Panic attacks. Couldn't sleep.\n\nWhen they finally let him go, they posted his exact job 22 minutes later.\n\nFor 20K less. cvin.bio`,
  `"Joblessness is one of the worst things that can happen to someone."\n\nCar parked in the same spot every day. Savings draining. 28 years old.\n\nGot a new job. The coworker sabotaged his code. Lied to the CEO.\n\nFired again. Three months of depression.\n\nMore than a year gone. All savings gone.\n\nPlan your safety net. cvin.bio`,
  `She accepted the offer verbally.\n\nCleared multiple rounds. Did presentations. Was told to expect the contract next week.\n\nInstead, she got an email: "We will not be moving forward due to headcount."\n\n1.5 years out of work. Countless interviews.\n\nNow she has trust issues with job offers.\n\nThe system is broken. cvin.bio`,
  `"I changed jobs and I hate it."\n\nLeft after 10 years. Took a better-paying role.\n\nUgly office. Cluttered desk. No handover. Predecessor hoarded all information.\n\nThe actual job? Correcting spelling in Word. Sending meeting invites. Taking minutes.\n\nMore money isn't always more life. cvin.bio`,
  `A company literally taunted its employees. Like dogs.\n\nDangled bonuses. Pulled them back. Set impossible KPIs.\n\n2,700 upvotes. Hundreds of comments saying: "Same."\n\nWhen the company treats you like a game piece, you're allowed to flip the board.\n\nKnow your worth. cvin.bio`,
  `"Loyalty will earn you respect. Rarely a raise."\n\nHe stayed 4 years. Never missed a day. Always delivered.\n\nMeanwhile, a new hire got 30% more. Day one.\n\nInternal increments stay flat. The only real raise comes from leaving.\n\nLoyalty is a beautiful word. It's just not a pay strategy. cvin.bio`,
  `The job post said "Permanent WFH."\n\nShe applied because the office was too far. Six months unemployed.\n\nGot an interview. Checked the listing again. WFH was removed.\n\nThey edited it. After people applied.\n\nCompanies lure remote applicants, then switch to onsite.\n\nRead the fine print. Every time. cvin.bio`,
  `"I miss working. I miss the dignity of having a job."\n\nThat was the whole post. 658 upvotes.\n\nNo rant. No details. Just someone who wanted to feel useful again.\n\nWork isn't just a paycheck. It's purpose.\n\nIf you're in between — your next chapter isn't over. It hasn't started. cvin.bio`,
  `He left a good job with great work-life balance.\n\nTook a 75% pay increase at a big tech company.\n\nWeek one: fires everywhere. Nights and weekends expected.\n\nHis wife and kids felt it immediately.\n\nHe called his old boss. Asked to come back.\n\nExtra pay isn't worth your peace. cvin.bio`,
  `Forklift driver. 6 years of experience.\n\nInterviewer said he was the only applicant. Loved his resume.\n\n"HR will set up your orientation."\n\n4 AM the next morning: rejection email.\n\n"We decided to go with other candidates."\n\nWhat other candidates? He was the only one.\n\nThe lying never stops. cvin.bio`,
  `"Is corporate culture just one big performance?"\n\nBrown-nosing. Fake presentations. Forced team-building nobody wants.\n\nHe got promoted from blue-collar to management. Culture shock was brutal.\n\n1,800 people upvoted. Nobody disagreed.\n\nIf the culture is a circus, you don't owe them another act. cvin.bio`,
  `Company let him go. Said the role was cut.\n\n6 months later, his replacement quit.\n\nHR called: "Would you come back?"\n\nHe said no.\n\nWhere were they when he begged to stay?\n\nCompanies rehire the people they fired. At higher salaries. cvin.bio`,
  `"I have 4 days to find a job or I'll be removed from my house."\n\n400 applications since February. Double-digit interviews.\n\nLast 3 jobs refused to pay him.\n\n4 days until homelessness.\n\nThe system doesn't just fail some people. It forgets them. cvin.bio`,
  `"How do you job search while stuck in a toxic role?"\n\nManaging a team. Getting zero support. Publicly called out in meetings.\n\nThen going home and writing cover letters at midnight.\n\nBurnout + job hunting is a full-time job on top of a full-time job.\n\nYou're not weak for struggling. cvin.bio`,
  `75% of resumes never reach a human.\n\nNot 50%. Not 60%. Three out of four.\n\nYour carefully crafted resume, filtered out by a robot.\n\nA link doesn't get filtered. It gets clicked.\n\nStop competing with bots. cvin.bio`,
  `Hiring isn't about finding the best person anymore.\n\nIt's about not making a bad decision.\n\nRoles stay open for months. Interview rounds keep growing.\n\nThen companies complain they can't find anyone.\n\nHiring became risk avoidance theater. And everyone loses. cvin.bio`,
  `Understaffing has become an epidemic.\n\nPharmacies. Hotels. Grocery stores. Schools.\n\nCompanies cut headcount. Told 1 person to do the work of 3.\n\nThen called it a "talent shortage."\n\nYou're not imagining being overworked. It's by design. cvin.bio`,
  `Job search on LinkedIn:\n\nApply → No response.\nApply → Auto-rejection in 3 minutes.\nApply → "We've decided to move forward with other candidates."\nApply → Ghosted.\n\n12,000 upvotes. Because it's everyone's feed.\n\nLinkedIn isn't broken. The process behind it is. cvin.bio`,
  `He asked for $58k. They offered $65k.\n\nSaid he was a great fit and wanted to move fast.\n\nAfter 3 months of unemployment. 150+ applications.\n\nGood employers do exist. And when they value you, they show it.\n\nDon't sell yourself short. Keep applying. cvin.bio`,
  `If Sunday evenings fill you with dread, that's not laziness.\n\nIt's your body telling you the deal isn't right.\n\nThe commute you hate. The manager you avoid. The Slack you mute.\n\nLife is too short to spend 50 weeks dreading Monday.\n\nYour career isn't a life sentence. It's a choice. cvin.bio`,
  `200 applications last month. 3 responses. All automated.\n\nNobody read the resume. Nobody saw the portfolio. Nobody clicked the GitHub.\n\nUpload your CV once. Get a live profile. See jobs matched to your skills.\n\ncvin.bio`,
  `Recruiter on LinkedIn. Monday: "We loved your profile."\n\nFriday: ghosted.\n\nTwo weeks later. Same job reposted. Same recruiter.\n\nStop waiting for them. Upload your CV, get matched to 6,000+ jobs.\n\ncvin.bio`,
  `Your resume is a file on someone's laptop.\n\nNo one opens it twice. No one shares it. No one finds it on Google.\n\nNow imagine it was a link. Shareable. Searchable. Always live. With jobs matched to your skills.\n\ncvin.bio`,
  `HR spent 6 seconds on your resume.\n\n6 seconds to judge 10 years of work.\n\nYou can't control how long they look. You can control what they see first.\n\ncvin.bio`,
  `Career page says "we value people."\n\nApplication: 47 fields. Retype your resume. Cover letter required.\n\nStatus: under review for 3 months.\n\nOr. Upload your CV once. Live profile. Matched jobs. Done.\n\ncvin.bio`,
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
