const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = '/Users/vedang/Desktop/data_cards';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const cards = [
  { file: '1_75pct_resumes.png', stat: '75%', context: 'of resumes never reach a human' },
  { file: '2_7seconds_cv.png', stat: '7.4', context: 'seconds a recruiter spends on your CV' },
  { file: '3_250_applications.png', stat: '250', context: 'average applications per job opening in 2026' },
  { file: '4_240k_bad_hire.png', stat: '$240,000', context: 'average cost of one bad hire' },
  { file: '5_85pct_networking.png', stat: '85%', context: 'of jobs are filled through networking, not applications' },
  { file: '6_63pct_entry_level.png', stat: '63%', context: 'of entry-level jobs require 3+ years experience' },
  { file: '7_92million_displaced.png', stat: '92 million', context: 'jobs will be displaced by 2030' },
  { file: '8_6seconds_reject.png', stat: '6 seconds', context: 'before your CV hits the reject pile' },
  { file: '9_72pct_ghosted.png', stat: '72%', context: 'of candidates are ghosted after a final interview' },
  { file: '10_3of4_robot.png', stat: '3 out of 4', context: 'resumes are rejected by a robot, not a person' },
];

function buildHtml(stat, context) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px;
    height: 1080px;
    background: #0a0a0f;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
    position: relative;
    overflow: hidden;
  }
  body::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at 50% 40%, rgba(30, 30, 50, 0.6) 0%, transparent 70%);
  }
  .stat {
    font-size: 180px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -4px;
    line-height: 1;
    text-align: center;
    position: relative;
    z-index: 1;
    margin-bottom: 30px;
  }
  .context {
    font-size: 32px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.45);
    text-align: center;
    max-width: 700px;
    line-height: 1.4;
    position: relative;
    z-index: 1;
  }
  .brand {
    position: absolute;
    bottom: 48px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 22px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: 2px;
    z-index: 1;
  }
</style>
</head>
<body>
  <div class="stat">${stat}</div>
  <div class="context">${context}</div>
  <div class="brand">cvin.bio</div>
</body>
</html>`;
}

function buildCarouselHtml(allCards) {
  const pages = allCards.map(c => `
    <div class="page">
      <div class="stat">${c.stat}</div>
      <div class="context">${c.context}</div>
      <div class="brand">cvin.bio</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: 1080px 1080px; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .page {
    width: 1080px;
    height: 1080px;
    background: #0a0a0f;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }
  .page::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at 50% 40%, rgba(30, 30, 50, 0.6) 0%, transparent 70%);
  }
  .stat {
    font-size: 180px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -4px;
    line-height: 1;
    text-align: center;
    position: relative;
    z-index: 1;
    margin-bottom: 30px;
  }
  .context {
    font-size: 32px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.45);
    text-align: center;
    max-width: 700px;
    line-height: 1.4;
    position: relative;
    z-index: 1;
  }
  .brand {
    position: absolute;
    bottom: 48px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 22px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: 2px;
    z-index: 1;
  }
</style>
</head>
<body>${pages}</body>
</html>`;
}

async function generate() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  // Generate individual PNGs
  for (const card of cards) {
    await page.setContent(buildHtml(card.stat, card.context), { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 200));
    const outputPath = path.join(outDir, card.file);
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log('Generated ' + card.file);
  }

  // Generate carousel PDF
  await page.setContent(buildCarouselHtml(cards), { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 500));
  const pdfPath = path.join(outDir, 'data_cards_carousel.pdf');
  await page.pdf({
    path: pdfPath,
    width: '1080px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log('Generated carousel PDF: ' + pdfPath);

  await browser.close();
  console.log('\nDone!');
}

generate().catch(console.error);
