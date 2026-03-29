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
const BATCH_SIZE = Number(process.env.SES_BATCH_SIZE) || 400;
const DELAY_MS   = 80;  // 12.5/sec — stays under 14/sec SES limit

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('❌ Missing AWS_SES_ACCESS_KEY_ID or AWS_SES_SECRET_ACCESS_KEY');
  process.exit(1);
}

// ── File paths ──────────────────────────────────────────────────────
const RECIPIENTS_PATH = join(__dirname, 'ses-recipients.json');
const SENT_PATH       = join(__dirname, 'ses-sent.json');
const LOGS_PATH       = join(__dirname, 'ses-logs.json');
const TEMPLATE_PATH   = join(__dirname, 'ses-template.html');

// ── Load data ───────────────────────────────────────────────────────
const allRecipients = JSON.parse(readFileSync(RECIPIENTS_PATH, 'utf8'));
const sent          = JSON.parse(readFileSync(SENT_PATH, 'utf8'));
const logs          = JSON.parse(readFileSync(LOGS_PATH, 'utf8'));
const htmlTemplate  = readFileSync(TEMPLATE_PATH, 'utf8');

const SUBJECT = 'Network School x Hashtag Web3';

const TEXT_BODY_TEMPLATE = `Network School is a startup society for remote workers, tech founders, and content creators. Located on an island off the coast of Singapore.

Selected applicants are eligible to receive a free 1-week stay when accepted into a month-long cohort at Network School.

What you get: serviced room, healthy meals, 24/7 coworking, gym, world-class speakers, content studio, workshops, fitness classes, and a makerspace.

Apply: https://ns.com/hashtagweb3/apply?utm_source=hashtagweb3&utm_medium=email&utm_campaign=ns_announcement&utm_content=apply_cta

---

hashtagweb3.com - curated web3 jobs from companies actually hiring. No ghost listings.

New roles drop daily on Telegram: https://t.me/web3hiring

---

When you apply - stop sending PDFs. A link gets opened. A PDF gets ignored.
Turn your CV into a live link: https://cvin.bio?utm_source=hashtagweb3&utm_medium=email&utm_campaign=ns_announcement

---

Hashtag Web3 - hashtagweb3.com
You received this because you signed up on one of our platforms or were referred by a partner.
Unsubscribe: https://hashtagweb3.com/unsubscribe?email={{EMAIL}}`;

// ── Filter already-sent + blacklist ─────────────────────────────────
let doNotSend = new Set();
try { doNotSend = new Set(JSON.parse(readFileSync(join(__dirname, 'global-do-not-send.json'), 'utf8'))); } catch {}
if (doNotSend.size > 0) console.log(`🚫 Loaded ${doNotSend.size} blacklisted emails`);

const sentSet = new Set(sent);
const queue   = allRecipients.filter(e => !sentSet.has(e) && !doNotSend.has(e));
const batch   = queue.slice(0, BATCH_SIZE);

if (batch.length === 0) {
  console.log('✅ No unsent emails in queue.');
  process.exit(0);
}

console.log(`📧 Sending ${batch.length} emails via SES (${REGION})\n`);

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

// ── Build MIME message with proper headers ──────────────────────────
function buildRawEmail(to) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const unsubUrl = `https://hashtagweb3.com/unsubscribe?email=${encodeURIComponent(to)}`;
  const personalizedHtml = htmlTemplate.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(to));
  const personalizedText = TEXT_BODY_TEMPLATE.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(to));

  const raw = [
    `From: ${FROM_EMAIL}`,
    `To: ${to}`,
    `Reply-To: ${REPLY_TO}`,
    `Subject: ${SUBJECT}`,
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
    personalizedText,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    personalizedHtml,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(raw).toString('base64');
}

// ── Send via SES SendRawEmail ───────────────────────────────────────
async function sesSendEmail(to) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);

  const host = `email.${REGION}.amazonaws.com`;
  const endpoint = `https://${host}/`;

  const rawMessage = buildRawEmail(to);

  const params = new URLSearchParams({
    'Action':              'SendRawEmail',
    'RawMessage.Data':     rawMessage,
    'Version':             '2010-12-01',
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

  const text = await res.text();
  if (!res.ok) throw new Error(text.match(/<Message>(.*?)<\/Message>/)?.[1] || text);

  const msgId = text.match(/<MessageId>(.*?)<\/MessageId>/)?.[1] || '';
  return msgId;
}

// ── Send loop ───────────────────────────────────────────────────────
let successCount = 0;
let failCount = 0;
const newlySent = [];

for (const email of batch) {
  try {
    const msgId = await sesSendEmail(email);
    successCount++;
    newlySent.push(email);
    logs.push({ email, status: 'sent', id: msgId, sentAt: new Date().toISOString() });
    console.log(`✓ ${email}`);
  } catch (e) {
    failCount++;
    logs.push({ email, status: 'failed', error: e.message, sentAt: new Date().toISOString() });
    console.log(`✗ ${email}: ${e.message}`);
  }

  await new Promise(r => setTimeout(r, DELAY_MS));
}

// ── Update state ────────────────────────────────────────────────────
const updatedSent = [...sent, ...newlySent];
writeFileSync(SENT_PATH, JSON.stringify(updatedSent, null, 2));
writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));

console.log(`\n✅ Done — Sent: ${successCount}, Failed: ${failCount}, Queue remaining: ${queue.length - batch.length}`);
