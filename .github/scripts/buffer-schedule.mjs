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
  instagram: '69c5279caf47dacb6958a000',
  facebook:  '69c52e07af47dacb6958a9bd',
};
const IMG_BASE = 'https://cvin.bio/images/social';

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
  `Forklift driver. 6 years of experience.\n\nInterviewer said he was the only applicant. Loved his resume.\n\n"HR will set up your orientation."\n\n4 AM the next morning: rejection email.\n\nWhat other candidates? He was the only one.\n\nThe lying never stops. cvin.bio`,
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
  `He kept a spreadsheet. Row 1: Applied. Row 2: Applied. Row 3: Applied.\n\nBy row 200, the Status column was all the same word: Nothing.\n\n200 applications. Not 200 conversations. 200 silences.\n\nHe didn't need to apply harder. He needed to be found.\n\ncvin.bio`,
  `Recruiter asked for 3 references. She sent them within the hour.\n\nAll three cleared their schedules. Waited by the phone.\n\nNo one called. Not that week. Not ever.\n\nThe system wastes more than your time. It wastes the time of people who believe in you.\n\ncvin.bio`,
  `A software engineer applied to his own company's job posting. As an experiment.\n\nSame resume that got him hired 2 years ago. Same skills. Same title.\n\nThe ATS rejected him in 4 minutes.\n\nThe filter isn't finding the best people. It's losing them.\n\ncvin.bio`,
  `She raised two kids for 10 years.\n\nManaged a household budget tighter than most startups. Coordinated schedules across 4 people.\n\nEvery ATS saw one thing: a gap.\n\n10 years of invisible work doesn't fit in a keyword filter.\n\ncvin.bio`,
  `He trained 3 new hires. Covered for his manager. Ran the team for 6 months.\n\nWhen the manager role opened, they hired someone external.\n\nThe new manager asked him to help with onboarding.\n\nLoyalty without leverage is just free labor.\n\ncvin.bio`,
  `47 thank you emails. 0 replies.\n\nShe followed every rule. Researched the company. Personalized every note.\n\nThey didn't even open them.\n\nThe system doesn't care about effort anymore.\n\ncvin.bio`,
  `She asked for market rate. They said the budget was fixed.\n\nTwo weeks later the same role was listed again. 25% higher than what she asked for.\n\nThe budget wasn't fixed. They just didn't want to pay her.\n\ncvin.bio`,
  `4 rounds of interviews. Perfect technical scores.\n\nRejection: "Not a culture fit."\n\nThe culture was 12-hour days, mandatory weekend Slack, and a ping pong table nobody used.\n\nShe was rejected for having boundaries.\n\ncvin.bio`,
  `3-day unpaid trial. She redesigned their entire homepage. Fixed 14 bugs.\n\nDay 4: ghosted.\n\nTwo weeks later, her design went live. Someone else's name in the credits.\n\nFree labor disguised as an interview.\n\ncvin.bio`,
  `He applied Monday. Auto-rejected Tuesday.\n\nWednesday, the same company liked his LinkedIn post.\n\nThursday, their recruiter commented: "Great insights!"\n\nThe algorithm rejected his resume. The humans engaged with his ideas.\n\ncvin.bio`,
  `He gave two weeks notice. They walked him out that afternoon.\n\nNo severance. No goodbye.\n\nThree days later: "What's the password to the analytics dashboard?"\n\nLoyalty is a one-way street.\n\ncvin.bio`,
  `PhD. 15 years. Applied for mid-level because she genuinely wanted it.\n\n"We're concerned you'd get bored."\n\nToo junior for senior. Too senior for mid-level. Too experienced to start over.\n\nNo correct answer when the question is designed to reject you.\n\ncvin.bio`,
  `Job listing said "Remote." She applied because office was 90 minutes away.\n\nOffer letter: "Remote during onboarding."\n\nWeek 3: mandatory office. 5 days. No exceptions.\n\nNobody mentioned it during 4 interviews.\n\ncvin.bio`,
  `He changed one word on his resume. Interview requests tripled.\n\n"Managed" became "Led."\n\nSame resume. Same experience. Same person. Different keyword.\n\nYour career shouldn't depend on vocabulary.\n\ncvin.bio`,
  `He resigned. Suddenly they found the budget.\n\nThe raise they denied for 2 years appeared in 24 hours.\n\nHe stayed. Laid off 3 months later.\n\nA counter offer isn't a compliment. It's a stalling tactic.\n\ncvin.bio`,
];

