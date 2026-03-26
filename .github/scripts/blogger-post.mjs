import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────
const BLOG_ID = '3228687016233406726';
const SERVICE_ACCOUNT = JSON.parse(process.env.BLOGGER_SERVICE_ACCOUNT || '{}');
const STATE_FILE = path.join(__dirname, 'blogger-state.json');
const SITE_URL = 'https://cvin.bio';

// ── Blog articles to publish (one per day) ───────────────────────────────
const ARTICLES = [
  { slug: 'cv-attachments', title: 'Why You Should Stop Sending PDF Resumes' },
  { slug: 'mobile-responsive-cv', title: 'The Silent Killer: How Non-Responsive Resumes Cost You Interviews' },
  { slug: 'cv-web-link', title: 'Why a URL is the Ultimate Professional Move' },
  { slug: 'bypass-ats', title: 'Bypassing Formatting Destruction with Dual-Submissions' },
  { slug: 'stand-out-inbox', title: 'Using Clean URLs to Stand Out in Application Inboxes' },
  { slug: 'pdf-breaks-ats', title: 'Why Complex PDFs Break Recruiter Algorithms' },
  { slug: 'tech-resume-keywords', title: 'Mapping Visual Hierarchy for Technical Recruiters' },
  { slug: 'update-cv-anytime', title: 'The Hidden Advantage of Fixing Typos Anytime' },
  { slug: 'objective-statement-death', title: 'Drop the Objective Section' },
  { slug: 'overstuffing-bullets', title: 'Write Shorter Job Details' },
  { slug: 'measuring-impact-no-data', title: 'How to Show Value Without Money Numbers' },
  { slug: 'short-tenures-tech', title: 'How to Explain Short Jobs' },
  { slug: 'keyword-trust', title: 'Stop Faking Your Skills List' },
  { slug: 'soft-skills-evidence', title: 'Prove You Can Work With Others' },
  { slug: 'the-30-second-scan', title: 'Write For the 30 Second Scan' },
  { slug: 'gap-explanation', title: 'How to Explain Time Off' },
  { slug: 'academic-to-commercial', title: 'How to Sell Your PhD' },
  { slug: 'generic-skill-bars', title: 'Stop Using Skill Progress Bars' },
  { slug: 'beat-smart-ai-bots', title: 'How to Beat Smart AI Resume Bots' },
  { slug: 'where-to-put-ai-skills', title: 'Where to Put AI Skills on Your Page' },
  { slug: 'show-your-code', title: 'Show Your Code Do Not Just List It' },
  { slug: 'college-degrees-matter-less', title: 'Why College Degrees Matter Less Now' },
  { slug: 'two-page-resume-myth', title: 'The Two Page Resume Myth' },
];

// ── JWT / Google OAuth2 ──────────────────────────────────────────────────
function base64url(data) {
  return Buffer.from(data).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/blogger',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(SERVICE_ACCOUNT.private_key, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${unsigned}.${signature}`;
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const jwt = createJWT();
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          j.access_token ? resolve(j.access_token) : reject(new Error(d));
        } catch { reject(new Error('Token parse error: ' + d)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Fetch article content from cvin.bio ──────────────────────────────────
function fetchArticle(slug) {
  return new Promise((resolve, reject) => {
    https.get(`${SITE_URL}/${slug}`, res => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, r2 => {
          let d = '';
          r2.on('data', c => d += c);
          r2.on('end', () => resolve(d));
        }).on('error', reject);
        return;
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

// ── Create Blogger post ──────────────────────────────────────────────────
function createPost(token, title, htmlContent, slug) {
  return new Promise((resolve, reject) => {
    const postBody = JSON.stringify({
      kind: 'blogger#post',
      blog: { id: BLOG_ID },
      title,
      content: htmlContent,
    });
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: `/blogger/v3/blogs/${BLOG_ID}/posts/`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(postBody);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  let state = { index: 0, lastPostedAt: null, published: [] };
  if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  if (state.index >= ARTICLES.length) {
    console.log(`✅ All ${ARTICLES.length} articles published to Blogger.`);
    process.exit(0);
  }

  const article = ARTICLES[state.index];
  console.log(`Publishing #${state.index + 1}/${ARTICLES.length}: "${article.title}"`);

  // Get access token
  const token = await getAccessToken();
  console.log('✅ Got access token');

  // Build HTML content with canonical link back and CTA
  const canonicalUrl = `${SITE_URL}/${article.slug}`;
  const htmlContent = `
    <p><em>Originally published at <a href="${canonicalUrl}" rel="canonical">${canonicalUrl}</a></em></p>
    <hr/>
    <p>Read the full article on our website for the best experience:</p>
    <p><strong><a href="${canonicalUrl}?utm_source=blogger&utm_medium=blog&utm_campaign=crosspost">👉 Read "${article.title}" on CVin.Bio</a></strong></p>
    <hr/>
    <p><strong>Turn your CV into a shareable webpage in seconds.</strong></p>
    <p>Drop any format. Get a live profile link. Share with recruiters.</p>
    <p><a href="${SITE_URL}?utm_source=blogger&utm_medium=blog&utm_campaign=cta">Try CVin.Bio →</a></p>
  `;

  const result = await createPost(token, article.title, htmlContent, article.slug);

  if (result.status === 200 || result.status === 201) {
    console.log(`✅ Published "${article.title}" to Blogger`);
    state.index++;
    state.lastPostedAt = new Date().toISOString();
    if (!state.published) state.published = [];
    state.published.push({ slug: article.slug, publishedAt: state.lastPostedAt });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } else {
    console.error(`❌ Failed (${result.status}):`, result.body);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
