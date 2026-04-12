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

const skillCount = {};
const courseCount = {};
for (const line of lines) {
  const f = parseCsvRow(line);
  const sk = f[5] || '(empty)';
  const co = f[6] || '(empty)';
  skillCount[sk] = (skillCount[sk] || 0) + 1;
  courseCount[co] = (courseCount[co] || 0) + 1;
}

console.log('Top repeated skill combos:');
Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`  ${v}x: ${k}`));
console.log('\nTop repeated courses:');
Object.entries(courseCount).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`  ${v}x: ${k}`));