// Instagram-optimized captions: punchy hook, emojis, shorter body, hashtags
const IG_POSTS = [
  `💥 2,000 upvotes on Reddit in one day.\n\nWork of 3 people. $53k. No raise.\nPromised 15%. Got 1.75%.\n\nHe walked out by 10am.\n\n📌 Link in bio → cvin.bio\n\n#careeradvice #quitmyjob #knowyourworth #jobmarket #careertips`,
  `⏳ 45 min filling forms. 2 interviews. Take-home task.\n\nTwo weeks later: silence.\n\nNot even a rejection.\n\n📌 Link in bio → cvin.bio\n\n#jobhunting #jobsearch2026 #hiring #careerchange #resumetips`,
  `📋 "Entry level" job:\n→ 3-5 years required\n→ Degree required\n→ Salary: "competitive"\n\nThe listing is broken, not the talent.\n\n📌 Link in bio → cvin.bio\n\n#entrylevel #jobsearch #hiring #careeradvice #jobmarket`,
  `🚨 Companies say they can't find talent.\n\nThey fired 3. Told 1 to cover it all.\n\nTalent shortage at a 17-year high.\nEngagement at a 10-year low.\n\n📌 Link in bio → cvin.bio\n\n#talentshortage #hiring #workculture #careeradvice #knowyourworth`,
  `📰 Someone posted a Sunday newspaper job section.\n\nCompletely empty.\n\nWe still hire like it's 1995. PDF → ATS → rejected → silence.\n\n📌 Link in bio → cvin.bio\n\n#resumetips #ats #jobsearch #careeradvice #hiring`,
  `📊 Annual review results:\n\nManager: "We value you."\nHR: "Budget constraints."\nRaise: 2.1%\nInflation: 3.8%\n\nThat's a pay cut.\n\n📌 Link in bio → cvin.bio\n\n#salary #paycut #careeradvice #knowyourworth #raise`,
  `🤝 Companies post about psychological safety.\n\nThen ghost you after the final round.\n\nThe interview process IS the culture.\n\n📌 Link in bio → cvin.bio\n\n#ghosting #interviewing #jobsearch #workculture #hiring`,
  `🪜 "Entry level" used to mean you could learn.\n\nNow: want senior skills, junior pay, zero training.\n\nLet your skills speak louder.\n\n📌 Link in bio → cvin.bio\n\n#entrylevel #juniordev #careeradvice #jobmarket #hiring`,
  `📉 The talent shortage isn't real.\n\nWhat's real:\n→ Below-market pay\n→ Poor management\n→ No flexibility\n\nTalent moved somewhere better.\n\n📌 Link in bio → cvin.bio\n\n#talentshortage #workculture #careerchange #jobmarket #hiring`,
  `🤖 72% of resumes are rejected by a bot.\n\nBefore any human sees them.\n\nA link doesn't go through an ATS.\n\n📌 Link in bio → cvin.bio\n\n#ats #resumetips #jobsearch #careeradvice #applicanttracking`,
  `🗓️ "We'll revisit your compensation in 6 months."\n\nThat was 18 months ago.\n\nVerbal promises are stalling tactics.\n\n📌 Link in bio → cvin.bio\n\n#salary #compensation #careeradvice #knowyourworth #negotiation`,
  `📞 Recruiter: "Urgent. Great fit."\n\n3 interviews. Then silence.\n\n1 month later: "Still exploring opportunities?"\n\n📌 Link in bio → cvin.bio\n\n#recruiter #ghosting #jobsearch #hiring #interviewtips`,
  `🎓 Fresh grad: degree + 2 internships + portfolio.\n\nEntry level: 3 years exp.\nJunior: 5 years.\nMid: management exp.\n\nSomeone pulled the ladder up.\n\n📌 Link in bio → cvin.bio\n\n#freshgrad #entrylevel #jobsearch #careeradvice #hiring`,
  `🏢 "We can't find anyone."\n\nTranslation: nobody will work these hours, for this pay, with this manager.\n\nUnderstaffing is a choice.\n\n📌 Link in bio → cvin.bio\n\n#understaffing #workculture #hiring #careeradvice #jobmarket`,
  `📄 Your CV goes through:\n1️⃣ Inbox\n2️⃣ ATS filter\n3️⃣ 6-second skim\n4️⃣ The pile\n\nNone of these care about your work.\n\n📌 Link in bio → cvin.bio\n\n#resume #cv #ats #jobsearch #careeradvice`,
  `📈 Year 1: market rate.\nYear 4: budget freeze.\n\nMeanwhile, new hires get 20% more.\n\nLoyalty is not a career strategy.\n\n📌 Link in bio → cvin.bio\n\n#salary #loyalty #careeradvice #knowyourworth #jobchange`,
  `💰 The real cost of a bad hire:\n\n$240K per wrong hire\n6 months to realize\n74% of employers admit it\n\nBe impossible to ignore.\n\n📌 Link in bio → cvin.bio\n\n#hiring #recruitment #careeradvice #jobmarket #talentacquisition`,
  `👀 Where recruiters actually look:\n\n1. LinkedIn — 3 sec\n2. Portfolio — 12 sec\n3. CV — 6 sec\n4. Cover letter — never\n\n📌 Link in bio → cvin.bio\n\n#recruiter #resume #portfolio #careeradvice #jobsearch`,
  `🏠 Remote work 2021 vs 2026:\n\nThen: Everywhere. Flexible. Trust.\nNow: Hybrid mandatory. RTO.\n\nThe market changed. Your strategy should too.\n\n📌 Link in bio → cvin.bio\n\n#remotework #hybrid #rto #careeradvice #workfromhome`,
  `🎤 "Tell me about yourself."\n\nWhat they mean: sell yourself in 60 seconds or you're out.\n\nLet your profile speak first.\n\n📌 Link in bio → cvin.bio\n\n#interviewtips #interviewing #jobsearch #careeradvice #hiring`,
  `📁 CV: sits in a folder.\n🔗 Profile link: works while you sleep.\n\nOne gets lost. One gets shared.\n\n📌 Link in bio → cvin.bio\n\n#resume #cv #portfolio #careeradvice #jobsearch`,
  `📊 100 applications → 12 callbacks → 4 interviews → 1 offer.\n\nThat's the average.\n\nThe system is broken for you.\n\n📌 Link in bio → cvin.bio\n\n#jobsearch #applications #hiring #careeradvice #jobmarket`,
  `❌ Why candidates get rejected:\n\n34% No online presence\n28% Generic CV\n22% No portfolio\n16% Other\n\nFix the first impression.\n\n📌 Link in bio → cvin.bio\n\n#resume #portfolio #careeradvice #jobsearch #hiring`,
  `⏱️ How long companies take to reply:\n\nDay 1 — You apply\nDay 14 — Auto email\nDay 45 — First human\nDay 90 — "We went with someone else"\n\n📌 Link in bio → cvin.bio\n\n#ghosting #hiring #jobsearch #careeradvice #interview`,
  `📄 PDF vs 🔗 Link:\n\n✗ ATS filter vs ✓ Bypass\n✗ Gets buried vs ✓ Always live\n✗ No updates vs ✓ Real-time\n✗ No data vs ✓ Track views\n\n📌 Link in bio → cvin.bio\n\n#resume #cv #portfolio #careeradvice #jobsearch`,
  `📈 Job market 2026:\n\n250 applications per opening\n7.4 sec on each CV\n63% filled via networking\n85% never reach a human\n\nYour strategy needs to change.\n\n📌 Link in bio → cvin.bio\n\n#jobmarket #careeradvice #hiring #jobsearch #networking`,
  `🚨 Reported manager to HR.\n\nHR: "Don't file a report. Just a misunderstanding."\n\n2 weeks later: fired.\n\nNo paper trail. No protection.\n\nAlways. File. The. Report.\n\n📌 Link in bio → cvin.bio\n\n#toxicworkplace #hr #careeradvice #knowyourrights #workplace`,
  `😔 Got a job offer. Was devastated.\n\nOut of work for a year. 2 interviews came through.\n\nDream job rejected her. The nightmare made an offer.\n\nSame commute as her old toxic job.\n\nShe took it. Nothing else came.\n\n📌 Link in bio → cvin.bio\n\n#jobsearch #career #jobhunting #toxic #careerchange`,
  `💥 Quit after 2 days.\n\nManager screamed during calls. Slammed things.\n\nGrandfather passed. Monday, yelling continued.\n\nGrabbed his stuff. Walked out.\n\nManager: "Not a good look."\n\nNeither is abuse.\n\n📌 Link in bio → cvin.bio\n\n#quitmyjob #toxicboss #careeradvice #workplace #mentalhealth`,
  `😞 "Rejected from every place in my small town."\n\nEvery restaurant. Every store. Every warehouse.\n\nNot unqualified. Just unlucky.\n\nKeep going. Someone will say yes.\n\n📌 Link in bio → cvin.bio\n\n#jobsearch #rejection #keepgoing #motivation #careeradvice`,
  `📉 150 apps. 4 months. 1 offer.\n\n$12,000 LESS than current salary.\n\nSame city. Same work.\n\nStay miserable at $64k or take $52k?\n\n19% pay cut to change jobs. That's 2026.\n\n📌 Link in bio → cvin.bio\n\n#jobmarket #salary #careerchange #jobhunting #paycut`,
  `😱 Boss scheduled his firing 3 DAYS early.\n\nSaw it on Teams. On vacation. Wedding anniversary.\n\n3 days of panic attacks.\n\nFired. 22 min later: his job reposted for 20K less.\n\n📌 Link in bio → cvin.bio\n\n#layoffs #fired #corporate #toxicworkplace #careeradvice`,
  `💔 28 years old. Savings gone. Car parked in the same spot.\n\nGot a new job. Coworker sabotaged his code. Lied to CEO.\n\nFired again. 3 months of depression.\n\nMore than a year gone.\n\n📌 Link in bio → cvin.bio\n\n#unemployed #jobless #depression #mentalhealth #careeradvice`,
  `❌ Accepted offer verbally.\n\nMultiple interview rounds. Presentations.\n\nEmail: "Not moving forward. Headcount issues."\n\n1.5 years out of work.\n\nNow she has trust issues with job offers.\n\n📌 Link in bio → cvin.bio\n\n#offerrescinded #jobsearch #hiring #ghosting #careeradvice`,
  `😤 "I changed jobs and I hate it."\n\nLeft after 10 years. More money.\n\nNo handover. Predecessor hoarded info.\n\nActual job: fixing spelling in Word. Taking minutes.\n\nMore money ≠ more life.\n\n📌 Link in bio → cvin.bio\n\n#careerchange #regret #jobmarket #workplace #careeradvice`,
  `🐕 Company taunted employees like dogs.\n\nDangled bonuses → pulled them back.\n\nImpossible KPIs. 2,700 upvotes.\n\nFlip the board.\n\n📌 Link in bio → cvin.bio\n\n#toxicworkplace #workculture #knowyourworth #careeradvice #quitmyjob`,
  `📊 Stayed 4 years. Never missed a day.\n\nNew hire got 30% more. Day one.\n\n"Loyalty earns respect. Rarely a raise."\n\nThe only real raise comes from leaving.\n\n📌 Link in bio → cvin.bio\n\n#loyalty #salary #careeradvice #knowyourworth #jobchange`,
  `🏠 Job post: "Permanent WFH."\n\nApplied. Got interview.\n\nChecked listing again. WFH removed.\n\nThey edited it AFTER people applied.\n\nBait. And. Switch.\n\n📌 Link in bio → cvin.bio\n\n#remotework #wfh #workfromhome #baitandswitch #jobsearch`,
  `🥺 "I miss working. I miss the dignity of having a job."\n\nThat was the whole post. 658 upvotes.\n\nNo rant. Just someone wanting to feel useful.\n\nYour next chapter hasn't started yet.\n\n📌 Link in bio → cvin.bio\n\n#unemployed #jobsearch #dignity #career #motivation`,
  `💸 Left good WLB for 75% more pay.\n\nWeek 1: fires everywhere. Nights. Weekends.\n\nWife and kids felt it immediately.\n\nCalled old boss. Asked to come back.\n\nExtra pay ≠ peace.\n\n📌 Link in bio → cvin.bio\n\n#worklifebalance #wifeandkids #careerchange #salary #peace`,
  `🤥 Forklift driver. 6 years exp.\n\nInterviewer: "You're the only applicant."\n"HR will set up orientation."\n\n4 AM: rejection email.\n\n"Other candidates" — he was the only one.\n\n📌 Link in bio → cvin.bio\n\n#interview #lied #jobsearch #hiring #rejection`,
  `🎭 "Is corporate culture just one big performance?"\n\nBrown-nosing. Fake presentations.\nForced team-building.\n\n1,800 upvotes. Nobody disagreed.\n\nIf it's a circus, you don't owe another act.\n\n📌 Link in bio → cvin.bio\n\n#corporate #workculture #office #careeradvice #toxic`,
  `🔄 Company cut his role.\n\n6 months later replacement quit.\n\nHR: "Come back?"\n\nHe said no.\n\nWhere were they when he begged to stay?\n\n📌 Link in bio → cvin.bio\n\n#layoffs #boomerang #rehired #careeradvice #knowyourworth`,
  `🏠 "4 days to find a job or I lose my house."\n\n400 apps. Last 3 jobs didn't pay him.\n\nLegal citizen. Bank account.\n\n4 days until homelessness.\n\nThe system forgets people.\n\n📌 Link in bio → cvin.bio\n\n#homeless #jobsearch #unemployment #help #careeradvice`,
  `😩 Job searching while stuck in a toxic role.\n\nPublicly called out. Zero support.\n\nCover letters at midnight.\n\nBurnout + job hunting = 2 full-time jobs.\n\nYou're not weak for struggling.\n\n📌 Link in bio → cvin.bio\n\n#burnout #toxicjob #jobsearch #mentalhealth #careerchange`,
  `🤖 75% of resumes never reach a human.\n\n3 out of 4. Filtered by a robot.\n\nA link doesn't get filtered. It gets clicked.\n\nStop competing with bots.\n\n📌 Link in bio → cvin.bio\n\n#ats #resume #jobsearch #careeradvice #portfolio`,
  `⚠️ Hiring isn't about finding the best person.\n\nIt's about not making a bad decision.\n\nRoles open for months. Interview rounds growing.\n\nThen: "We can't find anyone."\n\nRisk avoidance theater.\n\n📌 Link in bio → cvin.bio\n\n#hiring #recruitment #jobmarket #careeradvice #interview`,
  `🏥 Understaffing is now an epidemic.\n\nPharmacies. Hotels. Schools.\n\n1 person doing the work of 3.\n\nThey call it a "talent shortage."\n\nIt's by design.\n\n📌 Link in bio → cvin.bio\n\n#understaffing #workculture #burnout #careeradvice #hiring`,
  `💀 LinkedIn job search:\n\nApply → No response\nApply → Auto-reject in 3 min\nApply → Ghosted\n\n12,000 upvotes.\n\nLinkedIn isn't broken. The process is.\n\n📌 Link in bio → cvin.bio\n\n#linkedin #jobsearch #ghosting #hiring #careeradvice`,
  `🎉 Asked for $58k. Offered $65k.\n\n"Great fit. Moving fast."\n\nAfter 3 months unemployed. 150+ apps.\n\nGood employers exist.\n\nDon't sell yourself short.\n\n📌 Link in bio → cvin.bio\n\n#salary #joboffer #motivation #careeradvice #keepgoing`,
  `😰 Sunday scaries hitting different?\n\nThe commute you hate. The manager you avoid.\n\nLife's too short to dread Monday 50 weeks a year.\n\nYour career isn't a life sentence.\n\n📌 Link in bio → cvin.bio\n\n#sundayscaries #burnout #careerchange #motivation #mentalhealth`,
  `📊 He kept a spreadsheet of applications.\n\nRow 1: Applied. Row 200: Nothing.\n\n200 silences. Not conversations.\n\nHe didn't need to apply harder. He needed to be found.\n\n📌 Link in bio → cvin.bio\n\n#jobsearch #applications #silence #careeradvice #hiring`,
  `📞 Recruiter asked for 3 references.\n\nAll 3 cleared their schedules. Waited by the phone.\n\nNo one called. Not ever.\n\nThe system wastes more than your time.\n\n📌 Link in bio → cvin.bio\n\n#recruiter #ghosting #references #jobsearch #hiring`,
  `🤖 Engineer applied to his OWN company's job posting.\n\nSame resume. Same skills. Same title.\n\nATS rejected him in 4 minutes.\n\nThe filter isn't finding people. It's losing them.\n\n📌 Link in bio → cvin.bio\n\n#ats #resume #jobsearch #hiring #careeradvice`,
  `👩 She raised 2 kids for 10 years.\n\nManaged budgets. Coordinated 4 schedules.\n\nEvery ATS saw one thing: a gap.\n\n10 years of invisible work.\n\n📌 Link in bio → cvin.bio\n\n#careergap #women #hiring #careeradvice #returntowork`,
  `🏢 Trained 3 new hires. Ran the team 6 months.\n\nManager role opened. They hired externally.\n\nNew manager asked him to "help with onboarding."\n\nLoyalty without leverage = free labor.\n\n📌 Link in bio → cvin.bio\n\n#loyalty #promotion #careeradvice #workplace #hiring`,
  `📧 47 thank you emails. 0 replies.\n\nShe followed every rule. Personalized every note.\n\nThey didn't even open them.\n\n📌 Link in bio → cvin.bio\n\n#jobsearch #thankyou #ghosting #hiring #careeradvice`,
  `💰 She asked for market rate. "Budget is fixed."\n\n2 weeks later: same role listed. 25% higher.\n\nThe budget wasn't fixed.\n\n📌 Link in bio → cvin.bio\n\n#salary #negotiation #knowyourworth #hiring #payequity`,
  `🎭 Rejected for "culture fit."\n\n4 rounds. Perfect scores.\n\nThe culture was 12-hour days and weekend Slack.\n\nShe had boundaries.\n\n📌 Link in bio → cvin.bio\n\n#culturefit #interview #hiring #boundaries #careeradvice`,
  `⚠️ 3-day unpaid trial. She redesigned their homepage.\n\nDay 4: ghosted.\n\nHer design went live. Someone else's name.\n\nFree labor.\n\n📌 Link in bio → cvin.bio\n\n#freelabor #interview #design #ghosting #careeradvice`,
  `🤖 Applied Monday. Auto-rejected Tuesday.\n\nSame company liked his LinkedIn post Wednesday.\n\nThe algorithm rejected him. The humans didn't.\n\n📌 Link in bio → cvin.bio\n\n#ats #linkedin #jobsearch #irony #careeradvice`,
  `🚪 Gave two weeks. Walked out that day.\n\nNo severance. Then they called asking for passwords.\n\nLoyalty is a one-way street.\n\n📌 Link in bio → cvin.bio\n\n#twoweeks #loyalty #quitting #careeradvice #workplace`,
  `🎓 PhD. 15 years. "We're worried you'd get bored."\n\nToo junior for senior. Too senior for mid-level.\n\nNo correct answer.\n\n📌 Link in bio → cvin.bio\n\n#overqualified #phd #hiring #ageism #careeradvice`,
  `🏠 Job said "Remote."\n\nWeek 3: mandatory office. 5 days. 90-min commute.\n\nNobody mentioned it in 4 interviews.\n\n📌 Link in bio → cvin.bio\n\n#remote #wfh #rto #hiring #baitandswitch`,
  `⌨️ Changed one word. Interviews tripled.\n\n"Managed" → "Led."\n\nSame everything. Different keyword.\n\n📌 Link in bio → cvin.bio\n\n#resume #keywords #ats #jobsearch #careeradvice`,
  `💸 He resigned. They suddenly found the budget.\n\nThe raise denied for 2 years: appeared in 24 hours.\n\nHe stayed. Laid off 3 months later.\n\nNever accept a counter offer.\n\n📌 Link in bio → cvin.bio\n\n#counteroffer #resign #salary #careeradvice #layoff`,
];

