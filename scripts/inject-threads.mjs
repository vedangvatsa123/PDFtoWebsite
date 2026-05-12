import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '..', '.github', 'scripts', 'x-content.json');
const content = JSON.parse(readFileSync(file, 'utf8'));

const newThreads = [
  {
    id: 't012',
    topic: 'what-hiring-managers-look-at',
    tweets: [
      { text: "What hiring managers actually look at.\n\n10 things that matter more than your GPA or your degree.\n\nSave this. 🧵", img: ".github/images/threads/t12_01.png" },
      { text: "1. Your GitHub activity.\n\nNot how many stars you have. Your contribution history.\n\nConsistent commits over months beat one viral repo that you never touched again. They want to see that you actually write code regularly.", img: ".github/images/threads/t12_02.png" },
      { text: "2. Live project links.\n\nA deployed app beats a PDF portfolio every single time.\n\nIf a hiring manager can click a link and see your work running in their browser, you are already ahead of 90% of applicants.", img: ".github/images/threads/t12_03.png" },
      { text: "3. How you describe your work.\n\n\"Built a REST API\" says nothing. \"Reduced API response time by 40% by implementing caching\" says everything.\n\nThe difference between a junior and a senior resume is specificity.", img: ".github/images/threads/t12_04.png" },
      { text: "4. Your most recent role.\n\nThey spend 80% of their time reading about your last 2 years. Everything before that gets a quick scan at best.\n\nFront-load the resume with your freshest, most relevant work.", img: ".github/images/threads/t12_05.png" },
      { text: "5. Technical writing.\n\nBlog posts. READMEs. Documentation.\n\nClarity of thought is hard to fake. If you can explain a complex system in plain language, that tells them you actually understand it.", img: ".github/images/threads/t12_06.png" },
      { text: "6. Side projects that solve real problems.\n\nNot tutorial clones. Something you built because you actually needed it.\n\nA budget tracker you use daily is worth more than 10 todo apps you built for practice.", img: ".github/images/threads/t12_07.png" },
      { text: "7. How you talk about tradeoffs.\n\nEvery senior hire gets evaluated on judgment, not just technical skill.\n\n\"We chose Postgres over Mongo because our data was highly relational\" shows you think about decisions, not just execute them.", img: ".github/images/threads/t12_08.png" },
      { text: "8. Cultural signals.\n\nOpen source contributions. Community involvement. Conference talks, even small ones.\n\nSigns that you care about the craft beyond your 9-to-5. That signal is hard to manufacture.", img: ".github/images/threads/t12_09.png" },
      { text: "The pattern is simple. Show your work. Make it accessible. Make it clickable.\n\nA live profile link beats a PDF attachment every time.\n\ncvin.bio", img: ".github/images/threads/t12_10.png" },
    ],
  },
  {
    id: 't013',
    topic: 'first-dev-job-90-days',
    tweets: [
      { text: "How to go from zero to hired as a developer in 90 days.\n\nNo CS degree needed. No bootcamp required. Just a clear plan and consistent effort.\n\nThis is the path that works the most. 🧵", img: ".github/images/threads/t13_01.png" },
      { text: "Days 1-10. Pick one language and stick with it.\n\nJavaScript or Python. Nothing else.\n\nThe biggest mistake beginners make is jumping between languages every week. You do not need to know five languages. You need to know one well.", img: ".github/images/threads/t13_02.png" },
      { text: "Days 11-25. Build something real every single day.\n\nNot tutorials. Not following along with videos. Actually building things.\n\nA weather widget. A bookmark manager. Small, complete projects that you finish and ship.", img: ".github/images/threads/t13_03.png" },
      { text: "Days 26-40. Learn Git and deploy everything.\n\nEvery project goes on GitHub. Every project gets deployed live.\n\nVercel, Netlify, or Railway. It does not matter where. What matters is that someone can click a link and see it working.", img: ".github/images/threads/t13_04.png" },
      { text: "Days 41-55. Build one project that solves a real problem.\n\nNot a tutorial clone. Something you or someone you know actually needs.\n\nA budget tracker. A job application log. A habit tracker. Real problems make real portfolio pieces.", img: ".github/images/threads/t13_05.png" },
      { text: "Days 56-65. Read other people's code.\n\nOpen source projects on GitHub. Pull requests from experienced developers. Study how they structure things.\n\nYou learn more from reading good code than from writing bad code.", img: ".github/images/threads/t13_06.png" },
      { text: "Days 66-75. Start applying before you feel ready.\n\nYou will never feel ready. That feeling does not go away even after years of experience.\n\nApply to 10 jobs a day. Treat the job search itself as a skill you are practicing.", img: ".github/images/threads/t13_07.png" },
      { text: "Days 76-85. Prepare for interviews differently.\n\nMost junior roles care more about your projects and how you explain your decisions than LeetCode scores.\n\nPractice explaining your code decisions out loud. That is what interviews actually test.", img: ".github/images/threads/t13_08.png" },
      { text: "Days 86-90. Follow up on everything.\n\nMost candidates never follow up. A simple email two days after an interview puts you ahead of 80% of applicants.\n\nBe specific about something you discussed. Show genuine interest.", img: ".github/images/threads/t13_09.png" },
      { text: "90 days is not a lot of time. But it is enough to build a foundation that gets you in the door.\n\nMake sure your portfolio is live and clickable, not a PDF sitting in a folder.\n\ncvin.bio", img: ".github/images/threads/t13_10.png" },
    ],
  },
  {
    id: 't014',
    topic: 'portfolio-projects-that-impress',
    tweets: [
      { text: "10 portfolio projects that actually get you interviews.\n\nNot todo apps. Not calculator clones. Projects that make hiring managers pause and click.\n\nSave this list. 🧵", img: ".github/images/threads/t14_01.png" },
      { text: "1. A personal finance dashboard.\n\nTrack income, expenses, and savings goals with charts and data visualization.\n\nThis shows you can handle state management, work with data, and build something people would actually use every day.", img: ".github/images/threads/t14_02.png" },
      { text: "2. A job application tracker.\n\nLog applications, interview stages, follow-ups, and outcomes. Include simple analytics.\n\nEvery hiring manager knows the pain of job searching. They instantly relate to this project.", img: ".github/images/threads/t14_03.png" },
      { text: "3. A real-time chat application.\n\nWebSockets, authentication, message history. Does not need to be Slack. Just needs to work.\n\nReal-time features immediately set you apart from candidates who only built static pages.", img: ".github/images/threads/t14_04.png" },
      { text: "4. An API that other people can actually use.\n\nBuild a REST API for something useful. Document it properly. Add rate limiting and error handling.\n\nThis proves you understand backend fundamentals beyond just following a tutorial.", img: ".github/images/threads/t14_05.png" },
      { text: "5. A markdown blog engine.\n\nWrite posts in markdown, render them as styled pages, support tags and search.\n\nThis proves you understand content management, routing, and SEO basics. All things companies care about.", img: ".github/images/threads/t14_06.png" },
      { text: "6. A browser extension.\n\nA tab manager. A reading time estimator. A color picker. Something small but useful.\n\nExtensions show you understand browser APIs and distribution. Most candidates never build one. That is the advantage.", img: ".github/images/threads/t14_07.png" },
      { text: "7. A data scraper with a clean frontend.\n\nScrape public data from an interesting source. Display it in a clean, searchable interface.\n\nThis combines backend skills, data processing, and frontend presentation in one project.", img: ".github/images/threads/t14_08.png" },
      { text: "8. An open source contribution.\n\nNot a whole project. Just one meaningful pull request to an established repository.\n\nThis demonstrates you can read existing code, follow contribution guidelines, and work with a team.", img: ".github/images/threads/t14_09.png" },
      { text: "The best portfolio is not the one with the most projects. It is the one where every project has a live demo link.\n\nMake your work clickable, not downloadable.\n\ncvin.bio", img: ".github/images/threads/t14_10.png" },
    ],
  },
  {
    id: 't015',
    topic: 'salary-negotiation-playbook',
    tweets: [
      { text: "How to negotiate 40% more salary in tech.\n\nMost people accept the first offer. That single decision can cost you $30K or more per year.\n\nHere is the exact playbook. 🧵", img: ".github/images/threads/t15_01.png" },
      { text: "Never share your current salary.\n\nIn many places it is illegal for them to even ask. If they push, say your research shows the market range for this role is a specific number.\n\nThe person who names a number first usually loses.", img: ".github/images/threads/t15_02.png" },
      { text: "Research the actual market rate before the call.\n\nLevels.fyi, Glassdoor, and Blind are useful for this. Look at the specific company, level, and location.\n\nWalk in with three numbers. Your floor. Your target. Your stretch.", img: ".github/images/threads/t15_03.png" },
      { text: "Let them make the first offer. Always.\n\nIf they ask your expectations, give a range where your target is the bottom number.\n\nSaying 140 to 160 means they may offer 140. Say 160 to 180 if you want 160.", img: ".github/images/threads/t15_04.png" },
      { text: "When you get the offer, do not react immediately.\n\nSay thank you and that you need a few days to review the full package. Even if the number is amazing.\n\nUrgency is their tool. Time is yours.", img: ".github/images/threads/t15_05.png" },
      { text: "Negotiate the whole package, not just base salary.\n\nSigning bonus. Equity. Remote work days. Learning budget. PTO. Title.\n\nSometimes a better title now means a $20K raise at your next job.", img: ".github/images/threads/t15_06.png" },
      { text: "Use competing offers if you have them.\n\nYou do not need to name the company. Just say you are evaluating other opportunities in a certain range.\n\nCompetition creates urgency on their side. Use it respectfully.", img: ".github/images/threads/t15_07.png" },
      { text: "Practice the conversation out loud before the call.\n\nNegotiation is a skill. It feels awkward because most people never practice it.\n\nOne rehearsal with a friend removes 90% of the anxiety.", img: ".github/images/threads/t15_08.png" },
      { text: "Know when to stop.\n\nPush too hard and you start the job with a damaged relationship. Get to a number you are happy with and accept gracefully.\n\nThe best negotiators know the line between confident and greedy.", img: ".github/images/threads/t15_09.png" },
      { text: "One negotiation conversation can be worth $100K or more over the life of your career.\n\nMake sure your profile reflects your actual value before you walk in.\n\ncvin.bio", img: ".github/images/threads/t15_10.png" },
    ],
  },
  {
    id: 't016',
    topic: 'startup-truths',
    tweets: [
      { text: "What nobody tells you about working at a startup.\n\nAfter talking to hundreds of people who left big companies for startups, these patterns kept coming up.\n\nRead this before you make the jump. 🧵", img: ".github/images/threads/t16_01.png" },
      { text: "The equity is probably worth nothing.\n\n90% of startups fail. Even the ones that succeed often dilute early employees so heavily that the payout is disappointing.\n\nDo not take a $40K pay cut for equity unless you can genuinely afford to lose it.", img: ".github/images/threads/t16_02.png" },
      { text: "You will wear every hat whether you signed up for it or not.\n\nHired as a frontend developer. Now also doing DevOps, customer support, writing docs, and interviewing candidates.\n\nSome people love this. Some people burn out in six months.", img: ".github/images/threads/t16_03.png" },
      { text: "The culture is the founder.\n\nAt companies under 50 people, culture is not a set of values on a wall. It is whatever the founder does on a bad Tuesday.\n\nMeet the founder before you accept. Watch how they treat the most junior person in the room.", img: ".github/images/threads/t16_04.png" },
      { text: "Speed matters more than quality at most early-stage startups.\n\nYou may ship code you are not proud of. You may skip tests because the deadline is tomorrow.\n\nIf you need structure and code review processes, a Series A startup may not be for you.", img: ".github/images/threads/t16_05.png" },
      { text: "Remote startups can be incredibly lonely.\n\nNo office. A Slack channel with 12 people. A weekly standup on Zoom.\n\nIf you draw energy from being around people, make sure the startup has strong rituals around connection.", img: ".github/images/threads/t16_06.png" },
      { text: "Your manager may have never managed anyone before.\n\nFirst-time managers at startups are the norm, not the exception. You may need to manage up, ask for feedback yourself, and create your own growth plan.\n\nNobody is coming to mentor you. You have to seek it out.", img: ".github/images/threads/t16_07.png" },
      { text: "The upside is real though.\n\nYou learn faster at startups than anywhere else. Two years at a good startup can give you five years of big-company experience.\n\nThe learning curve is steep but the compound effect on your career is massive.", img: ".github/images/threads/t16_08.png" },
      { text: "Ask these questions before you accept.\n\nWhat is your runway. How many months of cash do you have. What does the cap table look like for my equity. Who are your biggest customers.\n\nIf they dodge these questions, that tells you everything.", img: ".github/images/threads/t16_09.png" },
      { text: "Startups are not better or worse than big companies. They are different.\n\nMake sure your profile shows the full range of what you can do.\n\ncvin.bio", img: ".github/images/threads/t16_10.png" },
    ],
  },
];

// Insert before the closing of the threads array
const insertIdx = content.threads.findIndex(t => t.topic === 'broken-workplace-1');
if (insertIdx === -1) {
  content.threads.push(...newThreads);
} else {
  content.threads.splice(insertIdx, 0, ...newThreads);
}

writeFileSync(file, JSON.stringify(content, null, 2) + '\n');
console.log(`✅ Injected ${newThreads.length} threads (${newThreads.reduce((s,t) => s+t.tweets.length, 0)} tweets total)`);
console.log(`Total threads now: ${content.threads.length}`);
