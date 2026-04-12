import { readFileSync, writeFileSync } from 'fs';

const dir = '/Users/vedang/PDFtoWebsite/.github/scripts';

// Load all blocklists
const globalDNS = JSON.parse(readFileSync(`${dir}/global-do-not-send.json`, 'utf8'));
const sesRejected = JSON.parse(readFileSync(`${dir}/ses-rejected.json`, 'utf8'));
const linktreeRejected = JSON.parse(readFileSync(`${dir}/linktree-rejected.json`, 'utf8'));
const hpairRejected = JSON.parse(readFileSync(`${dir}/hpair-rejected.json`, 'utf8'));

// Build a unified blocklist set (lowercase)
const blocklist = new Set();

// global-do-not-send.json is an array of emails
globalDNS.forEach(e => blocklist.add(e.toLowerCase().trim()));

// ses-rejected.json — check format (could be array of emails or objects)
sesRejected.forEach(item => {
  const email = typeof item === 'string' ? item : item.email;
  if (email) blocklist.add(email.toLowerCase().trim());
});

// linktree-rejected.json — array of {email, reason}
linktreeRejected.forEach(item => {
  const email = typeof item === 'string' ? item : item.email;
  if (email) blocklist.add(email.toLowerCase().trim());
});

// hpair-rejected.json
if (Array.isArray(hpairRejected)) {
  hpairRejected.forEach(item => {
    const email = typeof item === 'string' ? item : item?.email;
    if (email) blocklist.add(email.toLowerCase().trim());
  });
}

console.log(`\n=== BLOCKLIST SUMMARY ===`);
console.log(`global-do-not-send: ${globalDNS.length}`);
console.log(`ses-rejected:       ${sesRejected.length}`);
console.log(`linktree-rejected:  ${linktreeRejected.length}`);
console.log(`hpair-rejected:     ${hpairRejected.length}`);
console.log(`Total unique blocked emails: ${blocklist.size}\n`);

// Define all campaigns
const campaigns = [
  { name: 'hpair',    sentFile: 'hpair-sent.json' },
  { name: 'linktree', sentFile: 'linktree-sent.json' },
  { name: 'ses',      sentFile: 'ses-sent.json' },
  { name: 'ses-yc',   sentFile: 'ses-yc-sent.json' },
  { name: 'sent-emails', sentFile: 'sent-emails.json' },
];

const allClean = new Set();
const allSent = new Set();

console.log(`=== PER-CAMPAIGN RESULTS ===`);
for (const campaign of campaigns) {
  const sentList = JSON.parse(readFileSync(`${dir}/${campaign.sentFile}`, 'utf8'));
  const clean = sentList.filter(email => !blocklist.has(email.toLowerCase().trim()));
  const removed = sentList.length - clean.length;

  console.log(`\n📧 ${campaign.name}:`);
  console.log(`   Sent: ${sentList.length} | Clean: ${clean.length} | Removed: ${removed}`);

  // Save per-campaign clean file
  writeFileSync(`${dir}/${campaign.name}-clean.json`, JSON.stringify(clean, null, 2));
  console.log(`   → Saved ${campaign.name}-clean.json`);

  sentList.forEach(e => allSent.add(e.toLowerCase().trim()));
  clean.forEach(e => allClean.add(e.toLowerCase().trim()));
}

// Build a combined deduplicated clean list
console.log(`\n=== COMBINED TOTALS ===`);
console.log(`Total sent (all campaigns, unique): ${allSent.size}`);
console.log(`Total clean (all campaigns, unique): ${allClean.size}`);
console.log(`Total removed across all campaigns:  ${allSent.size - allClean.size}`);

// Save unified clean list
const sortedClean = [...allClean].sort();
writeFileSync(`${dir}/all-clean.json`, JSON.stringify(sortedClean, null, 2));
console.log(`\n✅ Saved all-clean.json with ${sortedClean.length} unique clean emails`);
