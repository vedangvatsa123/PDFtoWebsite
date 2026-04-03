import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../images');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Ensure strict brand guidelines: Inter, #FFFFFF, #09090B
const buildHtml = (content) => `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    width: 1600px;
    height: 900px;
    background-color: #FFFFFF;
    color: #09090B;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
  }
  .watermark {
    position: absolute;
    bottom: 40px;
    right: 40px;
    font-size: 24px;
    color: #71717A;
    font-weight: 500;
  }
  .container {
    width: 1200px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  h1 {
    font-size: 80px;
    font-weight: 800;
    letter-spacing: -0.05em;
    margin: 0;
    line-height: 1.1;
  }
  h2 {
    font-size: 48px;
    font-weight: 400;
    color: #71717A;
    margin: 0;
    line-height: 1.3;
  }
  .accent { color: #6366F1; }
  
  /* Utilities */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; width: 100%; }
  .box { padding: 60px; border-left: 8px solid #E4E4E7; background: #FAFAFA; border-radius: 8px; }
  .box-accent { border-left-color: #6366F1; background: #FFFFFF; border: 4px solid #E4E4E7; border-left: 12px solid #6366F1; box-shadow: 0 20px 40px rgba(0,0,0,0.02); }
  .code { font-family: monospace; font-size: 32px; background: #F4F4F5; padding: 20px; border-radius: 8px; color: #3F3F46; }
</style>
</head>
<body>
  ${content}
  <div class="watermark">cvin.bio</div>
</body>
</html>
`;

