import puppeteer from 'puppeteer';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '.github', 'images', 'threads');
mkdirSync(OUT_DIR, { recursive: true });

const threads = [
  {
    id: 't12',
    cards: [
      { headline: 'What Hiring Managers\nActually Look At', sub: '10 things that matter more than your GPA' },
      { headline: '1. Your GitHub activity', sub: 'Not stars. Contribution history.\nConsistent commits beat one viral repo.' },
      { headline: '2. Live project links', sub: 'A deployed app beats a PDF portfolio\nevery single time.' },
      { headline: '3. How you describe\nyour work', sub: '"Built a REST API" says nothing.\n"Reduced API latency by 40%" says everything.' },
      { headline: '4. Your most\nrecent role', sub: 'They spend 80% of their time\non your last 2 years.' },
      { headline: '5. Technical writing', sub: 'Blog posts, READMEs, documentation.\nClarity of thought is hard to fake.' },
      { headline: '6. Side projects\nthat solve real problems', sub: 'Not tutorial clones.\nSomething you actually use yourself.' },
      { headline: '7. How you talk\nabout tradeoffs', sub: 'Every senior hire is evaluated\non judgment, not just skill.' },
      { headline: '8. Cultural signals', sub: 'Open source contributions. Community involvement.\nSigns that you care beyond the paycheck.' },
      { headline: 'Make your work\nclickable, not downloadable.', sub: 'cvin.bio' },
    ],
  },
  {
    id: 't13',
    cards: [
      { headline: 'First Dev Job\nin 90 Days', sub: 'No CS degree. No bootcamp.\nJust a clear plan.' },
      { headline: 'Days 1-10\nPick one language', sub: 'JavaScript or Python. Nothing else.\nStop jumping between five languages.' },
      { headline: 'Days 11-25\nBuild something\nevery day', sub: 'Not tutorials. Actual projects\nyou finish and deploy.' },
      { headline: 'Days 26-40\nLearn Git.\nDeploy everything.', sub: 'Every project goes on GitHub.\nEvery project gets a live link.' },
      { headline: 'Days 41-55\nBuild one project that\nsolves a real problem', sub: 'A budget tracker. A job log.\nReal problems make real portfolios.' },
      { headline: 'Days 56-65\nRead other\npeople\'s code', sub: 'Open source pull requests.\nYou learn more reading good code\nthan writing bad code.' },
      { headline: 'Days 66-75\nStart applying before\nyou feel ready', sub: 'You will never feel ready.\nThat feeling never goes away.' },
      { headline: 'Days 76-85\nPrepare for interviews\ndifferently', sub: 'Most junior roles care about\nyour projects, not LeetCode scores.' },
      { headline: 'Days 86-90\nFollow up\non everything', sub: 'A simple email after the interview\nputs you ahead of 80% of applicants.' },
      { headline: '90 days is enough\nto get in the door.', sub: 'cvin.bio' },
    ],
  },
  {
    id: 't14',
    cards: [
      { headline: '10 Portfolio Projects\nThat Actually Impress', sub: 'Not todo apps. Not calculator clones.\nProjects that make people pause.' },
      { headline: '1. Personal finance\ndashboard', sub: 'Income, expenses, savings goals.\nData visualization and state management\nin one project.' },
      { headline: '2. Job application\ntracker', sub: 'Log applications, stages, follow-ups.\nEvery hiring manager relates to this\ninstantly.' },
      { headline: '3. Real-time\nchat app', sub: 'WebSockets, authentication, message history.\nReal-time features set you apart\nfrom static page builders.' },
      { headline: '4. A REST API\nother people can use', sub: 'Documentation. Rate limiting. Error handling.\nBackend fundamentals in one project.' },
      { headline: '5. Markdown\nblog engine', sub: 'Write in markdown, render as styled pages.\nRouting, search, and SEO basics\nin one project.' },
      { headline: '6. Browser\nextension', sub: 'Tab manager. Color picker. Reading timer.\nMost candidates never build one.\nThat is the advantage.' },
      { headline: '7. Data scraper\nwith a clean frontend', sub: 'Scrape public data. Display it beautifully.\nBackend + data + frontend combined.' },
      { headline: '8. Open source\ncontribution', sub: 'One meaningful pull request\nto an established project.\nProves you can collaborate.' },
      { headline: 'The best portfolio has\nlive demo links, not PDFs.', sub: 'cvin.bio' },
    ],
  },
  {
    id: 't15',
    cards: [
      { headline: 'The Salary\nNegotiation Playbook', sub: 'Most people accept the first offer.\nThat one decision can cost you\n$30K per year.' },
      { headline: 'Never share your\ncurrent salary', sub: 'In many places it is illegal\nfor them to even ask.\nThe person who names a number first\nusually loses.' },
      { headline: 'Research the market\nrate first', sub: 'Levels.fyi. Glassdoor. Blind.\nWalk in with three numbers.\nFloor. Target. Stretch.' },
      { headline: 'Let them make\nthe first offer', sub: 'If they ask your expectations,\ngive a range where your target\nis the bottom number.' },
      { headline: 'Never react\nimmediately', sub: '"Thank you. I need a few days\nto review the full package."\nUrgency is their tool. Time is yours.' },
      { headline: 'Negotiate the\nwhole package', sub: 'Signing bonus. Equity. Remote days.\nLearning budget. PTO. Title.\nEverything is on the table.' },
      { headline: 'Use competing offers\nif you have them', sub: 'You do not need to name the company.\nCompetition creates urgency on their side.' },
      { headline: 'Practice the\nconversation out loud', sub: 'Negotiation feels awkward because\nyou never practice it.\nRehearse with a friend.' },
      { headline: 'Know when to stop', sub: 'Get to a number you are happy with\nand accept gracefully.\nThe best negotiators know the line.' },
      { headline: 'One conversation can be\nworth $100K+ over your career.', sub: 'cvin.bio' },
    ],
  },
  {
    id: 't16',
    cards: [
      { headline: 'What Nobody Tells You\nAbout Working\nat a Startup', sub: 'Patterns from hundreds of people\nwho made the jump.' },
      { headline: 'The equity is\nprobably worth nothing', sub: '90% of startups fail.\nDo not take a $40K pay cut\nfor options you may never exercise.' },
      { headline: 'You will wear\nevery hat', sub: 'Hired as frontend. Now doing DevOps,\ncustomer support, docs, and hiring.\nSome love this. Some burn out.' },
      { headline: 'The culture\nis the founder', sub: 'Under 50 people, culture is whatever\nthe founder does on a bad Tuesday.\nMeet them before you accept.' },
      { headline: 'Speed matters more\nthan quality', sub: 'You may ship code you are not proud of.\nIf you need structure and code reviews,\na Series A may not be for you.' },
      { headline: 'Remote startups can\nbe incredibly lonely', sub: 'No office. Twelve people in Slack.\nA weekly Zoom standup.\nMake sure they invest in connection.' },
      { headline: 'Your manager may have\nnever managed before', sub: 'First-time managers are the norm.\nNobody is coming to mentor you.\nYou have to seek it out.' },
      { headline: 'The upside\nis real though', sub: 'Two years at a good startup\ncan give you five years\nof big-company experience.' },
      { headline: 'Ask these before\nyou accept', sub: 'What is your runway.\nHow is the cap table structured.\nWho are your biggest customers.\nIf they dodge, that tells you everything.' },
      { headline: 'Startups are not better\nor worse. They are different.', sub: 'cvin.bio' },
    ],
  },
];

