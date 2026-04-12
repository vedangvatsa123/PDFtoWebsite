import { readFileSync } from 'fs';

function parseCsvRow(row) {
  const fields = []; let current = ''; let inQ = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') { if (inQ && row[i+1] === '"') { current += '"'; i++; } else inQ = !inQ; }
    else if (row[i] === ',' && !inQ) { fields.push(current); current = ''; }
    else { current += row[i]; }
  }
  fields.push(current); return fields;
}

const GENERIC = ['python, javascript, sql', 'software engineering', 'aws, kubernetes, docker', 'system design, aws', 'python, sql, node'];

async function main() {
  // Get a few Airwallex titles from CSV and board
  const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
  const rows = csv.split('\n').slice(1).filter(l => l.trim());
  
  const awxCsv = [];
  for (const row of rows) {
    const f = parseCsvRow(row);
    if (f[0]?.toLowerCase() === 'airwallex' && GENERIC.includes(f[5])) {
      awxCsv.push(f[3].toLowerCase().trim());
    }
  }

  const r = await fetch('https://api.ashbyhq.com/posting-api/job-board/airwallex');
  const d = await r.json();
  const boardTitles = (d.jobs || []).map(j => j.title.toLowerCase().trim());

  console.log('CSV Airwallex titles (first 5):');
  awxCsv.slice(0, 5).forEach(t => console.log('  CSV: "' + t + '"'));
  
  console.log('\nBoard titles (first 5):');
  boardTitles.slice(0, 5).forEach(t => console.log('  API: "' + t + '"'));

  // Check exact matches
  let matches = 0;
  for (const t of awxCsv) {
    if (boardTitles.includes(t)) matches++;
  }
  console.log('\nExact matches:', matches, '/', awxCsv.length);

  // Try fuzzy: find closest for first CSV title
  if (awxCsv.length > 0) {
    const target = awxCsv[0];
    const close = boardTitles.filter(t => t.includes(target.substring(0, 20)) || target.includes(t.substring(0, 20)));
    console.log('\nClosest matches for "' + target + '":');
    close.slice(0, 3).forEach(t => console.log('  "' + t + '"'));
  }

  // Test fetching one Ashby posting
  if (d.jobs?.length > 0) {
    const testId = d.jobs[0].id;
    const r2 = await fetch('https://api.ashbyhq.com/posting-api/posting/' + testId);
    if (r2.ok) {
      const p = await r2.json();
      const jd = ((p.descriptionHtml || p.descriptionPlain || '')).replace(/<[^>]+>/g, ' ');
      console.log('\nTest JD length:', jd.length, '(first 200 chars): "' + jd.substring(0, 200) + '"');
    } else {
      console.log('\nPosting fetch failed:', r2.status);
    }
  }
}

main().catch(console.error);