const templates = [
  {
    name: 'post_01.png',
    html: buildHtml(`
      <div class="container" style="text-align: center; align-items: center;">
        <h1 style="font-size: 160px; color: #09090B;">72%</h1>
        <h2 style="font-size: 56px; max-width: 900px; line-height: 1.4;">Of all resumes are silently rejected by the ATS before a human ever reads them.</h2>
      </div>
    `)
  },
  {
    name: 'post_02.png',
    html: buildHtml(`
      <div class="container">
        <h1>The Two-Column Collapse</h1>
        <div class="grid-2" style="margin-top: 40px;">
          <div>
            <h2 style="font-size: 32px; margin-bottom: 20px; color: #09090B; font-weight: 700;">Your PDF Layout:</h2>
            <div class="box" style="display: flex; gap: 40px;">
              <div style="flex: 1;"><div style="font-weight: 800; font-size: 24px;">SKILLS</div><div style="color: #71717A; font-size: 24px; margin-top:10px;">React<br>Node.js</div></div>
              <div style="flex: 3;"><div style="font-weight: 800; font-size: 24px;">EXPERIENCE</div><div style="color: #71717A; font-size: 24px; margin-top:10px;">Senior Developer<br>2021-2023</div></div>
            </div>
          </div>
          <div>
            <h2 style="font-size: 32px; margin-bottom: 20px; color: #09090B; font-weight: 700;">What the ATS Reads:</h2>
            <div class="box" style="background: #FEE2E2; border-left-color: #EF4444;">
              <div class="code" style="background: transparent; color: #991B1B; padding:0;">"SKILLS EXPERIENCE React Senior Developer Node.js 2021-2023"</div>
              <div style="color: #DC2626; font-weight: 700; margin-top: 20px; font-size: 28px;">Result: Malformed Data Match (Rejected)</div>
            </div>
          </div>
        </div>
      </div>
    `)
  },
  {
    name: 'post_03.png',
    html: buildHtml(`
      <div class="container">
        <h1>Invisible Vectors</h1>
        <h2>Older OCR parsers silently drop SVG icons.</h2>
        <div class="grid-2" style="margin-top: 40px;">
          <div class="box">
            <h2 style="font-size: 32px; color: #09090B; margin-bottom: 10px;">Standard Text</h2>
            <div class="code" style="margin-top: 20px;">Email: alex@gmail.com</div>
            <div style="margin-top: 20px; font-size: 24px; color: #10B981; font-weight: 800;">✓ Mapped to Database</div>
          </div>
          <div class="box" style="background: #FEE2E2; border-left-color: #EF4444;">
            <h2 style="font-size: 32px; color: #09090B; margin-bottom: 10px;">Fancy Vector Icon</h2>
            <div class="code" style="margin-top: 20px;">[Invisible SVG] alex@gmail.com</div>
            <div style="margin-top: 20px; font-size: 24px; color: #DC2626; font-weight: 800;">✗ Orphaned String (Dropped)</div>
          </div>
        </div>
      </div>
    `)
  },
  {
    name: 'post_04.png',
    html: buildHtml(`
      <div class="container" style="text-align: center; align-items: center;">
        <h1 style="font-size: 140px; margin-bottom: 40px;"><span style="color:#DC2626;">ReactJS</span> <span style="color:#71717A;">!=</span> React.js</h1>
        <h2 style="font-size: 48px; max-width: 1000px; line-height: 1.4;">Legacy ATS systems use dumb boolean matching, not smart LLMs. A single variation in punctuation drops your match score entirely.</h2>
      </div>
    `)
  },
  {
    name: 'post_05.png',
    html: buildHtml(`
      <div class="container">
        <h1>DOCX is an XML Tree</h1>
        <h2>A single complex table can break the node hierarchy.</h2>
        <div class="box" style="margin-top: 40px; border-left: none; background: #18181B; color: #A1A1AA;">
          <pre style="font-family: monospace; font-size: 28px; line-height: 1.5; margin: 0;">
&lt;w:document&gt;
  &lt;w:body&gt;
    &lt;w:tbl&gt;
      &lt;w:tr&gt;
        &lt;w:tc&gt;
          <span style="color: #EF4444; font-weight: bold;">[Error: Unexpected node 'w:vMerge' at path /body/tbl/tr/tc]</span>
          <span style="color: #EF4444; font-weight: bold;">[Fatal: Parser Aborted. Payload empty.]</span>
        &lt;/w:tc&gt;
      &lt;/w:tr&gt;
    &lt;/w:tbl&gt;
  &lt;/w:body&gt;
&lt;/w:document&gt;
          </pre>
        </div>
      </div>
    `)
  },
  {
    name: 'post_06.png',
    html: buildHtml(`
      <div class="container">
        <h1 style="text-align: center; margin-bottom: 80px;">Stop playing their game.</h1>
        <div class="grid-2">
          <div style="text-align: center;">
            <h2 style="font-size: 40px; margin-bottom: 40px; text-decoration: line-through; color: #A1A1AA;">The Old Way</h2>
            <div style="font-size: 40px; font-weight: 800; color: #71717A;">Upload PDF</div>
            <div style="font-size: 40px; color: #A1A1AA; margin: 20px 0;">↓</div>
            <div style="font-size: 40px; font-weight: 800; color: #71717A;">ATS Black Box</div>
            <div style="font-size: 40px; color: #A1A1AA; margin: 20px 0;">↓</div>
            <div style="font-size: 40px; font-weight: 800; color: #DC2626;">Silent Rejection</div>
          </div>
          <div class="box-accent" style="text-align: center;">
            <h2 style="font-size: 40px; margin-bottom: 40px; color: #6366F1; font-weight: 800;">The New Way</h2>
            <div style="font-size: 40px; font-weight: 800; color: #09090B;">Share Live URL</div>
            <div style="font-size: 40px; color: #A1A1AA; margin: 20px 0;">↓</div>
            <div style="font-size: 40px; font-weight: 800; color: #09090B;">Bypass Algorithms</div>
            <div style="font-size: 40px; color: #A1A1AA; margin: 20px 0;">↓</div>
            <div style="font-size: 40px; font-weight: 800; color: #10B981;">Direct to Human</div>
          </div>
        </div>
      </div>
    `)
  }
];

async function generate() {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 }); // Retnia quality

  for (const t of templates) {
    const outPath = path.join(OUT_DIR, t.name);
    console.log('Rendering', t.name);
    await page.setContent(t.html, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: outPath, type: 'png' });
  }

  await browser.close();
  console.log('All 6 high-fidelity thread images generated flawlessly in .github/images');
}

generate().catch(console.error);