async function generateImages() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });

  for (const thread of threads) {
    for (let i = 0; i < thread.cards.length; i++) {
      const card = thread.cards[i];
      const isCTA = i === thread.cards.length - 1;

      const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1600px;
      height: 900px;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
    }
    .content {
      text-align: center;
      max-width: 1400px;
      padding: 0 60px;
    }
    .headline {
      font-weight: 800;
      font-size: ${card.headline.length > 60 ? '72px' : card.headline.length > 40 ? '84px' : '96px'};
      line-height: 1.05;
      color: #09090B;
      letter-spacing: -0.04em;
      margin-bottom: ${isCTA ? '16px' : '28px'};
      white-space: pre-line;
    }
    ${!isCTA ? `.divider {
      width: 56px;
      height: 4px;
      background: #6366F1;
      margin: 0 auto 28px;
    }` : ''}
    .sub {
      font-weight: 400;
      font-size: ${isCTA ? '36px' : '34px'};
      line-height: 1.5;
      color: ${isCTA ? '#6366F1' : '#71717A'};
      white-space: pre-line;
      ${isCTA ? 'font-weight: 600;' : ''}
    }
    .watermark {
      position: absolute;
      bottom: 28px;
      right: 36px;
      font-size: 16px;
      color: #A1A1AA;
      font-weight: 400;
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="content">
    <div class="headline">${card.headline}</div>
    ${!isCTA ? '<div class="divider"></div>' : ''}
    <div class="sub">${card.sub}</div>
  </div>
  ${!isCTA ? '<div class="watermark">cvin.bio</div>' : ''}
</body>
</html>`;

      await page.setContent(html, { waitUntil: 'load', timeout: 10000 });
      await new Promise(r => setTimeout(r, 500)); // let font render
      const filename = `${thread.id}_${String(i + 1).padStart(2, '0')}.png`;
      await page.screenshot({ path: join(OUT_DIR, filename), type: 'png' });
      console.log(`✅ ${filename}`);
    }
  }

  await browser.close();
  console.log(`\nDone. Generated ${threads.length * 10} images.`);
}

generateImages().catch(console.error);
