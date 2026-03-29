import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHmac, createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────
const REGION     = process.env.AWS_SES_REGION || 'us-west-1';
const ACCESS_KEY = process.env.AWS_SES_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SES_SECRET_ACCESS_KEY;
const FROM_EMAIL = 'Sara <hi@mail.hashtagweb3.com>';
const REPLY_TO   = 'hi@hashtagweb3.com';
const BATCH_SIZE = Number(process.env.SES_BATCH_SIZE) || 999;
const DELAY_MS   = 80;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('❌ Missing AWS_SES_ACCESS_KEY_ID or AWS_SES_SECRET_ACCESS_KEY');
  process.exit(1);
}

// ── A/B/C Subjects ──────────────────────────────────────────────────
const VARIANTS = [
  { id: 'A', subject: 'free week in a startup island', campaign: 'ns_hpair_a' },
  { id: 'B', subject: 'startup island',                campaign: 'ns_hpair_b' },
  { id: 'C', subject: '1 month. 1 island.',            campaign: 'ns_hpair_c' },
];

// ── File paths ──────────────────────────────────────────────────────
const INPUT_PATH  = join(__dirname, 'hpair-verified.json');
const SENT_PATH   = join(__dirname, 'hpair-sent.json');
const LOGS_PATH   = join(__dirname, 'hpair-logs.json');
const TEMPLATE    = readFileSync(join(__dirname, 'ses-template.html'), 'utf8');

// ── Load data ───────────────────────────────────────────────────────
const allEmails = JSON.parse(readFileSync(INPUT_PATH, 'utf8'));
let sent = [];
let logs = [];
try { sent = JSON.parse(readFileSync(SENT_PATH, 'utf8')); } catch {}
try { logs = JSON.parse(readFileSync(LOGS_PATH, 'utf8')); } catch {}

const sentSet = new Set(sent);
const queue   = allEmails.filter(e => !sentSet.has(e));
const batch   = queue.slice(0, BATCH_SIZE);

if (batch.length === 0) {
  console.log('✅ No unsent emails in queue.');
  process.exit(0);
}

// ── Assign variant (round-robin A/B/C) ──────────────────────────────
function getVariant(index) {
  return VARIANTS[index % VARIANTS.length];
}

// ── Text body per variant ───────────────────────────────────────────
function getTextBody(variant, email) {
  return `Network School is a startup society for remote workers, tech founders, and content creators. Located on an island off the coast of Singapore.

Selected applicants are eligible to receive a free 1-week stay when accepted into a month-long cohort at Network School.

What you get: serviced room, healthy meals, 24/7 coworking, gym, world-class speakers, content studio, workshops, fitness classes, and a makerspace.

Apply: https://cvin.bio/api/email-track?action=click&cid=${variant.campaign}&email=${encodeURIComponent(email)}&url=${encodeURIComponent('https://ns.com/hashtagweb3/apply?utm_source=hashtagweb3&utm_medium=email')}

---

hashtagweb3.com - curated web3 jobs from companies actually hiring. No ghost listings.

New roles drop daily on Telegram: https://t.me/web3hiring

---

When you apply - stop sending PDFs. A link gets opened. A PDF gets ignored.
Turn your CV into a live link: https://cvin.bio?utm_source=hashtagweb3&utm_medium=email&utm_campaign=${variant.campaign}

---

Hashtag Web3 - hashtagweb3.com
Unsubscribe: https://hashtagweb3.com/unsubscribe?email=${encodeURIComponent(email)}`;
}

// ── Personalize HTML template with tracking ─────────────────────────
function personalizeHtml(variant, email) {
  const encodedEmail = encodeURIComponent(email);
  const trackBase = `https://cvin.bio/api/email-track`;

  let html = TEMPLATE;

  // Replace open tracking pixel with variant-specific campaign
  html = html.replace(
    /cid=ns_announcement/g,
    `cid=${variant.campaign}`
  );

  // Also fix any existing campaign tags
  html = html.replace(
    /utm_campaign=ns_announcement/g,
    `utm_campaign=${variant.campaign}`
  );

  // Replace email placeholder
  html = html.replace(/\{\{EMAIL\}\}/g, encodedEmail);

  // Wrap Apply CTA with click tracker
  html = html.replace(
    /(href=")([^"]*ns\.com\/hashtagweb3\/apply[^"]*)(")/,
    `$1${trackBase}?action=click&cid=${variant.campaign}&email=${encodedEmail}&url=${encodeURIComponent('https://ns.com/hashtagweb3/apply?utm_source=hashtagweb3&utm_medium=email')}$3`
  );

  // Wrap cvin.bio CTA with click tracker
  html = html.replace(
    /(href=")([^"]*cvin\.bio[^"]*ns_announcement[^"]*)(")/,
    `$1${trackBase}?action=click&cid=${variant.campaign}&email=${encodedEmail}&url=${encodeURIComponent('https://cvin.bio?utm_source=hashtagweb3&utm_medium=email&utm_campaign=' + variant.campaign)}$3`
  );

  // Ensure open pixel exists at bottom
  if (!html.includes(`cid=${variant.campaign}&email=`)) {
    html = html.replace('</body>',
      `<img src="${trackBase}?action=open&cid=${variant.campaign}&email=${encodedEmail}" width="1" height="1" style="display:none;" alt="">\n</body>`
    );
  }

  return html;
}

