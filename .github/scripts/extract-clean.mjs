import { readFileSync, writeFileSync } from 'fs';

const sent = JSON.parse(readFileSync('./hpair-sent.json', 'utf8'));
const doNotSend = JSON.parse(readFileSync('./global-do-not-send.json', 'utf8'));
const rejected = JSON.parse(readFileSync('./ses-rejected.json', 'utf8'));

const blockedSet = new Set([
  ...doNotSend.map(e => e.toLowerCase().trim()),
  ...rejected.map(r => r.email.toLowerCase().trim())
]);

const clean = sent.filter(e => !blockedSet.has(e.toLowerCase().trim()));

console.log('Total sent:', sent.length);
console.log('Global do-not-send:', doNotSend.length);
console.log('SES rejected:', rejected.length);
console.log('Overlap (bounced/blocked from sent):', sent.length - clean.length);
console.log('Clean emails:', clean.length);

writeFileSync('hpair-clean.json', JSON.stringify(clean, null, 2));
console.log('Written to hpair-clean.json');