// Facebook-optimized: conversational, longer, questions to drive comments
const FB_POSTS = [
  `This went viral on Reddit — 2,000 upvotes in a day.

Someone shared their story: doing the work of 3 people for $53k. No raise in sight.

Manager promised 15%. Annual review came around: 1.75%.

He left his keys on the desk and walked out by 10am. Nobody was surprised.

Has this happened to you or someone you know? Drop a comment.

cvin.bio`,
  `This is what job hunting actually looks like in 2026:

45 minutes filling out a form that already had your resume. One screening call. Two interviews. A take-home assignment.

Two weeks of silence. No rejection. Just nothing.

Why is this still normal? cvin.bio`,
  `Saw a real job listing the other day.

"Entry level."
3-5 years experience required.
Degree mandatory.
Salary: competitive.

How is this entry level? The listing is broken, not the people applying.

cvin.bio`,
  `Companies keep saying they can't find talent.

But here's what actually happened: they fired 3 people and told 1 person to handle everything.

Talent shortage at a 17-year high. Employee engagement at a 10-year low.

See the connection? cvin.bio`,
  `Someone posted a photo of a Sunday newspaper's job listings section.

Completely empty.

And yet we still hire the same way — send a PDF, let an algorithm scan it, get ghosted. Nothing has changed except who does the rejecting.

cvin.bio`,
  `Annual review season be like:

Manager: "We really value you."
HR: "Budget constraints this year."
The letter: 2.1% raise.
Actual inflation: 3.8%.

That's not a raise. That's a pay cut with a thank you note.

cvin.bio`,
  `Companies love to post about psychological safety and great culture.

Then they ghost candidates after the final interview round.

The way you treat candidates IS your culture. People notice.

cvin.bio`,
  `Remember when "entry level" meant someone would train you?

Now it means: we want someone experienced but we're paying beginner rates and we're not willing to teach.

When did this change? cvin.bio`,
  `The "talent shortage" isn't about missing talent.

It's about:
- Below-market pay
- Bad management
- Zero flexibility

The people didn't disappear. They found somewhere that treats them better.

cvin.bio`,
  `Here's a number that should bother everyone: 72% of resumes never reach a human.

ATS software was built to save recruiters time. Now it filters out qualified people before anyone can see them.

Something is broken here. cvin.bio`,
  `"We'll revisit your compensation in 6 months."

That was a year and a half ago.

Anyone else sitting on a verbal promise that never came through? These aren't commitments. They're delay tactics.

cvin.bio`,
  `Recruiter calls. Says it's urgent. Perfect fit.

Three interviews in two weeks. Everything looks great.

Then: radio silence for a month.

Followed by: "Hey, are you still looking?"

Yes, this is still happening in 2026. cvin.bio`,
  `Fresh graduate with a degree, two internships, and a portfolio.

Entry level role: requires 3 years.
Junior role: 5 years.
Mid-level: management experience.

Who pulled the ladder up? cvin.bio`,
  `"We can't find anyone to hire."

Translation: nobody wants these hours, this pay, and this management style.

Understaffing is a business decision. Not a talent problem.

cvin.bio`,
  `Where your CV actually ends up:

1. Someone's inbox
2. An ATS keyword filter
3. A 6-second skim
4. A pile

None of these steps care about your actual work. Time to rethink the approach.

cvin.bio`,
  `Quick math on company loyalty:

Year 1: You're at market rate.
Year 4: "Budget freeze."

Meanwhile, a new hire walks in at 20% above your salary. Day one.

Loyalty doesn't pay. Options do. cvin.bio`,
  `The actual cost of hiring the wrong person:

$240,000 per bad hire.
6 months before anyone notices.
74% of companies say they've made this mistake.

Companies spend more fixing bad hires than finding good ones. cvin.bio`,
  `This is how much time recruiters actually spend:

LinkedIn profile — 3 seconds
Portfolio link — 12 seconds
Your CV — 6 seconds
Cover letter — they don't read it

A link gets 4x more attention than a PDF. cvin.bio`,
  `Remote work in 2021: Available everywhere. Flexible hours. Trust-based.

Remote work in 2026: Hybrid mandatory. Screen monitoring software. Return to office memos.

The market changed fast. Has your approach kept up? cvin.bio`,
  `"Tell me about yourself."

What they actually mean: sell yourself in under 60 seconds or this conversation is over.

The gap between what interviewers ask and what they want is massive.

cvin.bio`,
  `Your CV sits in a folder somewhere. Maybe someone opens it. Probably not.

A profile link works while you sleep. It's shareable. It's always up to date.

One gets lost. One gets found. cvin.bio`,
  `The average job search by the numbers:

100 applications sent.
12 hear back.
4 get interviews.
1 gets the offer.

That funnel is brutal. What if your profile did the work for you? cvin.bio`,
  `Why do candidates actually get rejected?

34% — No online presence
28% — Generic, copy-paste CV
22% — No portfolio to show work
16% — Other reasons

More than half get cut before anyone reads their skills. cvin.bio`,
  `The actual timeline of a job application:

Day 1 — You apply.
Day 14 — Automated acknowledgment.
Day 45 — First human contact.
Day 90 — "We decided to go with someone else."

3 months for a no. That's not a process. cvin.bio`,
  `Sending a PDF vs sharing a link:

PDF: Gets filtered. Gets buried. Can't update it. No idea who reads it.
Link: Bypasses filters. Always accessible. Updates instantly. You see who viewed it.

One click is the difference. cvin.bio`,
  `The job market in 2026 in four numbers:

250 applications per job opening.
7.4 seconds spent per resume.
63% of jobs filled through connections.
85% of applications never seen by a human.

The old way isn't working anymore. cvin.bio`,
  `This was posted on Reddit and went viral.

Someone reported their manager to HR. HR asked them not to file a report — "just a misunderstanding." Two weeks later, they were fired.

When they asked why, the HR guy said: "Why don't you try to figure that out?"

The lesson: always file the official report. Without a paper trail, there's no proof of retaliation.

cvin.bio`,
  `One of the saddest job posts I've seen:

A woman was out of work for a year. She finally got two interviews. The company she was excited about rejected her. The one she dreaded gave her an offer.

Same commute as her old toxic job. Same type of role. Same sinking feeling.

But she took it. Because after a year of silence, sometimes you just need a floor to stop the fall. What would you have done?

cvin.bio`,
  `This guy quit after TWO DAYS.

His new manager screamed at him during sales calls. Slammed things on the desk. Told him to lie to customers.

That weekend, his grandfather passed away. Monday morning, the screaming continued.

He grabbed his stuff and walked out. The manager's parting words? "That's not a good look." Neither is workplace abuse.

cvin.bio`,
  `Someone posted: "I've been rejected from every place in my small town."

Every restaurant. Every store. Every warehouse. All of them said no.

Not because they were unqualified — just unlucky. Some people don't have the luxury of being picky. They just need one yes.

If you're in this spot, keep going. That yes is coming.

cvin.bio`,
  `This one hit hard.

150 applications. 4 months. 12 first-round interviews. One offer.

The catch? $12,000 less than his current salary. Same city. Same work. Same cost of living.

So his options were: stay miserable at $64k, or take a 19% pay cut to leave.

The job market in 2026 is brutal. But your situation won't change if your strategy doesn't.

cvin.bio`,
  `A guy's boss accidentally scheduled his firing meeting THREE DAYS early.

He saw the Teams invite while on vacation with his wife — during their wedding anniversary.

For three days he waited. Panic attacks. Couldn't sleep. Couldn't enjoy anything.

When they finally fired him, they posted his exact job listing 22 minutes later. For $20K less.

cvin.bio`,
  `"Joblessness is one of the worst things that can happen to someone."

This guy was 28. Car parked in the same spot every day. Savings draining.

He got a new job, but his coworker sabotaged his code and lied to the CEO. Three months later, he was fired again.

Over a year gone. All savings gone. Please plan your safety net while you still have one.

cvin.bio`,
  `She accepted a job offer verbally. Did multiple interview rounds. Even presentations.

Was told to expect the contract next week. Instead, she got an email: "We will not be moving forward due to headcount issues."

She'd been out of work for 1.5 years. Now she says she has trust issues with job offers.

The hiring process is broken when people can't even trust a verbal yes.

cvin.bio`,
  `"I changed jobs and I hate it."

She left after 10 years for a better-paying role. But the new office was ugly. No handover. Her predecessor hoarded all files.

The actual job? Correcting spelling in Word. Sending meeting invites. Taking minutes.

She went from doing skilled, independent work to being a glorified assistant. More money isn't always more life.

cvin.bio`,
  `A company literally taunted its employees. Like dogs.

Dangled bonuses and pulled them back. Set impossible KPIs. 2,700 upvotes on Reddit. Hundreds of comments saying "Same."

When the company treats you like a game piece, you're allowed to flip the board. Know your worth and don't let anyone play you.

cvin.bio`,
  `"Loyalty will earn you respect. Rarely a raise."

This guy stayed for 4 years. Never missed a day. Always delivered.

Meanwhile, a new hire walked in at 30% above his salary. On day one.

Internal raises stay flat. The only real raise comes from leaving. Loyalty is a beautiful word — it's just not a pay strategy.

cvin.bio`,
  `The job posting said "Permanent Work From Home."

She applied because the office was too far. She'd been unemployed for 6 months.

Got an interview. Checked the listing again. The WFH part was gone. They edited it after people applied.

Companies lure remote applicants, then switch to onsite. Always screenshot the listing.

cvin.bio`,
  `"I miss working. I miss the dignity of having a job."

That was the entire post. No rant. No details. Just someone who wanted to feel useful again. 658 upvotes.

Work isn't just a paycheck — it's purpose. If you're in between right now, your next chapter isn't over. It hasn't even started yet.

cvin.bio`,
  `He left a good job with great work-life balance for a 75% pay increase at a big tech company.

Week one: fires everywhere. Expected to work nights and weekends. Skip-level managers hijacking standups.

His wife and kids felt it immediately. He called his old boss and asked to come back.

Extra pay isn't worth your peace.

cvin.bio`,
  `Forklift driver with 6 years of experience.

The interviewer said he was the only applicant. Loved his resume. "HR will set up your orientation."

4 AM the next morning: rejection email. "We decided to go with other candidates."

What other candidates? He was the only one. The lying in this market is something else.

cvin.bio`,
  `Someone asked: "Is corporate culture just one big performance and everyone's pretending not to notice?"

Brown-nosing. Fake presentations. Forced team-building nobody wants. Machiavellian games to climb over each other.

1,800 people upvoted. Nobody disagreed. If the culture is a circus, you don't owe them another act.

cvin.bio`,
  `Company let him go. Said the role was being cut. He begged to stay. Decision was final.

6 months later, his replacement quit. HR called: "Would you come back?"

He said no.

Where were they when he needed them? Companies rehire the people they fired — usually at higher salaries.

cvin.bio`,
  `"I have four days to find a job or I'll be removed from my house by force."

400 applications since February. Double-digit interviews. Last three jobs either refused to pay or something went wrong.

Legal citizen. Bank account. Four days until homelessness.

The system doesn't just fail some people — it forgets them entirely.

cvin.bio`,
  `"How do you job search while stuck in a toxic role?"

Managing a team with zero support. Publicly called out in meetings. Blamed when things fail.

Then going home and writing cover letters at midnight.

Burnout plus job hunting is a full-time job on top of a full-time job. You're not weak for struggling.

cvin.bio`,
  `Here's a stat that should make everyone angry: 75% of resumes never reach a human.

Not 50%. Not 60%. Three out of four. Your carefully crafted resume gets filtered out by a robot.

A link doesn't get filtered. It gets clicked. Maybe it's time to stop competing with bots.

cvin.bio`,
  `Hiring today isn't about finding the best person — it's about not making a bad decision.

Roles stay open for months. Interview rounds keep multiplying. Strong candidates get filtered out for minor gaps.

Then companies complain they can't find anyone. Hiring became risk avoidance theater, and everyone is losing.

cvin.bio`,
  `Understaffing has become an epidemic in America.

Pharmacies. Hotels. Grocery stores. Schools. Companies cut headcount and told one person to do the work of three.

Then they called it a "talent shortage." 2,800 upvotes because everyone has lived it.

You're not imagining being overworked. It's by design.

cvin.bio`,
  `Job search on LinkedIn in one image:

Apply → No response. Apply → Auto-rejection in 3 minutes. Apply → "We've decided to move forward with other candidates." Apply → Ghosted.

12,000 upvotes. Because it's literally everyone's experience.

LinkedIn isn't broken. The process behind it is.

cvin.bio`,
  `Best story I've read all month:

He asked for $58k. They offered $65k. Said he was a great fit and wanted to move fast.

After 3 months of unemployment and 150+ applications.

Good employers DO exist. And when they value you, they show it. Don't sell yourself short. Keep applying.

cvin.bio`,
  `If Sunday evenings fill you with dread, that's not laziness. It's your body telling you the deal isn't right.

The commute you hate. The manager you avoid. The Slack you mute at 6pm.

Life is too short to spend 50 weeks a year dreading Monday. Your career isn't a life sentence. It's a choice.

cvin.bio`,
  `He kept a spreadsheet of every job application.

Row 1: Applied. Row 2: Applied. All the way to Row 200.

The Status column was always the same word: Nothing.

200 silences. Not conversations. He didn't need to apply harder. He needed to be found.

Has anyone else tracked their applications like this?

cvin.bio`,
  `A recruiter asked for 3 references. She sent them within the hour.

Told her old manager, her mentor, and her former CTO. "They'll call this week."

All three cleared their schedules. Waited by the phone.

No one called. Not that week. Not ever. The recruiter moved on and never told her.

The system doesn't just waste your time. It wastes the time of people who believe in you.

cvin.bio`,
  `A software engineer applied to his own company's job posting. As an experiment.

Same resume that got him hired 2 years ago. Same skills. Same job title.

The ATS rejected him in 4 minutes.

He was literally doing the job. The algorithm said he wasn't qualified for it. How many people are being filtered out right now?

cvin.bio`,
  `She raised two kids for 10 years.

Managed a household budget tighter than most startups. Coordinated schedules across 4 daily. Negotiated with schools, doctors, contractors.

Every ATS saw one thing: a gap.

Not the decade of management. Not the problem-solving. Just a gap. 10 years of invisible work doesn't fit in a keyword filter.

cvin.bio`,
  `He trained 3 new hires. Covered for his manager during leave. Ran the entire team for 6 months.

When the manager role finally opened up, he applied.

They hired someone external. No interview. No explanation.

The new manager's first request? "Can you help me with onboarding?"

He was asked to train his own boss. Again. Loyalty without leverage is just free labor.

cvin.bio`,
  `47 thank you emails. 0 replies.

She followed every interview rule. Researched the company. Personalized every follow-up.

"Dear hiring team, I really enjoyed our conversation about..."

They didn't even open them.

The effort was real. The system just doesn't care about effort anymore. Sometimes the best thing you can do is stop playing by rules nobody follows.

Has anyone ever gotten a job because of a thank you email?

cvin.bio`,
  `She asked for market rate. They said the budget was fixed. Non-negotiable.

Two weeks later the exact same role was listed again. 25% higher than what she asked for.

The budget wasn't fixed. They just didn't want to pay her.

This happens more than people talk about. Has it happened to you?

cvin.bio`,
  `4 rounds of interviews. 6 hours of her time. Perfect technical scores across the board.

Rejection email: "Not a culture fit."

She looked up the company on Glassdoor. The culture was 12-hour days, mandatory weekend Slack, and a ping pong table nobody was allowed to use during work hours.

She wasn't rejected for not fitting in. She was rejected for having boundaries.

When they say "culture fit" what do they actually mean?

cvin.bio`,
  `3-day unpaid trial. "Just to see if you're a fit."

She redesigned their entire homepage in those 3 days. Rebuilt the navigation. Fixed 14 bugs.

Day 4: ghosted. No call. No email. Nothing.

Two weeks later her design went live on their site. With someone else's name in the credits.

Free labor disguised as an interview process. Has this happened to anyone else?

cvin.bio`,
  `He applied to a company on Monday. Auto-rejected by Tuesday morning.

Wednesday the same company liked his LinkedIn post. Thursday their recruiter commented: "Great insights!"

The algorithm that rejected his resume couldn't connect him with the humans who liked his ideas.

The system is broken when the robot and the human work for the same company but reach opposite conclusions.

cvin.bio`,
  `He gave two weeks notice. Professional. Respectful. By the book.

They walked him out that afternoon. Disabled his badge before lunch. No severance. No goodbye.

Three days later he got a call: "Hey, what's the password to the analytics dashboard?"

Companies expect you to give notice. But loyalty is a one-way street.

cvin.bio`,
  `PhD. 15 years of experience. Applied for a mid-level role because she genuinely wanted it.

Rejection: "We're concerned you'd get bored."

Too junior for senior roles. Too senior for mid-level. Too experienced to start over. Too old to retrain.

At what point is there no door left to knock on? Has anyone been told they're "overqualified"?

cvin.bio`,
  `Job listing said "Remote." She applied because the office was 90 minutes away with two kids at home.

Offer letter said "Remote during onboarding."

Week 3: mandatory office attendance. 5 days a week. No exceptions.

Nobody mentioned it once during the 4 rounds of interviews.

Companies are still pulling bait-and-switch with remote listings. Read every offer letter carefully.

cvin.bio`,
  `He changed one word on his resume. Interview requests tripled overnight.

"Managed" became "Led."

Same projects. Same outcomes. Same person. Same decade of experience. Different keyword.

Your entire career shouldn't depend on whether an algorithm likes your vocabulary. But right now, it does.

Has anyone else cracked the ATS keyword game?

cvin.bio`,
  `He resigned on Tuesday. By Wednesday morning, they found the budget.

The raise they'd denied for 2 years appeared in 24 hours. Suddenly there was room in the comp band.

He made the mistake of staying.

Laid off 3 months later. First round of cuts.

A counter offer isn't a compliment. It's a stalling tactic until they find your replacement.

Never accept a counter offer.

cvin.bio`,
];

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
  const imgUrl = `${IMG_BASE}/post_${imageNum}.png`;
  const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  
  const metadataBlock = platform === 'instagram'
    ? `metadata: { instagram: { type: post, shouldShareToFeed: true } }`
    : platform === 'facebook'
    ? `metadata: { facebook: { type: post } }`
    : '';
  
  const query = `mutation {
    createPost(input: {
      channelId: "${channelId}"
      text: "${escapedText}"
      mode: customScheduled
      schedulingType: automatic
      dueAt: "${dueAt}"
      assets: { images: [{ url: "${imgUrl}" }] }
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

// 3 posts/day: 1 AM, 9 AM, 5 PM IST
function generateSchedule(startIndex) {
  const now = new Date();
  // Start from tomorrow
  let day = new Date(now);
  day.setUTCDate(day.getUTCDate() + 1);
  day.setUTCHours(0, 0, 0, 0);
  
  const slots = [
    { h: 19, m: 30, prevDay: true }, // 1:00 AM IST = 19:30 UTC (previous day)
    { h: 3, m: 30, prevDay: false },  // 9:00 AM IST = 03:30 UTC
    { h: 11, m: 30, prevDay: false }, // 5:00 PM IST = 11:30 UTC
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
