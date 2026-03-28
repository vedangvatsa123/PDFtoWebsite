import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ACCOUNTS = [
  {
    apiKey: process.env.AGENTMAIL_API_KEY || 'am_us_bd628380488f632397ce6b30b630c55a76e1ed5fee96860b5b359332ac7ff7c6',
    inbox: 'cvinbio@agentmail.to'
  },
  {
    apiKey: process.env.AGENTMAIL_API_KEY_2 || 'am_us_b0299617e7fa8dc355c3aaa4eb8464ff6b972f0609ebe664ed798cf7032e47f7',
    inbox: 'quaintmirror345@agentmail.to' // Jessica Miller
  },
  {
    apiKey: process.env.AGENTMAIL_API_KEY_3 || 'am_us_2c975d4bbda82b90af084f0c2936a431f3a5020686247561a75501e9581d5894',
    inbox: 'creepymessage220@agentmail.to' // Michael Smith
  },
  {
    apiKey: process.env.AGENTMAIL_API_KEY_4 || 'am_us_1c24769df244dbbcd0657e51f20105471a6a0feaef0e212f152887c5e40c0f00',
    inbox: 'repulsivehappiness172@agentmail.to' // Alex Carter
  }
];

const MAX_PER_ACCOUNT = 100;

const CLEAN_LIST_PATH = join(__dirname, 'email-list-clean.json');
const LOGS_PATH = join(__dirname, 'email-logs.json');
const SENT_PATH = join(__dirname, 'sent-emails.json');

// 1. Data Loading
const queue = JSON.parse(readFileSync(CLEAN_LIST_PATH, 'utf8'));
const sentList = JSON.parse(readFileSync(SENT_PATH, 'utf8'));
const logs = JSON.parse(readFileSync(LOGS_PATH, 'utf8'));

// 2. Filter & Batch
const totalToSendCount = ACCOUNTS.length * MAX_PER_ACCOUNT;
const toSend = queue.slice(0, totalToSendCount);

if (toSend.length === 0) {
  console.log('No unsent emails in queue.');
  process.exit(0);
}

const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;padding:16px;"><p style="font-size:22px;font-weight:900;color:#000;line-height:1.3;margin:0 0 12px">75% of resumes never reach a human.</p><p style="font-size:15px;color:#333;line-height:1.5;margin:0 0 8px">A robot scans it for keywords. Rejects it in 3 minutes. Nobody read it.</p><p style="font-size:15px;color:#333;line-height:1.5;margin:0 0 8px">A PDF sits in a folder. A <b>link</b> gets shared, clicked, and tracked.</p><p style="font-size:16px;font-weight:700;color:#000;margin:0 0 16px">Turn your CV into a live link. 2 minutes. Free.</p><a href="https://cvin.bio?utm_source=agentmail&amp;utm_medium=email&amp;utm_campaign=cold_v1" style="display:inline-block;padding:10px 28px;font-size:15px;font-weight:700;color:#fff;background:#2563eb;border-radius:50px;text-decoration:none">Make your CV a link &rarr;</a><p style="font-size:12px;color:#bbb;margin:10px 0 0">Free. No credit card. &mdash; cvin.bio</p></div>`;

const text = `75% of resumes never reach a human.\n\nA robot scans it for keywords. Rejects it in 3 minutes. Nobody read it.\n\nA PDF sits in a folder. A link gets shared, clicked, and tracked.\n\nTurn your CV into a live link. 2 minutes. Free.\n\nhttps://cvin.bio?utm_source=agentmail&utm_medium=email&utm_campaign=cold_v1`;

let successfullySent = [];
let failedEmails = [];

console.log(`Starting campaign: Support for ${ACCOUNTS.length} accounts detectors. Total Batch: ${toSend.length}\n`);

for (let accountIndex = 0; accountIndex < ACCOUNTS.length; accountIndex++) {
  const account = ACCOUNTS[accountIndex];
  const startIdx = accountIndex * MAX_PER_ACCOUNT;
  const endIdx = Math.min(startIdx + MAX_PER_ACCOUNT, toSend.length);
  const accountBatch = toSend.slice(startIdx, endIdx);

  if (accountBatch.length === 0) continue;

  console.log(`\n--- Using Account ${accountIndex + 1}: ${account.inbox} ---`);
  let limitReached = false;

  for (const email of accountBatch) {
    if (limitReached) break;

    try {
      const res = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(account.inbox)}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to: email, subject: 'your resume is probably invisible', html, text })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      successfullySent.push(email);
      logs.push({ email, status: 'sent', id: data.message_id, sentAt: new Date().toISOString(), account: account.inbox });
      console.log(`[Account ${accountIndex + 1}] ✓ Sent → ${email}`);
    } else {
      failedEmails.push({ email, error: data.message || res.status });
      logs.push({ email, status: 'failed', error: data.message || res.status, sentAt: new Date().toISOString(), account: account.inbox });
      console.log(`[Account ${accountIndex + 1}] ✗ FAIL → ${email}: ${data.message || res.status}`);
      
      if (data.message && (data.message.includes('Limit exceeded') || data.message.includes('Daily limit'))) {
        console.log(`Account ${accountIndex + 1} limit reached. Skipping remaining batch.`);
        limitReached = true;
      }
    }
    
    await new Promise(r => setTimeout(r, 600)); 
  } catch (e) {
    failedEmails.push({ email, error: e.message });
    console.log(`✗ ERROR → ${email}: ${e.message}`);
  }
  }
}

// 3. Update State
const updatedQueue = queue.filter(e => !successfullySent.includes(e));
const updatedSentList = [...new Set([...sentList, ...successfullySent])];

writeFileSync(CLEAN_LIST_PATH, JSON.stringify(updatedQueue, null, 2));
writeFileSync(SENT_PATH, JSON.stringify(updatedSentList, null, 2));
writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));

console.log(`\nBatch complete! Sent: ${successfullySent.length}, Failed: ${failedEmails.length}`);
console.log(`Queue remaining: ${updatedQueue.length}`);
