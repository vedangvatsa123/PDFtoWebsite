import { readFileSync } from 'fs';

const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
const lines = csv.split('\n').slice(1).filter(l => l.trim());

function parseCsvRow(row) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (row[i] === ',' && !inQuotes) {
      fields.push(current); current = '';
    } else { current += row[i]; }
  }
  fields.push(current);
  return fields;
}

const GENERIC = ['python, javascript, sql', 'software engineering', 'aws, kubernetes, docker', 'system design, aws', 'python, sql, node'];
const companies = {};
for (const line of lines) {
  const f = parseCsvRow(line);
  if (GENERIC.includes(f[5])) {
    const c = f[0] || 'unknown';
    companies[c] = (companies[c] || 0) + 1;
  }
}

console.log('Companies with generic skills (need retry):');
Object.entries(companies).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${v}x: "${k}"`));
console.log('\nTotal generic rows:', Object.values(companies).reduce((a, b) => a + b, 0));
