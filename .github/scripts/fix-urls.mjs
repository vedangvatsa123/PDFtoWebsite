import { readFileSync, writeFileSync } from 'fs';

function parseCsvRow(row) {
  const f = []; let cur = ''; let inQ = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') { if (inQ && row[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (row[i] === ',' && !inQ) { f.push(cur); cur = ''; } else { cur += row[i]; }
  }
  f.push(cur); return f;
}
function escCsv(s) { if (!s) return ''; if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'; return s; }

async function main() {
  const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
  const lines = csv.split('\n');
  const header = lines[0];
  const rows = lines.slice(1).filter(l => l.trim());

  let boardFixed = 0, urlFixed = 0, removed = 0;
  const updated = [];

  for (const row of rows) {
    const f = parseCsvRow(row);
    let applyUrl = f[4] || '';
    let boardUrl = f[2] || '';

    // Fix 1: SmartRecruiters board URL (col 2): /v1 → /CompanySlug
    if (boardUrl === 'https://careers.smartrecruiters.com/v1' || boardUrl.endsWith('/v1')) {
      const compMatch = applyUrl.match(/smartrecruiters\.com\/([^/]+)/);
      if (compMatch) {
        f[2] = `https://careers.smartrecruiters.com/${compMatch[1]}`;
        boardFixed++;
      }
    }

    // Fix 2: Any remaining API URLs in apply column
    if (applyUrl.includes('api.smartrecruiters.com')) {
      const m = applyUrl.match(/api\.smartrecruiters\.com\/v1\/companies\/([^/]+)\/postings\/(\d+)/);
      if (m) {
        f[4] = `https://jobs.smartrecruiters.com/${m[1]}/${m[2]}`;
        urlFixed++;
      }
    }

    updated.push(f.map(escCsv).join(','));
  }

  // Now validate apply URLs (check for 404s) in parallel batches
  console.log(`Validating ${updated.length} apply URLs...`);
  const final = [];
  for (let i = 0; i < updated.length; i += 50) {
    const batch = updated.slice(i, i + 50);
    const results = await Promise.all(batch.map(async (row) => {
      const f = parseCsvRow(row);
      const url = f[4];
      if (!url || url === 'https://ns.com/jobs') return row; // skip manual entries
      
      try {
        const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        if (r.status === 404 || r.status === 410 || r.status === 403) {
          removed++;
          console.log(`  Removed (${r.status}): ${f[0]} - ${f[3]}`);
          return null;
        }
      } catch {}
      return row;
    }));
    final.push(...results.filter(Boolean));
    console.log(`  ${Math.min(i + 50, updated.length)}/${updated.length} validated (removed: ${removed})`);
  }

  writeFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', [header, ...final].join('\n'));
  console.log(`\nBoard URLs fixed: ${boardFixed}`);
  console.log(`Apply URLs fixed: ${urlFixed}`);
  console.log(`Dead links removed: ${removed}`);
  console.log(`Final rows: ${final.length}`);
}

main().catch(console.error);
