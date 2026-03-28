import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CLEAN_LIST_PATH = join(__dirname, 'email-list-clean.json');
const SENT_PATH = join(__dirname, 'sent-emails.json');
const INPUT_PATH = join(__dirname, 'new-emails.txt');

if (!existsSync(INPUT_PATH)) {
  console.log('Error: new-emails.txt not found. Create it and paste your emails there.');
  process.exit(1);
}

const rawText = readFileSync(INPUT_PATH, 'utf8');
const currentQueue = JSON.parse(readFileSync(CLEAN_LIST_PATH, 'utf8'));
const sentList = JSON.parse(readFileSync(SENT_PATH, 'utf8'));

// Extract anything that looks like an email
const found = rawText.match(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
const incoming = found.map(e => e.toLowerCase().trim());

// Filter junk, duplicates, already sent, and already queued
const cleanIncoming = [...new Set(incoming)].filter(e => {
  const isJunk = e.includes('maildrop.cc') || e.includes('ruutukf') || e === 'a@email.com' || e.endsWith('.edu') || e.endsWith('.edu.in') || e.endsWith('.ac.in');
  return !isJunk && !currentQueue.includes(e) && !sentList.includes(e);
});

const merged = [...currentQueue, ...cleanIncoming];
writeFileSync(CLEAN_LIST_PATH, JSON.stringify(merged, null, 2));

console.log(`\n--- Processing Results ---`);
console.log(`Found raw strings: ${found.length}`);
console.log(`Unique valid emails: ${[...new Set(incoming)].length}`);
console.log(`New emails added: ${cleanIncoming.length}`);
console.log(`Total queue size: ${merged.length}`);
console.log(`--------------------------\n`);
