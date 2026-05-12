const fs = require('fs');

const b = JSON.parse(fs.readFileSync('.github/scripts/buffer-content.json', 'utf8'));
const x = JSON.parse(fs.readFileSync('.github/scripts/x-content.json', 'utf8'));

const aiWords = ['delve', 'navigate', 'landscape', 'tapestry', 'testament', 'demystify', 'unveil', 'crucial', 'vital', 'moreover', 'furthermore', 'unlock'];
const emDashes = ['—', '–'];

let count = 0;

function checkText(text, source) {
  if (!text) return;
  const lower = text.toLowerCase();
  
  for (const w of aiWords) {
    if (lower.includes(w)) {
        console.log(`Found AI word "${w}" in ${source}: ${text.substring(0, 30)}...`);
        count++;
    }
  }
  
  for (const e of emDashes) {
    if (lower.includes(e)) {
        console.log(`Found em-dash "${e}" in ${source}: ${text.substring(0, 30)}...`);
        count++;
    }
  }
}

b.linkedin.forEach(t => checkText(t, 'linkedin'));
b.instagram.forEach(t => checkText(t, 'instagram'));
b.facebook.forEach(t => checkText(t, 'facebook'));

x.engagement.forEach(t => checkText(t.text, 'x-engagement'));

console.log(`Done checking. Total slop issues: ${count}`);
