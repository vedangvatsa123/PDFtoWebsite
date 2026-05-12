import { readFileSync } from 'fs';
import path from 'path';

// read the ts file directly to extract the dictionary using basic parsing
const tsContent = readFileSync('./src/lib/company-data.ts', 'utf8');

const regex = /'([^']+)':\s*{\s*slug:[^}]*website:\s*'([^']+)'/g;
let match;
const domains = {};
while ((match = regex.exec(tsContent)) !== null) {
  domains[match[1]] = match[2];
}

console.log('Found', Object.keys(domains).length, 'domains');
console.log('openai:', domains['openai']);
console.log('binance:', domains['binance']);
