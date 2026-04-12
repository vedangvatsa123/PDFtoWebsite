import { readFileSync, writeFileSync } from 'fs';

const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
const lines = csv.split('\n');
const header = lines[0];
const rows = lines.slice(1).filter(l => l.trim());

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
    } else {
      current += row[i];
    }
  }
  fields.push(current);
  return fields;
}

function escCsv(s) {
  if (!s) return '';
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Dedup rows by company+title AND dedup skills within each row
const seen = new Set();
const unique = [];
let rowDupes = 0, skillDupes = 0;

for (const row of rows) {
  const fields = parseCsvRow(row);
  const company = (fields[0] || '').toLowerCase().trim();
  const title = (fields[3] || '').toLowerCase().trim();
  const key = company + '|||' + title;

  if (seen.has(key)) { rowDupes++; continue; }
  seen.add(key);

  // Dedup skills (col 5)
  if (fields[5]) {
    const skills = fields[5].split(',').map(s => s.trim()).filter(Boolean);
    const uniqueSkills = [...new Set(skills)];
    if (uniqueSkills.length < skills.length) skillDupes++;
    fields[5] = uniqueSkills.join(', ');
  }

  unique.push(fields.map(escCsv).join(','));
}

console.log(`Total rows: ${rows.length}`);
console.log(`Row duplicates removed: ${rowDupes}`);
console.log(`Rows with duplicate skills fixed: ${skillDupes}`);
console.log(`Final unique rows: ${unique.length}`);

writeFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', [header, ...unique].join('\n'));
console.log('Deduped CSV written.');