// ── AWS Signature V4 helpers ────────────────────────────────────────
function hmac(key, data) {
  return createHmac('sha256', key).update(data).digest();
}
function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}
function getSignatureKey(secretKey, dateStamp, region, service) {
  let k = hmac(`AWS4${secretKey}`, dateStamp);
  k = hmac(k, region);
  k = hmac(k, service);
  k = hmac(k, 'aws4_request');
  return k;
}

// ── Build MIME message ──────────────────────────────────────────────
function buildRawEmail(to, variant) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const unsubUrl = `https://hashtagweb3.com/unsubscribe?email=${encodeURIComponent(to)}`;
  const html = personalizeHtml(variant, to);
  const text = getTextBody(variant, to);

  const raw = [
    `From: ${FROM_EMAIL}`,
    `To: ${to}`,
    `Reply-To: ${REPLY_TO}`,
    `Subject: ${variant.subject}`,
    `MIME-Version: 1.0`,
    `List-Unsubscribe: <${unsubUrl}>`,
    `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
    `Precedence: bulk`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(raw).toString('base64');
}

// ── Send via SES SendRawEmail ───────────────────────────────────────
async function sesSendEmail(to, variant) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const host = `email.${REGION}.amazonaws.com`;
  const endpoint = `https://${host}/`;
  const rawMessage = buildRawEmail(to, variant);

  const params = new URLSearchParams({
    'Action': 'SendRawEmail',
    'RawMessage.Data': rawMessage,
    'Version': '2010-12-01',
  });

  const body = params.toString();
  const payloadHash = sha256(body);
  const canonicalHeaders = `content-type:application/x-www-form-urlencoded\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${REGION}/ses/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest)}`;
  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, REGION, 'ses');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Amz-Date': amzDate,
      'Authorization': authHeader,
    },
    body,
  });

  const responseText = await res.text();
  if (!res.ok) throw new Error(responseText.match(/<Message>(.*?)<\/Message>/)?.[1] || responseText);
  return responseText.match(/<MessageId>(.*?)<\/MessageId>/)?.[1] || '';
}

// ── Send loop ───────────────────────────────────────────────────────
let successCount = 0;
let failCount = 0;
const newlySent = [];
const variantStats = { A: 0, B: 0, C: 0 };

console.log(`📧 HPAIR A/B Campaign — Sending ${batch.length} emails via SES\n`);
console.log(`  Variant A: "${VARIANTS[0].subject}"`);
console.log(`  Variant B: "${VARIANTS[1].subject}"`);
console.log(`  Variant C: "${VARIANTS[2].subject}"\n`);

for (let i = 0; i < batch.length; i++) {
  const email = batch[i];
  const variant = getVariant(i);

  try {
    const msgId = await sesSendEmail(email, variant);
    successCount++;
    newlySent.push(email);
    variantStats[variant.id]++;
    logs.push({ email, status: 'sent', variant: variant.id, subject: variant.subject, campaign: variant.campaign, id: msgId, sentAt: new Date().toISOString() });
    if (i % 100 === 0) console.log(`✓ [${i+1}/${batch.length}] ${variant.id} → ${email}`);
  } catch (e) {
    failCount++;
    logs.push({ email, status: 'failed', variant: variant.id, error: e.message, sentAt: new Date().toISOString() });
    console.log(`✗ [${i+1}/${batch.length}] ${variant.id} → ${email}: ${e.message}`);
  }

  await new Promise(r => setTimeout(r, DELAY_MS));
}

// ── Update state ────────────────────────────────────────────────────
const updatedSent = [...sent, ...newlySent];
writeFileSync(SENT_PATH, JSON.stringify(updatedSent, null, 2));
writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));

console.log(`\n✅ Done — Sent: ${successCount}, Failed: ${failCount}`);
console.log(`📊 A/B Split: A=${variantStats.A}, B=${variantStats.B}, C=${variantStats.C}`);
console.log(`📋 Queue remaining: ${queue.length - batch.length}`);
